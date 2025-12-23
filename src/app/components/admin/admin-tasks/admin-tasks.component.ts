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
import { map, Subscription, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
        FormsModule,
        TranslateModule
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
    private mainSubscription: Subscription | null = null;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.backendService.getCurrentUser();
        this.loadTasks();
        this.mainSubscription = this.authService.currentUser$.pipe(
            switchMap((currentUser) => {
                return this.backendService.getUserById(currentUser?._id || '').pipe(
                    map((user) => {
                        this.currentUser = user;
                        return user;
                    })
                );
            }),
        ).subscribe(() => {
            this.selectedDepartment = this.currentUser?.department || '';
            this.loadTasks();
        });
        
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
                this.snackBar.open(this.translate.instant('ONBOARDING.LOAD_DEPARTMENTS_ERROR'), this.translate.instant('ONBOARDING.DISMISS'), { duration: 5000 });
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

    protected onSearchChange(): void {
        this.loadTasks();
    }

    protected onDepartmentChange(): void {
        this.loadTasks();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.selectedDepartment = '';
        this.loadTasks();
    }

    createTask(): void {
        if (!this.currentUser) {
            this.snackBar.open(this.translate.instant('ONBOARDING.USER_NOT_LOGGED_IN'),
                this.translate.instant('ONBOARDING.DISMISS'), { duration: 3000 });
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
            this.snackBar.open(this.translate.instant('ONBOARDING.USER_NOT_LOGGED_IN'), this.translate.instant('ONBOARDING.DISMISS'), { duration: 3000 });
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
        if (confirm(this.translate.instant('ONBOARDING.DELETE_TASK_CONFIRMATION', { taskName: task.name }))) {
            this.isLoading = true;
            this.backendService.deleteTask(task.id).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.snackBar.open(this.translate.instant('ONBOARDING.TASK_DELETED_SUCCESS'), this.translate.instant('ONBOARDING.DISMISS'), { duration: 3000 });
                    this.loadTasks();
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(this.translate.instant('ONBOARDING.DELETE_TASK_ERROR', { errorMessage: error.message }), this.translate.instant('ONBOARDING.DISMISS'), { duration: 5000 });
                }
            });
        }
    }

    toggleTaskStatus(task: Task): void {
        const updatedTask = { 
            ...task,
            isActive: !task.isActive,
            createdBy: task.createdBy._id,
            updatedAt: undefined,
            createdAt: undefined,
            id: undefined,
        };
        this.isLoading = true;

        this.backendService.updateTask(task.id, updatedTask).subscribe({
            next: () => {
                this.isLoading = false;
                this.snackBar.open(
                    `${this.translate.instant('ONBOARDING.TASK')} ${updatedTask.isActive ? this.translate.instant('ONBOARDING.ACTIVATED') : this.translate.instant('ONBOARDING.DEACTIVATED')} ${this.translate.instant('ONBOARDING.SUCCESSFULLY')}!`,
                    this.translate.instant('ONBOARDING.DISMISS'),
                    { duration: 3000 }
                );
                this.loadTasks();
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(this.translate.instant('ONBOARDING.UPDATE_TASK_ERROR', { errorMessage: error.message }), this.translate.instant('ONBOARDING.DISMISS'), { duration: 5000 });
            }
        });
    }
}




