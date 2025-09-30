import { Injectable, InjectionToken, Provider } from '@angular/core';
import { BackendService } from './backend.service';
import { BackendMockService } from './backend-mock.service';
import { environment } from '../../environments/environment';

// Define a common interface for both services
export interface IBackendService {
    // Authentication
    login(credentials: any): any;
    logout(): void;
    refreshToken(): any;
    getCurrentUser(): any;

    // User Management
    getUsers(page?: number, limit?: number, search?: string): any;
    getUserById(id: string): any;
    createUser(userData: any): any;
    updateUser(id: string, userData: any): any;
    deleteUser(id: string): any;

    // Task Management
    getTasks(page?: number, limit?: number, category?: string, search?: string): any;
    getTaskById(id: string): any;
    createTask(taskData: any): any;
    updateTask(id: string, taskData: any): any;
    deleteTask(id: string): any;

    // Action Management
    getActionsByTaskId(taskId: string): any;
    createAction(taskId: string, actionData: any): any;
    updateAction(taskId: string, actionId: string, actionData: any): any;
    deleteAction(taskId: string, actionId: string): any;
    completeAction(taskId: string, actionId: string): any;

    // Task Progress
    getTaskProgress(userId?: string): any;
    updateTaskProgress(progress: any): any;
    startTask(taskId: string): any;
    completeTask(taskId: string): any;

    // Task Suggestions
    getTaskSuggestions(page?: number, limit?: number, status?: string): any;
    createTaskSuggestion(suggestion: any): any;
    updateTaskSuggestion(id: string, suggestionData: any): any;
    deleteTaskSuggestion(id: string): any;

    // Utility
    isAuthenticated(): boolean;
    getToken(): string | null;

    // File Upload
    uploadFile(file: File, taskId: string, actionId?: string): any;
}

// Create injection token
export const BACKEND_SERVICE = new InjectionToken<IBackendService>('BackendService');

// Factory function to provide the appropriate service
export function backendServiceFactory(
    backendService: BackendService,
    backendMockService: BackendMockService
): IBackendService {
    return environment.useMockBackend ? backendMockService : backendService;
}

// Provider configuration
export const BACKEND_SERVICE_PROVIDER: Provider = {
    provide: BACKEND_SERVICE,
    useFactory: backendServiceFactory,
    deps: [BackendService, BackendMockService]
};
