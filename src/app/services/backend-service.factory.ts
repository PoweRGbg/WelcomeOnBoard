import { Injectable, InjectionToken, Provider } from '@angular/core';
import { BackendService, LoginResponse, PaginatedResponse } from './backend.service';
import { BackendMockService } from './backend-mock.service';
import { environment } from '../../environments/environment';
import { Task, TaskProgress, TaskSuggestion } from '../models/task.model';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

// Define a common interface for both services
export interface IBackendService {
    // Authentication
    login(credentials: any): Observable<LoginResponse>;
    logout(): void;
    refreshToken(userId: string): void;
    getCurrentUser(): any;
    
    // User Management
    getUsers(page?: number, limit?: number, search?: string): Observable<User[]>;
    getUserById(id: string): Observable<User>;
    createUser(userData: any): Observable<User>;
    updateUser(id: string, userData: any): Observable<User>;
    deleteUser(id: string): Observable<boolean>;
    getDepartments(): Observable<string[]>;

    // Task Management
    getTasks(page?: number, limit?: number, category?: string, search?: string): Observable<Task[]>;
    getTaskById(id: string): Observable<Task>;
    createTask(taskData: any): Observable<Task>;
    updateTask(id: string, taskData: any): Observable<Task>;
    deleteTask(id: string): Observable<boolean>;

    // Task Progress
    getTaskProgressByUserId(userId?: string): Observable<TaskProgress[]>;
    getTaskProgressByTaskId(userId?: string, taskId?: any): Observable<TaskProgress | null>;
    getTaskNames(): Observable<string[]>;
    updateTaskProgress(progress: TaskProgress, uncompleteAction?: boolean): Observable<TaskProgress>;
    startTask(taskId: string): Observable<TaskProgress>;
    completeTask(taskId: string): Observable<TaskProgress>;

    // Task Suggestions
    // getTaskSuggestions(page?: number, limit?: number, status?: string): Observable<PaginatedResponse<TaskSuggestion>>;
    getTaskSuggestions(page?: number, limit?: number, status?: string): Observable<TaskSuggestion[]>;
    createTaskSuggestion(suggestion: any): Observable<TaskSuggestion>;
    updateTaskSuggestion(id: string, suggestionData: any): Observable<TaskSuggestion>;
    deleteTaskSuggestion(id: string): Observable<boolean>;

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
