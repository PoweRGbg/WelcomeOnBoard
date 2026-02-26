import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Task, TaskCreateRequest, TaskSuggestion, TaskProgress } from '../models/task.model';
import { environment } from '../../environments/environment';
import { toUser } from '../common/utils';
import { Router } from '@angular/router';

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
    private sessionTimeoutInMinutes = 10;
    private baseUrl = environment.production ? environment.apiUrl : environment.apiUrlLocal;
    private tokenSubject = new BehaviorSubject<string | null>(null);
    public token$ = this.tokenSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        this.handleError = this.handleError.bind(this);
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

        if (error.status === 401) {
            errorMessage = 'Unauthorized access';
            this.logout();
        } 

        return throwError(() => new Error(errorMessage));
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials)
            .pipe(
                map(response => {
                    return {
                        token: response.token,
                        user: (response.user),
                        refreshToken: response.refreshToken,
                    };
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

    extendSession(userId: string): Observable<LoginResponse> {
        const token = localStorage.getItem('authToken');

        return this.http.post<LoginResponse>(`${this.baseUrl}/auth/extend-session`, { token, userId })
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
        this.tokenSubject.next(null);
    }

    refreshToken(userId: string): Observable<LoginResponse> {
        const refreshToken = this.tokenSubject.value;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            ...(refreshToken && { 'Authorization': `Bearer ${refreshToken}` })
        });

        return this.http.post<LoginResponse>(`${this.baseUrl}/auth/extend-session`, { token: refreshToken, userId }, { headers } )
            .pipe(
                map((response) => {
                    return response;
                }),
                tap((response) => {
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

        const payload = JSON.parse(atob(token.split('.')[1]));
        const loggedUser = this.createUserFromToken(payload);
        
        const lastActionAgo = Math.floor((Date.now() - loggedUser.createdAt!.getTime()) / (1000 * 60));
        
        const newLocal = this;
        if (lastActionAgo < newLocal.sessionTimeoutInMinutes) {
            newLocal.refreshToken(loggedUser._id).subscribe((refreshToken) =>{
                this.setToken(refreshToken.token);
                this.tokenSubject.next(refreshToken.token);
            });
        } else {
            this.logout();
        }

        return loggedUser;
    }

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

    getDepartments(page: number = 1, limit: number = 10, search?: string): Observable<string[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) {
            params = params.set('search', search);
        }
        
        return this.http.get<string[]>(`${this.baseUrl}/users/departments`, {
            headers: this.headers,
            params
        }).pipe(
            map(response => {
                return [...new Set(response)].sort();
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
        return this.http.patch<User>(`${this.baseUrl}/users/${id}`, userData, { headers: this.headers })
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
    getTasks(page: number = 1, limit: number = 10, department?: string, search?: string): Observable<Task[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<Task[]>(`${this.baseUrl}/tasks`, {
            headers: this.headers,
            params
        }).pipe(
            map((tasks) => tasks.map((task) => {
                return { ...task, department: task.department ?? 'All departments'};
            })),
            catchError(this.handleError)
        );
    }

    public getTaskNames(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/tasks/names`, { headers: this.headers })
            .pipe(
                map(response => response),
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

    getTaskbyName(name: string): Observable<Task> {
        return this.http.get<Task>(`${this.baseUrl}/tasks?name=${name}`, { headers: this.headers })
            .pipe(
                map(response => response),
                catchError(this.handleError)
            );
    }

    createTask(taskData: TaskCreateRequest): Observable<Task> {
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

        taskData = {
            ...taskData
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
    getTaskProgressByUserId(userId: string): Observable<TaskProgress[]> {
        if (!userId) {
            throw new Error('Cannot get progress when no userId is provided in getTaskProgressByUserId()')
        }
        return this.http.get<TaskProgress[]>(`${this.baseUrl}/task-progress/${userId}`, {
            headers: this.headers,
        }).pipe(
            map(response => {
                response.forEach(task =>  task.updatedAt ? task.updatedAt = new Date(task.updatedAt) : undefined)
                return response
            }),
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
    getTaskSuggestions(page: number = 1, limit: number = 10, status?: string): Observable<TaskSuggestion[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<TaskSuggestion[]>(`${this.baseUrl}/task-suggestions`, {
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
        return this.http.patch<TaskSuggestion>(`${this.baseUrl}/task-suggestions/${id}`, suggestionData, { headers: this.headers })
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

    private createUserFromToken(payload: any): User {
        return {
            _id: payload.sub,
            username: payload.username,
            role: payload.role,
            createdAt: new Date(payload.iat * 1000),
            updatedAt: new Date(payload.exp * 1000),
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            department: payload.department,
            isActive: payload.isActive
        }
    }
}

