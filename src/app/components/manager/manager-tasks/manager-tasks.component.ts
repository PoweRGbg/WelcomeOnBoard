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
        FormsModule
    ],
    templateUrl: './manager-tasks.component.html',
    styleUrl: './manager-tasks.component.scss'
})
export class ManagerTasksComponent implements OnInit {
    tasks: Task[] = [];
    displayedColumns: string[] = ['name', 'department', 'actions', 'completionCount', 'status', 'actions'];
    currentUserId: string | null = null;
    isLoading = false;
    searchTerm = '';
    selectedDepartment = '';
    departments = ['All Departments'];
    private taskProgress: TaskProgress[] = [];
    private currentUserDepartment = 'All Departments';

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
    ) { }

    ngOnInit(): void {
        this.backendService.getCurrentUser();
        this.authService.currentUser$.subscribe(currentUser => {
            this.currentUserId = currentUser?._id || null;
            this.loadTasks();
            this.loadTaskProgress();
        });
        if (this.currentUserId) {
            this.backendService.getUserById(this.currentUserId).subscribe((user) => {
                this.currentUserDepartment = user.department || 'All Departments';
                this.selectedDepartment = this.currentUserDepartment;
            });
        }
    }

    loadTasks(): void {
        this.isLoading = true;
        const searchQuery = this.searchTerm.trim() || undefined;
        const categoryFilter = this.selectedDepartment || undefined;

        this.backendService.getTasks(1, 50, categoryFilter, searchQuery).subscribe({
            next: (tasks) => {
                if (this.selectedDepartment !== 'All Departments' && this.selectedDepartment.length !== 0) {
                    tasks = tasks.filter((task) => task.department === this.selectedDepartment);
                }

                this.tasks = tasks;
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(`Error loading tasks: ${error.message}`, 'Close', { duration: 5000 });
            }
        });
        
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

    protected loadTaskProgress(): void {
        this.isLoading = true;

        if (!!this.currentUserId) {
            this.backendService.getTaskProgressByUserId(this.currentUserId).subscribe({
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

    onSearchChange(): void {
        this.loadTasks();
    }

    onDepartmentChange(): void {
        this.loadTasks();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.selectedDepartment = '';
        this.loadTasks();
    }

    createTask(): void {
        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '90vw',
            maxWidth: '900px',
            data: { 
                currentUser: { 
                        _id: this.currentUserId!,
                        username: '',
                        firstName: '',
                        lastName: '',
                        department: this.currentUserDepartment
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
            data: { task: task, currentUser: { id: this.currentUserId!, username: '', firstName: '', lastName: '' }, allowStatusToggle: false }
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
            this.backendService.deleteTask(task.id);
            this.loadTasks();
            this.snackBar.open('Task deleted successfully!', 'Close', { duration: 3000 });
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
            createdBy: this.currentUserId || '',
            recurring: task.recurring || RecurringTaskPeriod.NONE,
            dueDate: task.recurring !== RecurringTaskPeriod.NONE ? task.dueDate : undefined
        };

        this.backendService.createTask(newTask);
        this.loadTasks();
        this.snackBar.open('Task duplicated successfully!', 'Close', { duration: 3000 });
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
}