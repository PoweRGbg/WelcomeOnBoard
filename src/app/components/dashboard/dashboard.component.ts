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

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatGridListModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    currentUser: User | null = null;
    tasks: Task[] = [];
    userStats = {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0
    };

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.authService.getCurrentUser();
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
            // Maybe we need to substract the tasks.inProgress also ?!?
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
                    { title: 'Manage Users', icon: 'people', route: '/admin/users', color: 'primary' },
                    { title: 'Manage Tasks', icon: 'assignment', route: '/admin/tasks', color: 'primary' }
                );
                break;
            case UserRole.MANAGER:
                actions.push(
                    { title: 'My Tasks', icon: 'assignment', route: '/manager/tasks', color: 'primary' },
                    { title: 'Task Suggestions', icon: 'lightbulb', route: '/manager/suggestions', color: 'accent' }
                );
                break;
            case UserRole.EMPLOYEE:
                actions.push(
                    { title: 'My Tasks', icon: 'assignment', route: '/employee/tasks', color: 'primary' },
                    { title: 'Suggest Tasks', icon: 'add', route: '/employee/suggestions', color: 'accent' }
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

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }

    private taskIsActive(taskId: string): boolean {
        const activeTasks: Task[] = this.tasks.filter((task) => task.isActive);
        return !!activeTasks.find((task) => task.id === taskId);
    }
}





