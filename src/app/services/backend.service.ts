import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, UserToken } from '../models/user.model';
import { Task, TaskCreateRequest, TaskSuggestion, TaskProgress } from '../models/task.model';
import { Action } from '../models/action.model';
import { environment } from '../../environments/environment';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
    refreshToken?: string;
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
    // private baseUrl = 'http://localhost:3030';
    private baseUrl = environment.production ? environment.apiUrl : environment.apiUrlLocal;
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

    logout(): void {
        this.clearTokens();
        this.tokenSubject.next(null); // Check authentication status after logout
    }

    refreshToken(): Observable<LoginResponse> {
        const refreshToken = localStorage.getItem('refreshToken');
        return this.http.post<LoginResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken })
            .pipe(
                map(response => response),
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

    getCurrentUser(): User | null {
        const token = this.tokenSubject.value;
        if (!token) {
            return null;
        }
        // decode token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const loggedUser: UserToken = {
            id: payload.sub,
            username: payload.username,
            role: payload.role,
            createdAt: new Date(payload.iat * 1000),
            updatedAt: new Date(payload.iat * 1000)
        };
        return loggedUser as User;
    }

    // User Management Methods
    getUsers(page: number = 1, limit: number = 10, search?: string): Observable<User[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) {
            params = params.set('search', search);
        }
        
        return this.http.get<User[]>(`${this.baseUrl}/users`, {
            headers: this.headers,
            params
        }).pipe(
            map(response => {
                return response
            }),
            catchError(this.handleError)
        );
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
        return this.http.post<User>(`${this.baseUrl}/users`, userData, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    updateUser(id: string, userData: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/users/${id}`, userData, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    deleteUser(id: string): Observable<boolean> {
        return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/users/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.deleted),
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
        return this.http.get<Task>(`${this.baseUrl}/tasks?id=${id}`, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    createTask(taskData: TaskCreateRequest): Observable<Task> {
        // removing unused URL properties from task and actions
        taskData = this.stripUnusedTaskData(taskData);

        return this.http.post<Task>(`${this.baseUrl}/tasks`, taskData, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    updateTask(id: string, taskData: Task): Observable<Task> {
        if (taskData.actions) {
            taskData.actions.forEach((action) => {
                if (!action.imageUrl)
                    action.imageUrl = undefined;
                if (!action.url)
                    action.url = undefined;
            });
        }
        return this.http.patch<Task>(`${this.baseUrl}/tasks/${id}`,
            taskData, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
        
    }

    deleteTask(id: string): Observable<boolean> {
        return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/tasks/${id}`, { headers: this.headers })
            .pipe(
                map((response) => {
                    return response.deleted;
                }),
                catchError(this.handleError)
            );
    }

    // Task Progress Methods
    getTaskProgressByUserId(userId?: string): Observable<TaskProgress[]> {
        return this.http.get<TaskProgress[]>(`${this.baseUrl}/task-progress/${userId}`, {
            headers: this.headers,
        }).pipe(
            map(response => response),
            catchError(this.handleError)
        );
    }

    getTaskProgressByTaskId(userId?: string, taskId?: string): Observable<TaskProgress> {
        let params = new HttpParams();
        if (!taskId) {
            throw new Error('Cannot get progress when no actionId is provided in getTaskProgressById()')
        }

        return this.http.get<TaskProgress>(`${this.baseUrl}/task-progress/task/${userId}/${taskId}`, {
            headers: this.headers,
            params
        }).pipe(
            catchError(this.handleError)
        );
    }

    updateTaskProgress(progress: TaskProgress, uncompleteAction?: boolean): Observable<TaskProgress> {
        let params = new HttpParams();
        params = params.set('id', progress.taskId);
        return this.http.patch<TaskProgress>(`${this.baseUrl}/task-progress/${progress.taskId}`,
            progress, { headers: this.headers })
            .pipe(
                catchError(this.handleError)
            );
    }

    startTask(taskId: string): Observable<TaskProgress> {
        return this.http.post<TaskProgress>(`${this.baseUrl}/task-progress/${taskId}/start`, {}, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    completeTask(taskId: string): Observable<TaskProgress> {
        return this.http.post<TaskProgress>(`${this.baseUrl}/task-progress/${taskId}/complete`, {}, { headers: this.headers })
            .pipe(
                map(response => response),
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

        return this.http.get<PaginatedResponse<TaskSuggestion>>(`${this.baseUrl}/task-suggestions`, {
            headers: this.headers,
            params
        }).pipe(
            map(response => response),
            catchError(this.handleError)
        );
    }

    createTaskSuggestion(suggestion: Omit<TaskSuggestion, 'id' | 'createdAt'>): Observable<TaskSuggestion> {
        return this.http.post<TaskSuggestion>(`${this.baseUrl}/task-suggestions`, suggestion, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    updateTaskSuggestion(id: string, suggestionData: Partial<TaskSuggestion>): Observable<TaskSuggestion> {
        return this.http.put<TaskSuggestion>(`${this.baseUrl}/task-suggestions/${id}`, suggestionData, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    deleteTaskSuggestion(id: string): Observable<boolean> {
        return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/task-suggestions/${id}`, { headers: this.headers })
            .pipe(
                map(response => response.deleted),
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

        return this.http.post<{ url: string }>(`${this.baseUrl}/tasks/${taskId}/upload`, formData, { headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    private stripUnusedTaskData(taskData: TaskCreateRequest): TaskCreateRequest {
        // As of now we do not need imageURLs in actions as they are not implemented in BE
        taskData.actions.forEach((action) =>{
            action.url = action.url?.length ? action.url : undefined;
            action.imageUrl = undefined;
        });

        return taskData;
    }
}

