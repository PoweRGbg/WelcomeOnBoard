import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { Task, TaskProgress } from '../../../models/task.model';
import { TaskDetailDialogComponent } from './task-detail-dialog/task-detail-dialog.component';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-employee-tasks',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatInputModule,
        MatDialogModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatSelectModule,
        FormsModule
    ],
    templateUrl: './employee-tasks.component.html',
    styleUrl: './employee-tasks.component.scss',
})
export class EmployeeTasksComponent implements OnInit {
    protected searchForm: FormGroup;
    protected tasks: Task[] = [];
    protected taskProgress: Map<string, TaskProgress> = new Map();
    protected currentUserId: string | null = null;
    protected selectedDepartment = '';
    protected searchTerm = '';
    protected departments: string[] = [];
    string = [];

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private fb: FormBuilder
    ) {
        this.searchForm = this.createForm();
    }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe((currentUser) => {
            this.currentUserId = currentUser?._id || null;
            this.loadTasks();
            this.getDepartments();
            this.loadTaskProgress();
        });
    }

    protected onDepartmentChange(): void {
        this.loadTasks();
    }

    protected onSearchChange() {
        console.log('searchTerm', this.searchTerm);
        this.loadTasks();
    }

    protected loadTasks(): void {
        // Show only active tasks
        this.backendService.getTasks().subscribe((tasks) => {
            this.tasks = tasks.filter((task) => task.isActive);
            const searchQuery = this.searchTerm.trim().toLocaleLowerCase() || undefined;
            const departmentFilter = this.selectedDepartment || undefined;
            if (searchQuery?.length) {
                this.tasks = this.tasks.filter((task) => {
                    console.log('Checking  ', task.name, 'for', searchQuery, task.name.toLocaleLowerCase().includes(searchQuery));
                    
                    return (task.name.toLocaleLowerCase().includes(searchQuery) ||
                        task.description?.toLocaleLowerCase().includes(searchQuery)
                    );
                });
            }
            console.log('Tasks after seratch:', this.tasks);
            
            if (departmentFilter?.length && departmentFilter !== 'All Departments') {
                console.log('Filtering by department:', departmentFilter);
                
                this.tasks = this.tasks.filter((task) =>
                    task.department.toLocaleLowerCase() === departmentFilter.toLocaleLowerCase()
                );
            }
        });
    }

    loadTaskProgress(): void {
        if (!this.currentUserId) return;
        this.backendService
            .getTaskProgressByUserId(this.currentUserId)
            .subscribe((progress) => {
                this.taskProgress.clear();
                progress.forEach((p) => {
                    this.taskProgress.set(p.taskId, p);
                });
            });
    }

    getTaskProgress(task: Task): TaskProgress | null {
        return this.taskProgress.get(task.id) || null;
    }

    getTaskCompletionPercentage(task: Task): number {
        const progress = this.getTaskProgress(task);
        if (!progress) return 0;
        return (progress.actionsCompleted / progress.actionsTotal || 0) * 100;
    }

    getTaskStatus(task: Task): string {
        const progress = this.getTaskProgress(task);
        if (!progress) return 'Not Started';
        if (progress.isCompleted) return 'Completed';
        if (progress.actionsCompleted < progress.actionsTotal) return 'In Progress';
        return 'Not Started';
    }

    getTaskStatusColor(task: Task): string {
        const status = this.getTaskStatus(task);
        switch (status) {
            case 'Completed':
                return 'primary';
            case 'In Progress':
                return 'warn';
            default:
                return 'basic';
        }
    }

    isTaskInProgress(task: Task): boolean {
        const progress = this.getTaskProgress(task);
        return progress
            ? !progress.isCompleted && progress.actionsCompleted > 0
            : false;
    }

    startTask(task: Task): void {
        if (!this.currentUserId) return;

        const progress: TaskProgress = {
            taskId: task.id,
            userId: this.currentUserId,
            actionsCompleted: 0,
            actionsTotal: task.actions?.length || 0,
            isCompleted: false,
        };

        this.backendService.updateTaskProgress(progress).subscribe(() => {
            this.loadTaskProgress();
            this.snackBar.open('Task started!', 'Close', { duration: 3000 });
        });
    }

    openTaskDetail(task: Task): void {
        const progress = this.getTaskProgress(task);
        const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
            width: '900px',
            data: { task, progress, currentUserId: this.currentUserId },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result || result === undefined) {
                this.loadTaskProgress();
                this.snackBar.open('Task status updated!', 'Close', { duration: 3000 });
            }
        });
    }

    restartTask(task: Task): void {
        this.startTask(task);
        let progress = this.getTaskProgress(task);
        progress!.actionsCompleted = 0;
        progress!.isCompleted = false;

        const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
            width: '900px',
            data: { task, progress, currentUserId: this.currentUserId },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result || result === undefined) {
                this.loadTaskProgress();
                this.snackBar.open('Task progress updated!', 'Close', {
                    duration: 3000,
                });
            }
        });
    }

    getSortedTasks(): Task[] {
        return this.tasks.sort((a, b) => {
            const aInProgress = this.isTaskInProgress(a);
            const bInProgress = this.isTaskInProgress(b);

            // In progress tasks first
            if (aInProgress && !bInProgress) return -1;
            if (!aInProgress && bInProgress) return 1;

            // Then by completion percentage (ascending)
            const aProgress = this.getTaskCompletionPercentage(a);
            const bProgress = this.getTaskCompletionPercentage(b);
            return aProgress - bProgress;
        });
    }

    protected getDepartments(): void {
        this.backendService.getDepartments().subscribe({
            next: (departments) => {
                this.departments = departments;
            },
            error: (error) => {
                this.snackBar.open(
                    `Error loading departments: ${error.message}`,
                    'Close',
                    { duration: 5000 }
                );
            },
        });
    }

    openTaskUrl(url: string): void {
        window.open(url, '_blank');
    }

    protected onSearch(): void {
        this.loadTasks();
    }

    protected clearSearch(): void {
        this.searchTerm = '';
        this.selectedDepartment = '';
        this.loadTasks();
    }

    private createForm(): FormGroup {
        return this.fb.group({
            taskName: ['', [Validators.required, Validators.minLength(3)]],
        });
    }
}
