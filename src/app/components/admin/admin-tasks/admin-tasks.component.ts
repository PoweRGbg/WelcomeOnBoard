import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../models/task.model';
import { UserInfo } from '../../../models/user.model';
import { TaskDialogComponent } from '../../shared/task-dialog/task-dialog.component';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';

@Component({
    selector: 'app-admin-tasks',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule
    ],
    templateUrl: './admin-tasks.component.html',
    styleUrl: './admin-tasks.component.scss'
})
export class AdminTasksComponent implements OnInit {
    protected tasks: Task[] = [];
    protected isLoading = false;
    protected currentUser: UserInfo | null = null;
    protected searchTerm = '';
    protected selectedDepartment = '';
    protected departments = ['All departments'];

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
    ) { }

    ngOnInit(): void {
        this.currentUser = this.backendService.getCurrentUser();
        this.loadTasks();
    }

    loadTasks(): void {
        this.isLoading = true;
        const searchQuery = this.searchTerm.trim() || undefined;
        const departmentFilter = this.selectedDepartment || undefined;
        this.backendService.getDepartments().subscribe({
            next: (departments) => {
                this.departments = departments;
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(`Error loading departments: ${error.message}`, 'Close', { duration: 5000 });
            }
        })

        this.backendService.getTasks(1, 50, departmentFilter, searchQuery).subscribe({
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

    onDepartmentChange(): void {
        this.loadTasks();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.selectedDepartment = '';
        this.loadTasks();
    }

    createTask(): void {
        if (!this.currentUser) {
            this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '90vw',
            maxWidth: '900px',
            data: { currentUser: this.currentUser, allowStatusToggle: true }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
            }
        });
    }

    editTask(task: Task): void {
        if (!this.currentUser) {
            this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '90vw',
            maxWidth: '900px',
            data: { task: task, currentUser: this.currentUser, allowStatusToggle: true }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
            }
        });
    }

    deleteTask(task: Task): void {
        if (confirm(`Are you sure you want to delete task "${task.name}"?`)) {
            this.isLoading = true;
            this.backendService.deleteTask(task.id).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.snackBar.open('Task deleted successfully!', 'Close', { duration: 3000 });
                    this.loadTasks();
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(`Error deleting task: ${error.message}`, 'Close', { duration: 5000 });
                }
            });
        }
    }

    toggleTaskStatus(task: Task): void {
        const updatedTask = { 
            ...task,
            isActive: !task.isActive,
            createdBy: task.createdBy.id,
            updatedAt: undefined,
            createdAt: undefined,
            id: undefined,
        };
        this.isLoading = true;

        this.backendService.updateTask(task.id, updatedTask).subscribe({
            next: () => {
                this.isLoading = false;
                this.snackBar.open(
                    `Task ${updatedTask.isActive ? 'activated' : 'deactivated'} successfully!`,
                    'Close',
                    { duration: 3000 }
                );
                this.loadTasks();
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(`Error updating task: ${error.message}`, 'Close', { duration: 5000 });
            }
        });
    }
}




