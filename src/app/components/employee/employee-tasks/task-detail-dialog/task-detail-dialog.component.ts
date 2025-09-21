import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../services/data.service';
import { Task, TaskProgress } from '../../../../models/task.model';
import { Action } from '../../../../models/action.model';

@Component({
    selector: 'app-task-detail-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './task-detail-dialog.component.html',
    styleUrl: './task-detail-dialog.component.scss'
})
export class TaskDetailDialogComponent implements OnInit {
    task: Task;
    progress: TaskProgress | null;
    currentUserId: string | null;
    currentActionIndex: number = 0;

    constructor(
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<TaskDetailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task: Task; progress: TaskProgress | null; currentUserId: string | null }
    ) {
        this.task = data.task;
        this.progress = data.progress;
        this.currentUserId = data.currentUserId;
    }

    ngOnInit(): void {
        this.updateCurrentActionIndex();
    }

    private updateCurrentActionIndex(): void {
        if (this.progress) {
            this.currentActionIndex = this.progress.currentActionIndex;
        } else {
            this.currentActionIndex = 0;
        }
    }

    getCompletionPercentage(): number {
        if (!this.progress) return 0;
        return (this.progress.completedActions.length / this.task.actions.length) * 100;
    }

    isActionCompleted(action: Action): boolean {
        return this.progress ? this.progress.completedActions.includes(action.id) : false;
    }

    isActionCurrent(action: Action): boolean {
        return this.task.actions.indexOf(action) === this.currentActionIndex;
    }

    isActionAvailable(action: Action): boolean {
        const actionIndex = this.task.actions.indexOf(action);
        return actionIndex <= this.currentActionIndex;
    }

    toggleAction(action: Action): void {
        if (!this.currentUserId || !this.isActionAvailable(action)) return;

        const isCompleted = this.isActionCompleted(action);

        if (isCompleted) {
            // Uncomplete action
            this.uncompleteAction(action);
        } else {
            // Complete action
            this.completeAction(action);
        }
    }

    private completeAction(action: Action): void {
        this.dataService.completeAction(this.task.id, action.id, this.currentUserId!);
        this.updateProgress();
        this.updateCurrentActionIndex();

        // Check if task is completed
        if (this.progress?.isCompleted) {
            this.snackBar.open('Congratulations! Task completed!', 'Close', { duration: 5000 });
        } else {
            this.snackBar.open('Action completed!', 'Close', { duration: 2000 });
        }
    }

    private uncompleteAction(action: Action): void {
        if (!this.progress) return;

        const updatedActions = this.progress.completedActions.filter(id => id !== action.id);
        const updatedProgress: TaskProgress = {
            ...this.progress,
            completedActions: updatedActions,
            isCompleted: false,
            completedAt: undefined,
            currentActionIndex: Math.max(0, this.currentActionIndex - 1)
        };

        this.dataService.updateTaskProgress(updatedProgress);
        this.updateProgress();
        this.updateCurrentActionIndex();
        this.snackBar.open('Action uncompleted', 'Close', { duration: 2000 });
    }

    private updateProgress(): void {
        if (!this.currentUserId) return;

        const progress = this.dataService.getTaskProgress(this.currentUserId);
        this.progress = progress.find(p => p.taskId === this.task.id) || null;
    }

    openImage(imageUrl: string): void {
        window.open(imageUrl, '_blank');
    }

    openUrl(url: string): void {
        window.open(url, '_blank');
    }

    onClose(): void {
        this.dialogRef.close(true);
    }

    getActionStatusText(action: Action): string {
        if (this.isActionCompleted(action)) return 'Completed';
        if (this.isActionCurrent(action)) return 'Current Action';
        if (this.isActionAvailable(action)) return 'Available';
        return 'Locked';
    }

    getActionStatusColor(action: Action): string {
        if (this.isActionCompleted(action)) return 'primary';
        if (this.isActionCurrent(action)) return 'warn';
        if (this.isActionAvailable(action)) return 'basic';
        return 'basic';
    }
}
