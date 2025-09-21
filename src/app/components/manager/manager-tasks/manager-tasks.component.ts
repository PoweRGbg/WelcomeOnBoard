import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Task, TaskCreateRequest } from '../../../models/task.model';
import { Action, ActionCreateRequest } from '../../../models/action.model';
import { TaskCreateDialogComponent } from './task-create-dialog/task-create-dialog.component';

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
        MatSnackBarModule
    ],
    templateUrl: './manager-tasks.component.html',
    styleUrl: './manager-tasks.component.scss'
})
export class ManagerTasksComponent implements OnInit {
    tasks: Task[] = [];
    displayedColumns: string[] = ['name', 'category', 'actions', 'completionCount', 'status', 'actions'];
    currentUserId: string | null = null;

    constructor(
        private dataService: DataService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.currentUserId = this.authService.getCurrentUser()?.id || null;
        this.loadTasks();
    }

    loadTasks(): void {
        this.tasks = this.dataService.getTasks();
    }

    createTask(): void {
        const dialogRef = this.dialog.open(TaskCreateDialogComponent, {
            width: '800px',
            data: { currentUserId: this.currentUserId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
                this.snackBar.open('Task created successfully!', 'Close', { duration: 3000 });
            }
        });
    }

    editTask(task: Task): void {
        const dialogRef = this.dialog.open(TaskCreateDialogComponent, {
            width: '800px',
            data: { task, currentUserId: this.currentUserId }
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
            this.dataService.deleteTask(task.id);
            this.loadTasks();
            this.snackBar.open('Task deleted successfully!', 'Close', { duration: 3000 });
        }
    }

    duplicateTask(task: Task): void {
        const newTask: TaskCreateRequest = {
            name: `${task.name} (Copy)`,
            description: task.description,
            category: task.category,
            url: task.url,
            actions: task.actions.map(action => ({
                name: action.name,
                description: action.description,
                imageUrl: action.imageUrl,
                url: action.url,
                order: action.order
            }))
        };

        this.dataService.createTask(newTask, this.currentUserId!);
        this.loadTasks();
        this.snackBar.open('Task duplicated successfully!', 'Close', { duration: 3000 });
    }

    getTaskStatus(task: Task): string {
        if (task.isInProgress) return 'In Progress';
        if (task.completionCount > 0) return 'Completed';
        return 'Not Started';
    }

    getTaskStatusColor(task: Task): string {
        if (task.isInProgress) return 'warn';
        if (task.completionCount > 0) return 'primary';
        return 'basic';
    }
}