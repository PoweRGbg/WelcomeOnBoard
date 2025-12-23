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
import { RecurringTaskPeriod, Task, TaskProgress } from '../../../models/task.model';
import { TaskDetailDialogComponent } from './task-detail-dialog/task-detail-dialog.component';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { daysLeft, filterTasks, getTaskDueDate, hoursLeft, isFinishedOnTime, isTaskExpiring, taskCompletedDaysBefore } from '../../../common/utils';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskFilterComponent } from '../../shared/task-filter/task-filter.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


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
        FormsModule,
        TaskFilterComponent,
        TranslateModule,
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
    private statusFilter: string | null = null;
    private taskReloadNeeded = true;
    private routeSubscription: Subscription | null = null;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private translate: TranslateService
    ) {
        this.searchForm = this.createForm();
    }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe((currentUser) => {
            this.routeSubscription = this.route.queryParams.subscribe(params => {
                this.statusFilter = params['completed'] || null;
            });
            this.currentUserId = currentUser?._id || null;
            this.loadTasks();
            this.getDepartments();
            this.loadTaskProgress();
        });
    }

    onSearchChange(searchTerm: string): void {
        this.searchTerm = searchTerm;
        // We already called loadTasks, so don't call it again
        if (!this.tasks.length && !searchTerm.length) {
            this.taskReloadNeeded = true;
            this.loadTasks();
            return;
        }
        this.tasks = filterTasks(this.tasks, this.searchTerm, this.selectedDepartment);
    }

    onDepartmentChange(selectedDepartment: string): void {
        if (this.selectedDepartment === selectedDepartment && this.searchTerm.length) {
            return;
        } else {
            this.taskReloadNeeded = true;
            this.selectedDepartment = selectedDepartment;
            this.loadTasks();
        }
    }

    protected loadTasks(): void {
        if (this.taskReloadNeeded) {
            this.taskReloadNeeded = false;
            this.backendService.getTasks().subscribe((tasks) => {
                tasks = tasks.map((task) => {
                    if (!task.recurring) {
                        task.recurring = RecurringTaskPeriod.NONE;
                    }

                    return task;
                });
                this.tasks = tasks.filter((task) => task.isActive);
                const searchQuery = this.searchTerm.trim().toLocaleLowerCase() || undefined;
                if (searchQuery?.length) {
                    this.tasks = filterTasks(this.tasks, this.searchTerm, this.selectedDepartment);
                }
            });
        }
        this.tasks = this.filterTasksByStatus(this.tasks, this.statusFilter); // filter by the status parameter
        this.tasks = filterTasks(this.tasks, this.searchTerm, this.selectedDepartment || ''); // Filter by deparment
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
        const taskNeedsRestart = this.taskNeedsRestart(task);
        if (!progress || taskNeedsRestart) return 0;
        return (progress.actionsCompleted / progress.actionsTotal || 0) * 100;
    }

    getTaskStatus(task: Task): string {
        const progress = this.getTaskProgress(task);
        if (!progress) return this.translate.instant('ONBOARDING.NOT_STARTED');
        if (progress.isCompleted && isFinishedOnTime(task, progress)) return this.translate.instant('ONBOARDING.COMPLETED');
        if (progress.actionsCompleted < progress.actionsTotal) return this.translate.instant('ONBOARDING.IN_PROGRESS');
        return this.translate.instant('ONBOARDING.NOT_STARTED');
    }

    getTaskStartedDate(task: Task): string | null {
        const progress: TaskProgress | null = this.getTaskProgress(task);
        if (!progress) {
            return this.translate.instant('ONBOARDING.NOT_STARTED');
        }

        if (progress.isCompleted) {
            return this.translate.instant('ONBOARDING.COMPLETED');
        } else {
            progress.startedOn = progress.startedOn ?? new Date();
            return `${this.translate.instant('ONBOARDING.STARTED_ON')} ${new Date(progress.startedOn).toLocaleDateString('en-GB') } ` ;
        }
    }

    getTaskDueDate(task: Task): string {
        const dueDate = getTaskDueDate(task);

        if (!dueDate) return 'Няма крайна дата';
        
        return new Date(dueDate).toLocaleDateString('de-DE');
    }

    getTaskStatusColor(task: Task): string {
        const status = this.getTaskStatus(task);
        if(status.startsWith('Completed')) {
            return 'primary';
        }
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
            startedOn: new Date(),
        };

        this.backendService.updateTaskProgress(progress).subscribe(() => {
            this.loadTaskProgress();
            this.snackBar.open('Започната задача!', 'Затвори', { duration: 3000 });
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
                this.snackBar.open('Статусът на задачата е актуализиран!', 'Затвори', { duration: 3000 });
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
                this.snackBar.open('Напредъкът на задачата е актуализиран!', 'Затвори', {
                    duration: 3000,
                });
            }
        });
    }

    getSortedTasks(): Task[] {
        return this.tasks.sort((a, b) => {
            
            const aInProgress = this.isTaskInProgress(a);
            const bInProgress = this.isTaskInProgress(b);
            const aIsCompleted = this.getTaskCompletionPercentage(a);
            const bIsCompleted = this.getTaskCompletionPercentage(b);
            const aNeedsRestart = this.taskNeedsRestart(a);
            const bNeedsRestart = this.taskNeedsRestart(b);

            // tasks with shorter due days first
            if (isTaskExpiring(a) && !isTaskExpiring(b) && !aIsCompleted) return -1
            if (!isTaskExpiring(a) && isTaskExpiring(b) && !bIsCompleted) return 1
            
            // then if task needs restart
            if (aNeedsRestart && !bNeedsRestart) return 1
            if (!aNeedsRestart && bNeedsRestart) return -1;

            // then by in progress tasks first
            if (aInProgress && !bInProgress) return -1;
            if (!aInProgress && bInProgress) return 1;

            // then by recurring tasks first
            if (a.recurring && !b.recurring) return -1
            if (b.recurring && !b.recurring) return 1

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
                    `Грешка при зареждане на отделите: ${error.message}`,
                    'Затвори',
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

    protected taskDaysLeft(task: Task): string {
        if (!task.dueDate && !task.recurring) {
            return '';
        }

        let taskDaysLeft = 0;
        let taskHoursLeft = 0;
        if (task.recurring === RecurringTaskPeriod.DAILY) {
            taskHoursLeft = hoursLeft(task);
            return taskHoursLeft.toString() + ' ' + (taskHoursLeft === 1 ? this.translate.instant('ONBOARDING.HOUR_LEFT') : this.translate.instant('ONBOARDING.HOURS_LEFT'));
        } else {
            taskDaysLeft = daysLeft(task);
        }
        if (taskDaysLeft >= 0) {
            return taskDaysLeft.toString() + ' ' +
            (taskDaysLeft > 1 ?
                this.translate.instant('ONBOARDING.DAYS_LEFT') :
                this.translate.instant('ONBOARDING.DAY_LEFT')
            );
        } else {
            return 'завършена';
        }
    }

    protected isFinishedOnTime(task: Task): boolean {
        if (task.recurring !== RecurringTaskPeriod.NONE) {
            const taskProgress = this.getTaskProgress(task) ?? undefined;
            return isFinishedOnTime(task, taskProgress);
        }
        return true;
    }

    protected isTaskExpiring(task: Task): boolean {
        const taskProgress = this.getTaskProgress(task) ?? undefined;
        return isTaskExpiring(task, taskProgress);
    }

    private createForm(): FormGroup {
        return this.fb.group({
            taskName: ['', [Validators.required, Validators.minLength(3)]],
        });
    }

    private filterTasksByStatus(tasks: Task[], statusFilter?: string | null): Task[] {
            let filteredTasks = tasks;
            // filter by status passed as query param
            if (statusFilter === 'completed') {
                filteredTasks = tasks.filter((task) => this.getTaskProgress(task)?.isCompleted);
            } else if (statusFilter === 'pending') {
                filteredTasks = tasks.filter((task) => !this.getTaskProgress(task)?.isCompleted);
            }
        
        return filteredTasks;
    }

    protected taskNeedsRestart(task: Task): boolean {
        const taskProgess = this.getTaskProgress(task);
        if (!task.recurring || task.recurring === RecurringTaskPeriod.NONE) {
            return false;
        }
        
        if (!taskProgess)
            return true;
        return !isFinishedOnTime(task, taskProgess);
    }
}
