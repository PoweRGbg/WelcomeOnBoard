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
import { Task, TaskCreateRequest } from '../../../models/task.model';
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
    displayedColumns: string[] = ['name', 'category', 'actions', 'completionCount', 'status', 'actions'];
    currentUserId: string | null = null;
    isLoading = false;
    searchTerm = '';
    selectedCategory = '';
    categories = ['Onboarding', 'Training', 'Equipment', 'HR', 'IT', 'Finance', 'Operations', 'Compliance', 'Security', 'Other'];

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(currentUser => {
            this.currentUserId = currentUser?.id || null;
            this.loadTasks();
        });
    }

    loadTasks(): void {
        this.isLoading = true;
        const searchQuery = this.searchTerm.trim() || undefined;
        const categoryFilter = this.selectedCategory || undefined;

        this.backendService.getTasks(1, 50, categoryFilter, searchQuery).subscribe({
            next: (tasks) => {
                this.tasks = tasks;
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(`Error loading tasks: ${error.message}`, 'Close', { duration: 5000 });
            }
        });
    }

    onSearchChange(): void {
        this.loadTasks();
    }

    onCategoryChange(): void {
        this.loadTasks();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.selectedCategory = '';
        this.loadTasks();
    }

    createTask(): void {
        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '90vw',
            maxWidth: '900px',
            data: { currentUser: { id: this.currentUserId!, username: '', firstName: '', lastName: '' }, allowStatusToggle: false }
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
        };

        this.backendService.createTask(newTask);
        this.loadTasks();
        this.snackBar.open('Task duplicated successfully!', 'Close', { duration: 3000 });
    }

    getTaskStatus(task: Task): string {
        if (task.completionCount > 0) return 'Completed';
        return 'Not Started';
    }

    getTaskStatusColor(task: Task): string {
        if (task.completionCount > 0) return 'primary';
        return 'basic';
    }
}