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
import { Task, TaskProgress } from '../../../../models/task.model';
import { Action } from '../../../../models/action.model';
import { BACKEND_SERVICE, IBackendService } from '../../../../services/backend-service.factory';

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
    protected task: Task;
    protected progress: TaskProgress | null;
    protected currentUserId: string | null;
    protected currentActionIndex: number = 0;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<TaskDetailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task: Task; currentUserId: string | null; progress: TaskProgress }
    ) {
        this.task = data.task;
        this.currentUserId = data.currentUserId;
        this.progress = data.progress;
        console.log('OnInit progress:', this.progress);
    }

    ngOnInit(): void {
        if (this.currentUserId && this.task) {
            this.backendService.getTaskProgressByTaskId(this.task.id).subscribe((taskProgress) => {
                if (!this.currentUserId || !this.task) {
                    throw new Error('No user or task provided!');
                }
                
                console.log('Progress onInit:', taskProgress);
                
                if (!taskProgress || Array.isArray(taskProgress)) {
                    console.log("No task progress or It is array", !taskProgress, taskProgress);
                    
                    this.progress = {
                        taskId: this.task.id,
                        userId: this.currentUserId,
                        actionsCompleted: 0,
                        actionsTotal: this.task.actions?.length ?? 0,
                        isCompleted: false,
                    }
                    console.log('Created new task progress');
                    
                } else {
                    console.log('setting progress to taskProgress');
                    
                    this.progress = taskProgress;
                }
                this.updateCurrentActionIndex();
            });
        }
    }

    private updateCurrentActionIndex(): void {
        if (!this.progress) {
            return;
        }
        this.currentActionIndex = this.progress.actionsCompleted - 1 <= 0 ? 0 : this.progress.actionsCompleted - 1;
        console.log('set current action index to', this.currentActionIndex);
        
    }

    getCompletionPercentage(): number {
        if (!this.progress) return 0;
        return (this.progress.actionsCompleted / (this.task.actions?.length ?? 0)) * 100;
    }

    isActionCompleted(action: Action): boolean {
        if (!this.progress || !this.task.isActive)
            return false;
        const actionIndex = this.task.actions?.indexOf(action) ?? 0;

        return actionIndex + 1 === this.progress.actionsCompleted;
    }

    isActionCurrent(action: Action): boolean {
        if (!this.progress) {
            return false;
        }
        const actionIndex = this.task.actions?.indexOf(action) ?? 0;
        return actionIndex === this.progress.actionsCompleted;
    }

    isActionAvailable(action: Action): boolean {
        if (!this.progress || !this.task.isActive) 
            return false;
        const actionId = this.task.actions?.findIndex( (actionInTask) => actionInTask.id === action.id) ?? 0;

        return actionId <= (this.progress.actionsCompleted + 1); 
    }

    toggleAction(action: Action): void {
        if (!this.currentUserId || !this.isActionAvailable(action)) return;

        const isCompleted = this.isActionCompleted(action);
        
        if (!isCompleted) {
            console.log('Completing action');
            // Uncomplete action
            this.completeAction();
        } else {
            console.log('Un-completing action', action);
            // Complete action
            this.uncompleteAction();
        }
    }

    private completeAction(): void {
        // complete task progress
        if (!this.progress) {
            console.log('No progress to update action for!!!');
            return;
        }
        this.progress = {
            ...this.progress,
            actionsCompleted: this.progress?.actionsCompleted + 1,
        }
        this.updateProgress();
        this.updateCurrentActionIndex();
        
        // Check if task is completed
        if (this.progress?.isCompleted) {
            this.snackBar.open('Congratulations! Task completed!', 'Close', { duration: 5000 });
        } else {
            this.snackBar.open('Action completed!', 'Close', { duration: 2000 });
        }
    }

    private uncompleteAction(): void {
        if (!this.progress || !this.currentUserId) return;

        this.backendService.updateTaskProgress(this.progress, true);
        // this.updateProgress();
        this.updateCurrentActionIndex();
        this.snackBar.open('Action uncompleted', 'Close', { duration: 2000 });
    }

    private updateProgress(): void {
        console.log('Updating in updateProgress ', this.progress, this.currentUserId);
        if (!this.currentUserId || !this.progress) return;
        
        this.backendService.updateTaskProgress(this.progress)
            .subscribe((taskProgress) => this.progress = taskProgress);
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
