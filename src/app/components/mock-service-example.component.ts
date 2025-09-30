import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IBackendService, BACKEND_SERVICE } from '../services/backend-service.factory';
import { LoginRequest, LoginResponse } from '../services/backend.service';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';

@Component({
    selector: 'app-mock-service-example',
    template: `
    <div class="mock-service-example">
      <h2>Mock Service Example</h2>
      
      <!-- Login Section -->
      <div class="login-section">
        <h3>Login with Test Users</h3>
        <div class="test-users">
          <button (click)="loginAs('admin', 'admin123')">Login as Admin</button>
          <button (click)="loginAs('manager1', 'manager123')">Login as Manager</button>
          <button (click)="loginAs('employee1', 'employee123')">Login as Employee</button>
        </div>
        <div *ngIf="currentUser" class="current-user">
          <p>Logged in as: {{currentUser.firstName}} {{currentUser.lastName}} ({{currentUser.role}})</p>
          <button (click)="logout()">Logout</button>
        </div>
      </div>

      <!-- Users Section -->
      <div class="users-section">
        <h3>Users ({{users.length}})</h3>
        <button (click)="loadUsers()">Load Users</button>
        <div *ngFor="let user of users" class="user-item">
          {{user.firstName}} {{user.lastName}} - {{user.role}}
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="tasks-section">
        <h3>Tasks ({{tasks.length}})</h3>
        <button (click)="loadTasks()">Load Tasks</button>
        <div *ngFor="let task of tasks" class="task-item">
          <h4>{{task.name}}</h4>
          <p>{{task.description}}</p>
          <p>Category: {{task.category}}</p>
          <p>Actions: {{task.actions?.length || 0}}</p>
        </div>
      </div>

      <!-- Task Progress Section -->
      <div class="progress-section">
        <h3>Task Progress</h3>
        <button (click)="loadTaskProgress()">Load Progress</button>
        <div *ngFor="let progress of taskProgress" class="progress-item">
          Task ID: {{progress.taskId}} - Completed: {{progress.isCompleted}}
        </div>
      </div>
    </div>
  `,
    styles: [`
    .mock-service-example {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .login-section, .users-section, .tasks-section, .progress-section {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    
    .test-users button {
      margin: 5px;
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .test-users button:hover {
      background-color: #0056b3;
    }
    
    .current-user {
      margin-top: 10px;
      padding: 10px;
      background-color: #d4edda;
      border-radius: 4px;
    }
    
    .user-item, .task-item, .progress-item {
      padding: 8px;
      margin: 5px 0;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
    
    button {
      margin: 5px;
      padding: 8px 16px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: #218838;
    }
  `]
})
export class MockServiceExampleComponent implements OnInit {
    currentUser: User | null = null;
    users: User[] = [];
    tasks: Task[] = [];
    taskProgress: any[] = [];

    constructor(@Inject(BACKEND_SERVICE) private backendService: IBackendService) { }

    ngOnInit() {
        this.currentUser = this.backendService.getCurrentUser();
    }

    loginAs(username: string, password: string) {
        const credentials: LoginRequest = { username, password };

        this.backendService.login(credentials).subscribe({
            next: (response: LoginResponse) => {
                console.log('Login successful:', response);
                this.currentUser = response.user;
            },
            error: (error: { message: string; }) => {
                console.error('Login failed:', error);
                alert('Login failed: ' + error.message);
            }
        });
    }

    logout() {
        this.backendService.logout();
        this.currentUser = null;
        this.users = [];
        this.tasks = [];
        this.taskProgress = [];
    }

    loadUsers() {
        this.backendService.getUsers(1, 10).subscribe({
            next: (users: User[]) => {
                console.log('Users loaded:', users);
                this.users = users;
            },
            error: (error: any) => {
                console.error('Failed to load users:', error);
            }
        });
    }

    loadTasks() {
        this.backendService.getTasks(1, 10).subscribe({
            next: (tasks: Task[]) => {
                console.log('Tasks loaded:', tasks);
                this.tasks = tasks;
            },
            error: (error: any) => {
                console.error('Failed to load tasks:', error);
            }
        });
    }

    loadTaskProgress() {
        this.backendService.getTaskProgress().subscribe({
            next: (progress: any[]) => {
                console.log('Task progress loaded:', progress);
                this.taskProgress = progress;
            },
            error: (error: any) => {
                console.error('Failed to load task progress:', error);
            }
        });
    }
}
