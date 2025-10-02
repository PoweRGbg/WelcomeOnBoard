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
import { BackendMockService } from '../../../../services/backend-mock.service';

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
        private dataService: BackendMockService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<TaskDetailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task: Task; currentUserId: string | null }
    ) {
        this.task = data.task;
        this.progress = null; 
        this.currentUserId = data.currentUserId;
    }

    ngOnInit(): void {
        if (this.currentUserId && this.task) {
            this.dataService.getTaskProgressByTaskId(this.currentUserId, this.task.id).subscribe( (taskProgress) => {
                this.progress = taskProgress;
            });
        }
        this.updateCurrentActionIndex();
    }

    private updateCurrentActionIndex(): void {
        this.currentActionIndex = this.progress?.actionsCompleted ?? 0;
        console.log('Current action index set to:', this.currentActionIndex);
        
    }

    getCompletionPercentage(): number {
        if (!this.progress) return 0;
        return (this.progress.actionsCompleted / (this.task.actions?.length ?? 0)) * 100;
    }

    isActionCompleted(action: Action): boolean {
        return this.progress ? this.progress.actionsCompleted >= Number(action.id) : false;
    }

    isActionCurrent(action: Action): boolean {
        return this.task.actions?.indexOf(action) === this.currentActionIndex;
    }

    isActionAvailable(action: Action): boolean {
        const actionIndex = this.task.actions?.indexOf(action) || 0;
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
        // complete task progress
        console.log('Completing');
        
        // this.dataService.completeAction(this.task.id, action.id);
        
        this.updateProgress();
        this.updateCurrentActionIndex();
        
        // Check if task is completed
        if (this.progress?.isCompleted) {
            this.snackBar.open('Congratulations! Task completed!', 'Close', { duration: 5000 });
        } else {
            this.snackBar.open('Action completed!', 'Close', { duration: 2000 });
        }
        console.log('Action completed:', action);
        console.log('Current index is:', this.currentActionIndex);
    }

    private uncompleteAction(action: Action): void {
        if (!this.progress || !this.currentUserId) return;

        this.dataService.updateTaskProgress(this.currentUserId, this.task.id);
        // this.updateProgress();
        this.updateCurrentActionIndex();
        this.snackBar.open('Action uncompleted', 'Close', { duration: 2000 });
    }

    private updateProgress(): void {
        console.log('Updating progress!', this.currentUserId, this.progress);
        
        if (!this.currentUserId || !this.progress) return;
        console.log('Complete action in dataService sent');
        this.dataService.completeAction(this.progress?.taskId, this.progress?.actionsCompleted.toString())
        .subscribe(
            (progress) => {
                this.progress = progress; 
                console.log('Set progress to:', this.progress);
                
                this.updateCurrentActionIndex();
            }
        );
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
