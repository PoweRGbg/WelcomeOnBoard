// This is an example file showing how to use the BackendService
// You can delete this file after reviewing the examples

import { Component, OnInit } from '@angular/core';
import { BackendService } from './backend.service';
import { AuthBackendService } from './auth-backend.service';
import { User, UserRole } from '../models/user.model';
import { Task, TaskCreateRequest } from '../models/task.model';
import { Action } from '../models/action.model';

@Component({
    selector: 'app-backend-usage-example',
    template: `
    <div>
      <h2>Backend Service Usage Examples</h2>
      <!-- Your template here -->
    </div>
  `
})
export class BackendUsageExampleComponent implements OnInit {
    users: User[] = [];
    tasks: Task[] = [];
    currentUser: User | null = null;

    constructor(
        private backendService: BackendService,
        private authService: AuthBackendService
    ) { }

    ngOnInit() {
        this.currentUser = this.authService.getCurrentUser();
        this.loadUsers();
        this.loadTasks();
        // this.createTask();
    }

    // Authentication Examples
    async login() {
        try {
            const user = await this.authService.login({
                username: 'admin',
                password: 'admin'
            }).toPromise();

            console.log('Logged in user:', user);
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    async logout() {
        try {
            await this.authService.logout().toPromise();
            console.log('Logged out successfully');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    // User Management Examples
    async loadUsers() {
        try {
            const response = await this.backendService.getUsers(1, 10).toPromise();
            this.users = response || [];
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async createUser() {
        try {
            const newUser = await this.backendService.createUser({
                username: 'newuser',
                password: 'password123',
                email: 'newuser@company.com',
                role: UserRole.EMPLOYEE,
                firstName: 'New',
                lastName: 'User',
                isActive: true
            }).toPromise();

            console.log('User created:', newUser);
            this.loadUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    }

    async updateUser(userId: string) {
        try {
            const updatedUser = await this.backendService.updateUser(userId, {
                firstName: 'Updated',
                lastName: 'Name'
            }).toPromise();

            console.log('User updated:', updatedUser);
            this.loadUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }

    async deleteUser(userId: string) {
        try {
            const deleted = await this.backendService.deleteUser(userId).toPromise();
            if (deleted) {
                console.log('User deleted successfully');
                this.loadUsers(); // Refresh the list
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    }

    // Task Management Examples
    async loadTasks() {
        try {
            const response = await this.backendService.getTasks(1, 10).subscribe(
                (tasks) => {
                    this.tasks = tasks || [];
                    console.log('Tasks loaded:', this.tasks);
                }
            );            
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    async getTaskById(taskId: string) {
        try {
            const task = await this.backendService.getTaskById(taskId).toPromise();
            console.log('Task details:', task);
        } catch (error) {
            console.error('Failed to get task:', error);
        }
    }

    async createTask(taskToCreate: TaskCreateRequest) {
        // const taskExample: TaskCreateRequest = {
        //     name: 'Example Task',
        //     description: 'This is an example task',
        //     category: 'General',
        //     url: 'https://example.com',
        //     actions: [
        //         {
        //             name: 'First Action',
        //             description: 'Complete first action',
        //             id: '',
        //             // order: 1,
        //             isCompleted: false
        //         },
        //         {
        //             name: 'Second Action',
        //             description: 'Complete second action',
        //             id: '',
        //             isCompleted: false
        //         }
        //     ],
        //     createdBy: this.currentUser?.id ?? '68d7a74562f21ebd77b0ee3e',
        //     isActive: true,
        //     isInProgress: false
        // };
        try {
            const newTask = await this.backendService.createTask(taskToCreate).toPromise();
            console.log('Task created:', newTask);
            this.loadTasks(); // Refresh the list
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    }

    async updateTask(taskId: string) {
        try {
            const updatedTask = await this.backendService.updateTask(taskId, {
                name: 'Updated Task Name',
                description: 'Updated description'
            }).toPromise();

            console.log('Task updated:', updatedTask);
            this.loadTasks(); // Refresh the list
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }

    async deleteTask(taskId: string) {
        try {
            const deleted = await this.backendService.deleteTask(taskId).toPromise();
            if (deleted) {
                console.log('Task deleted successfully');
                this.loadTasks(); // Refresh the list
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }

    // Action Management Examples
    async getTaskActions(taskId: string) {
        try {
            const actions = await this.backendService.getActionsByTaskId(taskId).toPromise();
            console.log('Task actions:', actions);
        } catch (error) {
            console.error('Failed to get task actions:', error);
        }
    }

    async createAction(taskId: string) {
        try {
            const newAction = await this.backendService.createAction(taskId, {
                name: 'New Action',
                description: 'Action description',
            }).toPromise();

            console.log('Action created:', newAction);
        } catch (error) {
            console.error('Failed to create action:', error);
        }
    }

    async updateAction(taskId: string, actionId: string) {
        try {
            const updatedAction = await this.backendService.updateAction(taskId, actionId, {
                name: 'Updated Action Name',
                description: 'Updated description'
            }).toPromise();

            console.log('Action updated:', updatedAction);
        } catch (error) {
            console.error('Failed to update action:', error);
        }
    }

    async completeAction(taskId: string, actionId: string) {
        try {
            const completedAction = await this.backendService.completeAction(taskId, actionId).toPromise();
            console.log('Action completed:', completedAction);
        } catch (error) {
            console.error('Failed to complete action:', error);
        }
    }

    async deleteAction(taskId: string, actionId: string) {
        try {
            const deleted = await this.backendService.deleteAction(taskId, actionId).toPromise();
            if (deleted) {
                console.log('Action deleted successfully');
            }
        } catch (error) {
            console.error('Failed to delete action:', error);
        }
    }

    // Task Progress Examples
    async startTask(taskId: string) {
        try {
            const progress = await this.backendService.startTask(taskId).toPromise();
            console.log('Task started:', progress);
        } catch (error) {
            console.error('Failed to start task:', error);
        }
    }

    async completeTask(taskId: string) {
        try {
            const progress = await this.backendService.completeTask(taskId).toPromise();
            console.log('Task completed:', progress);
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    }

    async getTaskProgress() {
        try {
            const progress = await this.backendService.getTaskProgress().toPromise();
            console.log('Task progress:', progress);
        } catch (error) {
            console.error('Failed to get task progress:', error);
        }
    }

    // File Upload Example
    async uploadFile(event: any, taskId: string, actionId?: string) {
        const file = event.target.files[0];
        if (file) {
            try {
                const result = await this.backendService.uploadFile(file, taskId, actionId).toPromise();
                console.log('File uploaded:', result);
            } catch (error) {
                console.error('Failed to upload file:', error);
            }
        }
    }

    // Search and Filter Examples
    async searchUsers(searchTerm: string) {
        try {
            const response = await this.backendService.getUsers(1, 10, searchTerm).toPromise();
            this.users = response || [];

        } catch (error) {
            console.error('Failed to search users:', error);
        }
    }

    async filterTasksByCategory(category: string) {
        try {
            const response = await this.backendService.getTasks(1, 10, category).toPromise();
            this.tasks = response || [];
        } catch (error) {
            console.error('Failed to filter tasks:', error);
        }
    }
}
