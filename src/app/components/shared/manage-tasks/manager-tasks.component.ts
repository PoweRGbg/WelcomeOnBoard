import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RecurringTaskPeriod, Task, TaskCreateRequest, TaskProgress } from '../../../models/task.model';
import { TaskDialogComponent } from '../../shared/task-dialog/task-dialog.component';
import { Router } from '@angular/router';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';
import { TaskFilterComponent } from "../task-filter/task-filter.component";
import { User, UserRole } from '../../../models/user.model';
import { catchError, map, Subscription, switchMap, tap, throwError } from 'rxjs';

@Component({
    selector: 'app-manager-tasks',
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    TaskFilterComponent
],
    templateUrl: './manage-tasks.component.html',
    styleUrl: './manage-tasks.component.scss'
})
export class ManageTasksComponent implements OnInit {
    protected tasks: Task[] = [];
    protected displayedColumns: string[] = ['name', 'department', 'actions', 'actions-edit'];
    protected isLoading = false;
    protected searchTerm = '';
    protected selectedDepartment = '';
    protected departments = ['All Departments'];
    protected currentUser: User | null = null;
    private taskProgress: TaskProgress[] = [];
    private mainSubscription: Subscription | null = null;
    private lastTasksRequest: Date = new Date(); 
    private taskReloadNeeded = false;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
    ) { }

    ngOnInit(): void {
        this.mainSubscription = this.authService.currentUser$.pipe(
            switchMap((currentUser) => {
                return this.backendService.getUserById(currentUser?._id || '').pipe(
                    map((user) => {
                        this.currentUser = user;
                        return user;
                    })
                );
            }),
        ).subscribe(() => {
            this.selectedDepartment = this.currentUser?.department || '';
            this.loadTaskProgress();
            this.loadTasks();
        });
    }

    loadTasks(): void {
        this.isLoading = true;
        this.taskReloadNeeded = this.taskReloadNeeded || !this.tasks.length || this.getTaskRequestExpired();
        const searchQuery = this.searchTerm.trim() || undefined;
        const categoryFilter = this.selectedDepartment || undefined;

        if (this.taskReloadNeeded) {
            this.backendService.getTasks(1, 50, categoryFilter, searchQuery).subscribe({
                next: (tasks) => {
                    this.tasks = this.filterTasks(tasks);
                    this.isLoading = false;
                    this.lastTasksRequest = new Date();
                    this.taskReloadNeeded = false;
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(`Error loading tasks: ${error.message}`, 'Close', { duration: 5000 });
                }
            });
        } else {
            console.log('Filtering available tasks');
            this.isLoading = false;
            this.tasks = this.filterTasks(this.tasks);
        }
        
        if (this.departments.length === 1) {
            this.backendService.getDepartments().subscribe({
                next: (departments) => {
                    this.departments = departments;
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(`Error loading departments: ${error.message}`, 'Close', { duration: 5000 });
                }
            });
        }
    }

    protected loadTaskProgress(): void {
        this.isLoading = true;

        if (!!this.currentUser?._id) {
            this.backendService.getTaskProgressByUserId(this.currentUser._id).subscribe({
                next: (taskProgress) => {
                    this.isLoading = false;
                    this.taskProgress = taskProgress;
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(`Error loading tasks: ${error.message}`, 'Close', { duration: 5000 });
                }
            });
        }
    }

    onSearchChange(searchTerm: string): void {
        this.searchTerm = searchTerm;
        // We already called loadTasks, so don't call it again
        if (!this.tasks.length && !searchTerm.length) {
            this.loadTasks();
            return;
        }
        this.tasks = this.filterTasks(this.tasks);
    }

    onDepartmentChange(selectedDepartment: string): void {
        if (this.selectedDepartment === selectedDepartment) {
            return;
        } else {
            this.taskReloadNeeded = true;
            this.selectedDepartment = selectedDepartment;
            this.loadTasks();
        }
    }

    createTask(): void {
        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '90vw',
            maxWidth: '900px',
            data: { 
                currentUser: { 
                        _id: this.currentUser?._id!,
                        username: '',
                        firstName: '',
                        lastName: '',
                        department: this.currentUser?.department
                    },
                allowStatusToggle: false }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
                this.snackBar.open('Task created successfully!', 'Close', { duration: 3000 });
            }
        });
    }

    navigateToCreateTask(): void {
        // Navigate to the task creation page
        this.router.navigate(['/employee/suggestions']);
    }

    editTask(task: Task): void {
        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '90vw',
            maxWidth: '900px',
            data: { task: task, currentUser: { id: this.currentUser?._id, username: '', firstName: '', lastName: '' }, allowStatusToggle: false }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
                this.snackBar.open('Task updated successfully!', 'Close', { duration: 3000 });
            }
        });
    }

    deleteTask(task: Task): void {
        if (confirm(`Are you sure you want to delete task "${task.name}"?`)) {
            this.backendService.deleteTask(task.id).pipe((isDeleted) => isDeleted).subscribe(
                (isDeleted) => {
                    this.loadTasks();
                    if (isDeleted) {
                        this.snackBar.open('Task deleted successfully!', 'Close', { duration: 3000 });
                    }
                }
            );
        }
    }

    duplicateTask(task: Task): void {
        const newTask: TaskCreateRequest = {
            name: `${task.name} (Copy)`,
            description: task.description || '',
            department: task.department,
            url: task.url || '',
            actions: task.actions || [],
            isActive: task.isActive,
            createdBy: this.currentUser?._id || '',
            recurring: task.recurring || RecurringTaskPeriod.NONE,
            dueDate: task.recurring !== RecurringTaskPeriod.NONE ? task.dueDate : undefined
        };

        this.backendService.createTask(newTask).pipe(
            tap((taskCopy) => {
                this.snackBar.open('Task duplicated successfully!', 'Close', { duration: 3000 });
            }),
            catchError((error) => {
                this.snackBar.open(`Error duplicating task: ${error.message}`, 'Close', { duration: 5000 });
                return throwError(() => error);
            })
        ).subscribe(() => {
            this.loadTasks();
        });
    }

    getTaskStatus(task: Task): string {
        if (this.getProgressForTask(task.id)?.isCompleted) return 'Completed';
        return 'Not Started';
    }

    getTaskStatusColor(task: Task): string {
        if (this.getProgressForTask(task.id)?.isCompleted) return 'primary';
        return 'basic';
    }

    private getProgressForTask(taskId: string): TaskProgress | null {
        const progressFound = this.taskProgress?.find((taskProgress:TaskProgress) => taskProgress.taskId === taskId) ?? null;
        return progressFound;
    }

    private filterTasks(tasks: Task[]): Task[] {
        if (this.selectedDepartment !== 'All Departments' && this.selectedDepartment.length !== 0) {
            tasks = tasks.filter((task) => task.department === this.selectedDepartment);
        }

        if (this.searchTerm.length !== 0) {
            tasks = tasks.filter((task) => task.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
        }

        return tasks;
    }

    private getTaskRequestExpired(): boolean {
        return new Date().getTime() - this.lastTasksRequest.getTime() > 60 * 1000;
    }

    showActionButtons(task: Task): boolean {
        return task.department === (this.currentUser?.department) || this.currentUser?.role === UserRole.ADMIN;
    }
    
    ngOnDestroy(): void {
        if (this.mainSubscription) {
            this.mainSubscription.unsubscribe();
        }
    }
}