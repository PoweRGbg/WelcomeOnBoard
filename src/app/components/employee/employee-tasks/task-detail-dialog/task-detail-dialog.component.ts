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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
        MatSnackBarModule,
        TranslateModule
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
        @Inject(MAT_DIALOG_DATA) public data: { task: Task; currentUserId: string | null; progress: TaskProgress },
        private translate: TranslateService
    ) {
        this.task = data.task;
        this.currentUserId = data.currentUserId;
        this.progress = data.progress;
    }

    ngOnInit(): void {
        if (!this.task) return;
        if (!this.progress) {
            this.backendService.getTaskProgressByTaskId(this.currentUserId ?? undefined, this.task.id).subscribe((taskProgress) => {
                
                if ((!taskProgress || Array.isArray(taskProgress)) && this.currentUserId) {
                    this.progress = {
                        taskId: this.task.id,
                        userId: this.currentUserId,
                        actionsCompleted: 0,
                        actionsTotal: this.task.actions?.length ?? 0,
                        isCompleted: false,
                        startedOn: new Date(),
                    }
                    
                } else {
                    if (Object.keys(taskProgress ?? {}).includes('_id')) {
                        this.progress = this.toTaskProgress(taskProgress);
                    } else {
                        this.progress = taskProgress;
                    }
                }
                this.updateCurrentActionIndex();
            });
        } else {
            this.progress.actionsTotal = this.task.actions?.length ?? 0;
            this.progress = this.toTaskProgress(this.progress); 
            if ( this.progress.actionsCompleted === 0 && !this.progress.isCompleted ){
                this.updateProgress();
            }
        }
    }

    onProgressChange(index: number) {
        if (this.progress) {
            if (this.progress?.actionsCompleted === index){
                this.progress.actionsCompleted += 1;
            } else {
                this.progress.actionsCompleted -= 1;
            }
            
            this.progress.isCompleted = this.progress.actionsCompleted === this.progress.actionsTotal;
            this.updateProgress();
        }
    }

    getCompletionPercentage(): number {
        if (!this.progress) return 0;
        return (this.progress.actionsCompleted / (this.task.actions?.length ?? 0)) * 100;
    }

    isActionCompleted(actionIndex: number): boolean {
        return actionIndex < (this.progress?.actionsCompleted ?? 0);
    }

    isActionCurrent(action: Action): boolean {
        if (!this.progress) {
            return false;
        }
        const actionIndex = this.task.actions?.indexOf(action) ?? 0;
        return actionIndex === this.progress.actionsCompleted;
    }

    isActionAvailable(actionIndex: number): boolean {
        if (actionIndex === 0 && this.progress?.actionsCompleted === 0) {
            return true;
        }        

        if (this.progress?.isCompleted) {
            return false;
        }

        return (actionIndex === this.progress?.actionsCompleted) ||
            (actionIndex === (this.progress?.actionsCompleted ?? 0) - 1); 
    }

    toggleAction(action: number): void {
        if (!this.currentUserId || !this.isActionAvailable(action)) return;
        
        const isCompleted = this.isActionCompleted(action);
        
        if (!isCompleted) {
            this.completeAction();
        } else {
            this.completeAction(true);
        }
    }

    private completeAction(uncompleteAction?: boolean): void {
        if (!this.progress) {
            return;
        }

        let actionsCompleted = uncompleteAction ?
            this.progress?.actionsCompleted - 1 :
            this.progress.actionsCompleted + 1;

        if (actionsCompleted < 0){
            actionsCompleted = 0
        }

        this.progress = {
            ...this.progress,
            actionsCompleted,
        }
        this.updateCurrentActionIndex();
        this.updateProgress();
        
        if (this.progress?.isCompleted) {
            this.snackBar.open(this.translate.instant('TASK_FINISHED_MESSAGE', { taskName: this.task.name }), this.translate.instant('DISMISS'), { duration: 5000 });
        } else {
            this.snackBar.open(this.translate.instant('ACTION_COMPLETED_MESSAGE', { actionName: this.task.name }), this.translate.instant('DISMISS'), { duration: 2000 });
        }
    }

    private uncompleteAction(): void {
        if (!this.progress || !this.currentUserId) return;

        this.backendService.updateTaskProgress(this.progress, true);
        this.updateCurrentActionIndex();
        this.snackBar.open(this.translate.instant('ACTION_UNCOMPLETED_MESSAGE', { actionName: this.task.name }), this.translate.instant('DISMISS'), { duration: 2000 });
    }

    private updateProgress(): void {
        if (!this.currentUserId || !this.progress) return;
        
        this.backendService.updateTaskProgress(this.progress)
            .subscribe(() => {
                this.updateCurrentActionIndex();
            });
    }

    openImage(imageUrl: string): void {
        window.open(imageUrl, '_blank');
    }

    openUrl(url: string): void {
        window.open(url, '_blank');
    }

    onClose(): void {
        this.updateProgress();
        this.dialogRef.close(true);
        // Refresh the page to update the task list and progress
        window.location.reload();
    }

    getActionStatusText(action: Action): string {
        const actionIndex = this.task.actions?.indexOf(action) ?? 0;
        if (this.isActionCompleted(actionIndex)) return this.translate.instant('ONBOARDING.COMPLETED').toString();
        if (this.isActionCurrent(action)) return this.translate.instant('ONBOARDING.ACTION_CURRENT').toString();
        if (this.isActionAvailable(actionIndex)) return this.translate.instant('ONBOARDING.ACTION_AVAILABLE').toString();
        return this.translate.instant('ONBOARDING.ACTION_LOCKED').toString();
    }

    getActionStatusColor(action: Action): string {
        const actionIndex = this.task.actions?.indexOf(action) ?? 0;

        if (this.isActionCompleted(actionIndex)) return 'primary';
        if (this.isActionCurrent(action)) return 'warn';
        if (this.isActionAvailable(actionIndex)) return 'basic';
        return 'basic';
    }

    private updateCurrentActionIndex(): void {
        if (!this.progress) {
            return;
        }
        this.currentActionIndex = this.progress.actionsCompleted < 1 ? 0 : this.progress.actionsCompleted - 1 
    }

    private toTaskProgress(taskProgress: any): TaskProgress {
        return {
            taskId: taskProgress.taskId,
            userId: taskProgress.userId,
            actionsTotal: taskProgress.actionsTotal,
            actionsCompleted: taskProgress.actionsCompleted,
            isCompleted: taskProgress.isCompleted,
            startedOn: taskProgress.startedOn ?? new Date(),
        }
    }
}
