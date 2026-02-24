import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';
import { Task } from '../../models/task.model';
import { BACKEND_SERVICE, IBackendService } from '../../services/backend-service.factory';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatGridListModule,
        TranslateModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    protected currentUser: User | null = null;
    protected tasks: Task[] = [];
    protected userStats = {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0
    };

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private router: Router,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            if (!user || !user._id) {
                this.currentUser = null;
            } else {
                this.currentUser = user;
                this.authService.getCurrentUser();
            }
        });
        
        this.backendService.getTasks().subscribe(tasks => {
            this.tasks = tasks;
            this.calculateStats();
        });
    }

    private calculateStats(): void {
        if (!this.currentUser) return;
        this.backendService.getTaskProgressByUserId(this.currentUser._id).subscribe((userProgress) => {
            const activeTasks = this.tasks.filter((task) => task.isActive).length;
            this.userStats.totalTasks = activeTasks;
            
            this.userStats.completedTasks = userProgress.filter((taskProgress) => 
                taskProgress.isCompleted  && this.taskIsActive(taskProgress.taskId)).length;
            this.userStats.inProgressTasks = userProgress.filter((taskProgress) =>
                !taskProgress.isCompleted &&
                taskProgress.actionsCompleted > 0 &&
                this.taskIsActive(taskProgress.taskId))
                .length;
            this.userStats.pendingTasks = activeTasks -
                this.userStats.completedTasks;
        });
    }

    getRoleBasedActions(): any[] {
        if (!this.currentUser) return [];

        const actions = [];
        
        switch (this.currentUser.role.toLocaleUpperCase()) {
            case UserRole.ADMIN:
                actions.push(
                    { title: this.translate.instant('ONBOARDING.USER_MANAGEMENT'), icon: 'add', route: '/admin/users', color: 'primary' },
                    { title: this.translate.instant('ONBOARDING.TASK_MANAGEMENT'), icon: 'assignment', route: '/manage/tasks', color: 'primary' }
                );
                break;
            case UserRole.MANAGER:
                actions.push(
                    { title: this.translate.instant('ONBOARDING.MY_TASKS'), icon: 'assignment', route: '/manage/tasks', color: 'primary' },
                    { title: this.translate.instant('ONBOARDING.TASK_SUGGESTIONS'), icon: 'lightbulb', route: '/manager/suggestions', color: 'accent' }
                );
                break;
            case UserRole.EMPLOYEE:
                actions.push(
                    { title: this.translate.instant('ONBOARDING.MY_TASKS'), icon: 'assignment', route: '/employee/tasks', color: 'primary' },
                    { title: this.translate.instant('ONBOARDING.TASK_SUGGESTIONS'), icon: 'add', route: '/employee/suggestions', color: 'accent' }
                );
                break;
            default:
                console.error('Unknown user role:', this.currentUser.role);
                break;
        }
        return actions;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    navigateTo(route: string, filterCompleted?: string): void {
        this.router.navigate([route],
        { 
            queryParams: { completed: filterCompleted  }, 
            queryParamsHandling: 'merge'
        });
    }

    private taskIsActive(taskId: string): boolean {
        const activeTasks: Task[] = this.tasks.filter((task) => task.isActive);
        return !!activeTasks.find((task) => task.id === taskId);
    }
}





