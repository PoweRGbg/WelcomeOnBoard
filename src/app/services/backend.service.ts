import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { Task, TaskCreateRequest, TaskSuggestion, TaskProgress } from '../models/task.model';
import { Action } from '../models/action.model';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
    refreshToken?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class BackendService {
    private baseUrl = 'http://localhost:3000'; // Update this to your actual backend URL
    private tokenSubject = new BehaviorSubject<string | null>(null);
    public token$ = this.tokenSubject.asObservable();

    constructor(private http: HttpClient) {
        // Load token from localStorage on service initialization
        const token = localStorage.getItem('authToken');
        if (token) {
            this.tokenSubject.next(token);
        }
    }

    private get headers(): HttpHeaders {
        const token = this.tokenSubject.value;
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        });
    }

    private handleError(error: any): Observable<never> {
        console.error('Backend Service Error:', error);
        let errorMessage = 'An error occurred';

        if (error.error?.message) {
            errorMessage = error.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
    }

    // Authentication Methods
    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials)
            .pipe(
                map(response => {
                    return response;
                }),
                tap(response => {
                    this.setToken(response.token);
                    if (response.refreshToken) {
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                }),
                catchError(this.handleError)
            );
    }

    logout(): Observable<any> {
        const refreshToken = localStorage.getItem('refreshToken');
        return this.http.post(`${this.baseUrl}/auth/logout`, { refreshToken })
            .pipe(
                tap(() => {
                    this.clearTokens();
                }),
                catchError(this.handleError)
            );
    }

    refreshToken(): Observable<LoginResponse> {
        const refreshToken = localStorage.getItem('refreshToken');
        return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/refresh`, { refreshToken })
            .pipe(
                map(response => response.data),
                tap(response => {
                    this.setToken(response.token);
                    if (response.refreshToken) {
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                }),
                catchError(this.handleError)
            );
    }

    private setToken(token: string): void {
        localStorage.setItem('authToken', token);
        this.tokenSubject.next(token);
    }

    private clearTokens(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        this.tokenSubject.next(null);
    }

    getCurrentUser(): Observable<User> {
        return this.http.get<ApiResponse<User>>(`${this.baseUrl}/auth/profile`, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    // User Management Methods
    getUsers(page: number = 1, limit: number = 10, search?: string): Observable<User[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) {
            params = params.set('search', search);
        }
        console.log('Getting users with params:', params.toString());
        
        return this.http.get<User[]>(`${this.baseUrl}/users`, {
            headers: this.headers,
            params
        }).pipe(
            map(response => {
                console.log('Received users response:', response);
                
                return response
            }),
            catchError(this.handleError)
        );
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
        return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users`, userData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    updateUser(id: string, userData: Partial<User>): Observable<User> {
        return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, userData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    deleteUser(id: string): Observable<boolean> {
        return this.http.delete<ApiResponse<{ deleted: boolean }>>(`${this.baseUrl}/users/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.data.deleted),
                catchError(this.handleError)
            );
    }

    // Task Management Methods
    getTasks(page: number = 1, limit: number = 10, category?: string, search?: string): Observable<Task[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (category) {
            params = params.set('category', category);
        }

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<Task[]>(`${this.baseUrl}/tasks`, {
            headers: this.headers,
            params
        }).pipe(
            catchError(this.handleError)
        );
    }

    getTaskById(id: string): Observable<Task> {
        return this.http.get<ApiResponse<Task>>(`${this.baseUrl}/tasks/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    createTask(taskData: TaskCreateRequest): Observable<Task> {
        return this.http.post<ApiResponse<Task>>(`${this.baseUrl}/tasks`, taskData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    updateTask(id: string, taskData: Partial<Task> | TaskCreateRequest): Observable<Task> {
        return this.http.put<ApiResponse<Task>>(`${this.baseUrl}/tasks/${id}`, taskData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    deleteTask(id: string): Observable<boolean> {
        return this.http.delete<ApiResponse<{ deleted: boolean }>>(`${this.baseUrl}/tasks/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.data.deleted),
                catchError(this.handleError)
            );
    }

    // Action Management Methods
    getActionsByTaskId(taskId: string): Observable<Action[]> {
        return this.http.get<ApiResponse<Action[]>>(`${this.baseUrl}/tasks/${taskId}/actions`, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    createAction(taskId: string, actionData: Omit<Action, 'id' | 'isCompleted' | 'completedAt' | 'completedBy'>): Observable<Action> {
        return this.http.post<ApiResponse<Action>>(`${this.baseUrl}/tasks/${taskId}/actions`, actionData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    updateAction(taskId: string, actionId: string, actionData: Partial<Action>): Observable<Action> {
        return this.http.put<ApiResponse<Action>>(`${this.baseUrl}/tasks/${taskId}/actions/${actionId}`, actionData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    deleteAction(taskId: string, actionId: string): Observable<boolean> {
        return this.http.delete<ApiResponse<{ deleted: boolean }>>(`${this.baseUrl}/tasks/${taskId}/actions/${actionId}`, { headers: this.headers })
            .pipe(
                map(response => response.data.deleted),
                catchError(this.handleError)
            );
    }

    completeAction(taskId: string, actionId: string): Observable<Action> {
        return this.http.post<ApiResponse<Action>>(`${this.baseUrl}/tasks/${taskId}/actions/${actionId}/complete`, {}, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    // Task Progress Methods
    getTaskProgress(userId?: string): Observable<TaskProgress[]> {
        let params = new HttpParams();
        if (userId) {
            params = params.set('userId', userId);
        }

        return this.http.get<ApiResponse<TaskProgress[]>>(`${this.baseUrl}/task-progress`, {
            headers: this.headers,
            params
        }).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    updateTaskProgress(progress: TaskProgress): Observable<TaskProgress> {
        return this.http.put<ApiResponse<TaskProgress>>(`${this.baseUrl}/task-progress`, progress, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    startTask(taskId: string): Observable<TaskProgress> {
        return this.http.post<ApiResponse<TaskProgress>>(`${this.baseUrl}/tasks/${taskId}/start`, {}, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    completeTask(taskId: string): Observable<TaskProgress> {
        return this.http.post<ApiResponse<TaskProgress>>(`${this.baseUrl}/tasks/${taskId}/complete`, {}, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    // Task Suggestions Methods
    getTaskSuggestions(page: number = 1, limit: number = 10, status?: string): Observable<PaginatedResponse<TaskSuggestion>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<ApiResponse<PaginatedResponse<TaskSuggestion>>>(`${this.baseUrl}/task-suggestions`, {
            headers: this.headers,
            params
        }).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    createTaskSuggestion(suggestion: Omit<TaskSuggestion, 'id' | 'createdAt'>): Observable<TaskSuggestion> {
        return this.http.post<ApiResponse<TaskSuggestion>>(`${this.baseUrl}/task-suggestions`, suggestion, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    updateTaskSuggestion(id: string, suggestionData: Partial<TaskSuggestion>): Observable<TaskSuggestion> {
        return this.http.put<ApiResponse<TaskSuggestion>>(`${this.baseUrl}/task-suggestions/${id}`, suggestionData, { headers: this.headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }

    deleteTaskSuggestion(id: string): Observable<boolean> {
        return this.http.delete<ApiResponse<{ deleted: boolean }>>(`${this.baseUrl}/task-suggestions/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.data.deleted),
                catchError(this.handleError)
            );
    }

    // Utility Methods
    isAuthenticated(): boolean {
        return !!this.tokenSubject.value;
    }

    getToken(): string | null {
        return this.tokenSubject.value;
    }

    // File Upload Methods (if needed for action images)
    uploadFile(file: File, taskId: string, actionId?: string): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        if (actionId) {
            formData.append('actionId', actionId);
        }

        const headers = new HttpHeaders();
        if (this.tokenSubject.value) {
            headers.set('Authorization', `Bearer ${this.tokenSubject.value}`);
        }

        return this.http.post<ApiResponse<{ url: string }>>(`${this.baseUrl}/tasks/${taskId}/upload`, formData, { headers })
            .pipe(
                map(response => response.data),
                catchError(this.handleError)
            );
    }
}
