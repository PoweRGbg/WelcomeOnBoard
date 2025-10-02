import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Task, TaskProgress } from '../../../models/task.model';
import { TaskDetailDialogComponent } from './task-detail-dialog/task-detail-dialog.component';
import { BackendMockService } from '../../../services/backend-mock.service';

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
        MatDialogModule
    ],
    templateUrl: './employee-tasks.component.html',
    styleUrl: './employee-tasks.component.scss'
})
export class EmployeeTasksComponent implements OnInit {
    tasks: Task[] = [];
    taskProgress: Map<string, TaskProgress> = new Map();
    currentUserId: string | null = null;

    constructor(
        private dataService: BackendMockService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(currentUser => {
            this.currentUserId = currentUser?.id || null;
            this.loadTasks();
            this.loadTaskProgress();
        });
    }

    loadTasks(): void {
        this.dataService.getTasks().subscribe(tasks => {
            this.tasks = tasks;
        });
    }

    loadTaskProgress(): void {
        if (!this.currentUserId) return;

        this.dataService.getTaskProgressByUserId(this.currentUserId).subscribe((progress) => {
            this.taskProgress.clear();
            progress.forEach(p => {
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
            case 'Completed': return 'primary';
            case 'In Progress': return 'warn';
            default: return 'basic';
        }
    }

    isTaskInProgress(task: Task): boolean {
        const progress = this.getTaskProgress(task);
        return progress ? !progress.isCompleted && progress.actionsCompleted > 0 : false;
    }

    startTask(task: Task): void {
        if (!this.currentUserId) return;

        const progress: TaskProgress = {
            taskId: task.id,
            userId: this.currentUserId,
            actionsCompleted: 0,
            actionsTotal: task.actions?.length || 0,
            isCompleted: false,
            startedAt: new Date(),
        };

        this.dataService.startTask(progress.taskId).subscribe(() =>{
            this.loadTaskProgress();
            this.snackBar.open('Task started!', 'Close', { duration: 3000 });
        });
    }

    openTaskDetail(task: Task): void {
        const progress = this.getTaskProgress(task);
        const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
            width: '900px',
            data: { task, progress, currentUserId: this.currentUserId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result || result === undefined) {
                this.loadTaskProgress();
                this.snackBar.open('Task progress updated!', 'Close', { duration: 3000 });
            }
        });
    }

    restartTask(task: Task): void {
        this.startTask(task);
        const progress = this.getTaskProgress(task);
        
        const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
            width: '900px',
            data: { task, progress, currentUserId: this.currentUserId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result || result === undefined) {
                this.loadTaskProgress();
                this.snackBar.open('Task progress updated!', 'Close', { duration: 3000 });
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

    openTaskUrl(url: string): void {
        window.open(url, '_blank');
    }
}
