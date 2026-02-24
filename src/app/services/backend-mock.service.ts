import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { Task, TaskCreateRequest, TaskSuggestion, TaskProgress, SuggestionStatus } from '../models/task.model';
import { Action } from '../models/action.model';
import { LoginRequest, LoginResponse, PaginatedResponse } from './backend.service';

@Injectable({
    providedIn: 'root'
})
export class BackendMockService {
    private tokenSubject = new BehaviorSubject<string | null>(null);
    public token$ = this.tokenSubject.asObservable();

    private mockUsers: User[] = [
        {
            _id: '1',
            username: 'admin',
            password: 'admin123',
            email: 'admin@company.com',
            role: UserRole.ADMIN,
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
        },
        {
            _id: '2',
            username: 'manager1',
            password: 'manager123',
            email: 'manager1@company.com',
            role: UserRole.MANAGER,
            firstName: 'John',
            lastName: 'Manager',
            isActive: true,
        },
        {
            _id: '3',
            username: 'employee1',
            password: 'employee123',
            email: 'employee1@company.com',
            role: UserRole.EMPLOYEE,
            firstName: 'Jane',
            lastName: 'Employee',
            isActive: true,
        },
        {
            _id: '4',
            username: 'employee2',
            password: 'employee123',
            email: 'employee2@company.com',
            role: UserRole.EMPLOYEE,
            firstName: 'Bob',
            lastName: 'Smith',
            isActive: true,
        }
    ];

    private mockTasks: Task[] = [
        {
            id: '1',
            name: 'Complete Employee Onboarding',
            description: 'Complete all required onboarding tasks for new employees',
            department: 'Onboarding',
            url: 'https://company.com/onboarding',
            actions: [
                {
                    id: '1-1',
                    name: 'Read Company Handbook',
                    description: 'Review the company handbook and policies',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/handbook',
                    isCompleted: false
                },
                {
                    id: '1-2',
                    name: 'Complete IT Setup',
                    description: 'Set up computer, email, and access credentials',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/it-setup',
                    isCompleted: false
                },
                {
                    id: '1-3',
                    name: 'Attend Welcome Meeting',
                    description: 'Meet with HR and team members',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/meetings',
                    isCompleted: false
                }
            ],
            createdBy: {
                _id: '1',
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User'
            },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            isActive: true,
        },
        {
            id: '2',
            name: 'Security Training',
            description: 'Complete mandatory security awareness training',
            department: 'Training',
            url: 'https://company.com/security-training',
            actions: [
                {
                    id: '2-1',
                    name: 'Watch Security Video',
                    description: 'Complete the security awareness video',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/security-video',
                    isCompleted: false
                },
                {
                    id: '2-2',
                    name: 'Take Security Quiz',
                    description: 'Pass the security knowledge assessment',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/security-quiz',
                    isCompleted: false
                }
            ],
            createdBy: {
                _id: '1',
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User'
            },
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
            isActive: true,
        },
        {
            id: '3',
            name: 'Equipment Setup',
            description: 'Set up and configure work equipment',
            department: 'Equipment',
            url: 'https://company.com/equipment',
            actions: [
                {
                    id: '3-1',
                    name: 'Collect Equipment',
                    description: 'Pick up laptop, monitor, and accessories',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/equipment-pickup',
                    isCompleted: false
                },
                {
                    id: '3-2',
                    name: 'Configure Software',
                    description: 'Install and configure required software',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/software-setup',
                    isCompleted: false
                }
            ],
            createdBy: {
                _id: '2',
                username: 'manager1',
                firstName: 'John',
                lastName: 'Manager'
            },
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-03'),
            isActive: true,
        }
    ];

    private mockTaskSuggestions: TaskSuggestion[] = [
        {
            id: '1',
            suggestedBy: '3',
            name: 'Team Building Workshop',
            description: 'Organize team building activities for new employees',
            department: 'Team Building',
            url: 'https://company.com/team-building',
            actions: [
                {
                    id: 's1-1',
                    name: 'Ice Breaker Games',
                    description: 'Play team building games',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/ice-breakers',
                    isCompleted: false
                }
            ],
            status: SuggestionStatus.PENDING,
            createdAt: new Date('2024-01-05'),
        },
        {
            id: '2',
            suggestedBy: '4',
            name: 'Mentorship Program',
            description: 'Pair new employees with experienced mentors',
            department: 'Development',
            url: 'https://company.com/mentorship',
            actions: [
                {
                    id: 's2-1',
                    name: 'Meet with Mentor',
                    description: 'Schedule regular meetings with assigned mentor',
                    imageUrl: 'https://via.placeholder.com/300x200',
                    url: 'https://company.com/mentor-meetings',
                    isCompleted: false
                }
            ],
            status: SuggestionStatus.APPROVED,
            createdAt: new Date('2024-01-06'),
        }
    ];

    private mockTaskProgress: TaskProgress[] = [
        {
            taskId: '1',
            userId: '3',
            isCompleted: false,
            actionsCompleted: 1,
            actionsTotal: this.mockTasks[0].actions?.length || 0,
            startedOn: new Date(),
            updatedAt: new Date(),
        },
        {
            taskId: '2',
            userId: '3',
            isCompleted: true,
            actionsCompleted: 2,
            actionsTotal: this.mockTasks[1].actions?.length || 0,
            startedOn: new Date(),
            updatedAt: new Date(),

        }
    ];

    constructor() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.tokenSubject.next(token);
        }
    }

    private generateMockToken(user: User): string {
        const payload = {
            sub: user._id,
            username: user.username,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        return btoa(JSON.stringify(payload));
    }

    private getCurrentUserFromToken(): User | null {
        const token = this.tokenSubject.value;
        if (!token) {
            return null;
        }
        try {
            const payload = JSON.parse(atob(token));
            return this.mockUsers.find(user => user._id === payload.sub) || null;
        } catch {
            return null;
        }
    }

    private simulateNetworkDelay(): Observable<any> {
        return of(null).pipe(delay(Math.random() * 500 + 200));
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const user = this.mockUsers.find(u =>
                    u.username === credentials.username &&
                    u.password === credentials.password &&
                    u.isActive
                );

                if (!user) {
                    throw new Error('Invalid credentials');
                }

                const token = this.generateMockToken(user);
                const response: LoginResponse = {
                    user: { ...user, password: undefined } as unknown as User,
                    token: token,
                    refreshToken: 'mock-refresh-token-' + user._id
                };

                this.setToken(token);
                localStorage.setItem('refreshToken', response.refreshToken!);

                return response;
            })
        );
    }

    logout(): void {
        this.clearTokens();
    }

    refreshToken(): Observable<LoginResponse> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const userId = refreshToken.split('-').pop();
                const user = this.mockUsers.find(u => u._id === userId);

                if (!user) {
                    throw new Error('Invalid refresh token');
                }

                const token = this.generateMockToken(user);
                const response: LoginResponse = {
                    user: { ...user, password: undefined } as unknown as User,
                    token: token,
                    refreshToken: refreshToken
                };

                this.setToken(token);
                return response;
            })
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
        return this.getCurrentUserFromToken();
    }

    getUsers(page: number = 1, limit: number = 10, search?: string): Observable<User[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                let filteredUsers = [...this.mockUsers];

                if (search) {
                    filteredUsers = filteredUsers.filter(user =>
                        user.username.toLowerCase().includes(search.toLowerCase()) ||
                        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
                        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
                        user.email.toLowerCase().includes(search.toLowerCase())
                    );
                }

                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;

                return filteredUsers.slice(startIndex, endIndex).map(user => ({
                    ...user,
                    password: undefined
                } as unknown as User));
            })
        );
    }

    getDepartments(page: number = 1, limit: number = 10, search?: string): Observable<string[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                let filteredUsers = [...this.mockUsers];

                if (search) {
                    filteredUsers = filteredUsers.filter(user =>
                        user.username.toLowerCase().includes(search.toLowerCase()) ||
                        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
                        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
                        user.email.toLowerCase().includes(search.toLowerCase())
                    );
                }

                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;

                return filteredUsers.slice(startIndex, endIndex).map(user => user.department ? user.department : 'unknown');
            })
        );
    }

    getUserById(id: string): Observable<User> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const user = this.mockUsers.find(u => u._id === id);
                if (!user) {
                    throw new Error('User not found');
                }
                return { ...user, password: undefined } as unknown as User;
            })
        );
    }

    createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const newUser: User = {
                    ...userData,
                    _id: (this.mockUsers.length + 1).toString(),
                };
                this.mockUsers.push(newUser);
                return { ...newUser, password: undefined } as unknown as User;
            })
        );
    }

    updateUser(id: string, userData: Partial<User>): Observable<User> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const userIndex = this.mockUsers.findIndex(u => u._id === id);
                if (userIndex === -1) {
                    throw new Error('User not found');
                }

                this.mockUsers[userIndex] = {
                    ...this.mockUsers[userIndex],
                    ...userData,
                };

                return { ...this.mockUsers[userIndex], password: undefined } as unknown as User;
            })
        );
    }

    deleteUser(id: string): Observable<boolean> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const userIndex = this.mockUsers.findIndex(u => u._id === id);
                if (userIndex === -1) {
                    throw new Error('User not found');
                }

                this.mockUsers.splice(userIndex, 1);
                return true;
            })
        );
    }

    getTasks(page: number = 1, limit: number = 10, category?: string, search?: string): Observable<Task[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                let filteredTasks = [...this.mockTasks];

                if (category) {
                    filteredTasks = filteredTasks.filter(task =>
                        task.department.toLowerCase() === category.toLowerCase()
                    );
                }

                if (search) {
                    filteredTasks = filteredTasks.filter(task =>
                        task.name.toLowerCase().includes(search.toLowerCase()) ||
                        task.description?.toLowerCase().includes(search.toLowerCase())
                    );
                }

                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;

                return filteredTasks.slice(startIndex, endIndex);
            })
        );
    }

    getTaskNames(): Observable<string[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                return this.mockTasks.map(task => task.name);
            })
        );
    }

    getTaskById(id: string): Observable<Task> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const task = this.mockTasks.find(t => t.id === id);
                if (!task) {
                    throw new Error('Task not found');
                }
                return task;
            })
        );
    }

    createTask(taskData: TaskCreateRequest): Observable<Task> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const createdBy = this.mockUsers.find(u => u._id === taskData.createdBy);
                if (!createdBy) {
                    throw new Error('User not found');
                }

                const newTask: Task = {
                    ...taskData,
                    id: (this.mockTasks.length + 1).toString(),
                    createdBy: {
                        _id: createdBy._id,
                        username: createdBy.username,
                        firstName: createdBy.firstName,
                        lastName: createdBy.lastName
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                this.mockTasks.push(newTask);
                return newTask;
            })
        );
    }

    updateTask(id: string, taskData: Partial<Task> | TaskCreateRequest): Observable<Task> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const taskIndex = this.mockTasks.findIndex(t => t.id === id);
                if (taskIndex === -1) {
                    throw new Error('Task not found');
                }

                this.mockTasks[taskIndex] = {
                    ...this.mockTasks[taskIndex],
                    ...taskData,
                    createdBy: this.mockTasks[taskIndex].createdBy,
                    updatedAt: new Date()
                };

                return this.mockTasks[taskIndex];
            })
        );
    }

    deleteTask(id: string): Observable<boolean> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const taskIndex = this.mockTasks.findIndex(t => t.id === id);
                if (taskIndex === -1) {
                    throw new Error('Task not found');
                }

                this.mockTasks.splice(taskIndex, 1);
                return true;
            })
        );
    }

    getActionsByTaskId(taskId: string): Observable<Action[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const task = this.mockTasks.find(t => t.id === taskId);
                if (!task) {
                    throw new Error('Task not found');
                }
                return task.actions || [];
            })
        );
    }

    createAction(taskId: string, actionData: Omit<Action, 'id' | 'isCompleted' | 'completedAt' | 'completedBy'>): Observable<Action> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const task = this.mockTasks.find(t => t.id === taskId);
                if (!task) {
                    throw new Error('Task not found');
                }

                const newAction: Action = {
                    ...actionData,
                    id: `${taskId}-${(task.actions?.length || 0) + 1}`,
                    isCompleted: false
                };

                if (!task.actions) {
                    task.actions = [];
                }
                task.actions.push(newAction);
                task.updatedAt = new Date();

                return newAction;
            })
        );
    }

    updateAction(taskId: string, actionId: string, actionData: Partial<Action>): Observable<Action> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const task = this.mockTasks.find(t => t.id === taskId);
                if (!task || !task.actions) {
                    throw new Error('Task or action not found');
                }

                const actionIndex = task.actions.findIndex(a => a.id === actionId);
                if (actionIndex === -1) {
                    throw new Error('Action not found');
                }

                task.actions[actionIndex] = {
                    ...task.actions[actionIndex],
                    ...actionData
                };
                task.updatedAt = new Date();

                return task.actions[actionIndex];
            })
        );
    }

    deleteAction(taskId: string, actionId: string): Observable<boolean> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const task = this.mockTasks.find(t => t.id === taskId);
                if (!task || !task.actions) {
                    throw new Error('Task or action not found');
                }

                const actionIndex = task.actions.findIndex(a => a.id === actionId);
                if (actionIndex === -1) {
                    throw new Error('Action not found');
                }

                task.actions.splice(actionIndex, 1);
                task.updatedAt = new Date();

                return true;
            })
        );
    }

    completeAction(taskId: string, actionId: string): Observable<TaskProgress> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const currentUser = this.getCurrentUserFromToken();
                const taskProgressIndex = this.mockTaskProgress.findIndex(task =>
                    task.taskId === taskId && task.userId === currentUser?._id
                );
                let progressToUpdate = this.mockTaskProgress[taskProgressIndex];
                progressToUpdate.actionsCompleted +=1;

                if (progressToUpdate.actionsCompleted === progressToUpdate.actionsTotal) {
                    progressToUpdate.isCompleted = true;
                }

                this.mockTaskProgress[taskProgressIndex] = progressToUpdate;
                return this.mockTaskProgress[taskProgressIndex];
            })
        );
    }

    getTaskProgressByUserId(userId?: string): Observable<TaskProgress[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                let filteredProgress: TaskProgress[] = [];
                if (userId) {
                    filteredProgress = this.mockTaskProgress.filter((progress) =>
                        progress.userId === userId
                    );
                }
                return filteredProgress;
            })
        );
    }

    getTaskProgressByTaskId(userId?: string, taskId?: string): Observable<TaskProgress | null> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                let filteredProgress: TaskProgress | null = null;
                if (userId) {
                    filteredProgress = this.mockTaskProgress.find(progress =>
                        progress.userId === userId && progress.taskId === taskId
                    ) ?? null;
                    if (!filteredProgress && taskId){
                        filteredProgress = {
                            taskId,
                            userId,
                            actionsCompleted: 0,
                            actionsTotal: this.mockTasks.find(task => task.id === taskId)?.actions?.length ?? 0,
                            isCompleted: false,
                            startedOn: new Date(),
                            updatedAt: new Date(),
                        }
                        this.mockTaskProgress.push(filteredProgress);
                    }
                }


                return filteredProgress;
            })
        );
    }

    updateTaskProgress(taskProgress: TaskProgress, uncompleteAction?: boolean): Observable<TaskProgress> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const taskIndex = this.mockTaskProgress.indexOf(taskProgress);
                if (taskProgress.actionsCompleted < taskProgress.actionsTotal) {
                    taskProgress.actionsCompleted += 1;
                } 

                if (taskProgress.actionsCompleted === taskProgress.actionsTotal) {
                    taskProgress.isCompleted = true;
                }

                this.mockTaskProgress[taskIndex] = taskProgress;
                return taskProgress;
            })
        );
    }

    startTask(taskId: string): Observable<TaskProgress> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const currentUser = this.getCurrentUserFromToken();
                if (!currentUser) {
                    throw new Error('User not authenticated');
                }

                const existingTask = this.mockTaskProgress.find((progress) => progress.taskId === taskId);
                if (!existingTask) {
                    throw new Error('No existing task to restart!');
                }

                const taskIndex = this.mockTaskProgress.indexOf(existingTask);
                
                const newProgress: TaskProgress = {
                    taskId: taskId,
                    userId: currentUser._id,
                    isCompleted: false,
                    actionsCompleted: 0,
                    actionsTotal: this.mockTasks.find(task => task.id === taskId)?.actions?.length ?? 0,
                    startedOn: new Date(),
                    updatedAt: new Date(),
                };

                this.mockTaskProgress[taskIndex] = newProgress;
                
                return newProgress;
            })
        );
    }

    completeTask(taskId: string): Observable<TaskProgress> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const currentUser = this.getCurrentUserFromToken();
                if (!currentUser) {
                    throw new Error('User not authenticated');
                }

                const progress = this.mockTaskProgress.find(p =>
                    p.taskId === taskId && p.userId === currentUser._id
                );

                if (!progress) {
                    throw new Error('Task progress not found');
                }
                progress.isCompleted = true;
                
                return progress;
            })
        );
    }

    getTaskSuggestions(page: number = 1, limit: number = 10, status?: string): Observable<TaskSuggestion[]> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                let filteredSuggestions = [...this.mockTaskSuggestions];

                if (status) {
                    filteredSuggestions = filteredSuggestions.filter(suggestion =>
                        suggestion.status === status
                    );
                }

                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedSuggestions = filteredSuggestions.slice(startIndex, endIndex);

                return paginatedSuggestions;
            })
        );
    }

    createTaskSuggestion(suggestion: Omit<TaskSuggestion, 'id' | 'createdAt'>): Observable<TaskSuggestion> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const newSuggestion: TaskSuggestion = {
                    ...suggestion,
                    id: (this.mockTaskSuggestions.length + 1).toString(),
                    createdAt: new Date()
                };

                this.mockTaskSuggestions.push(newSuggestion);
                return newSuggestion;
            })
        );
    }

    updateTaskSuggestion(id: string, suggestionData: Partial<TaskSuggestion>): Observable<TaskSuggestion> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const suggestionIndex = this.mockTaskSuggestions.findIndex(s => s.id === id);
                if (suggestionIndex === -1) {
                    throw new Error('Task suggestion not found');
                }

                this.mockTaskSuggestions[suggestionIndex] = {
                    ...this.mockTaskSuggestions[suggestionIndex],
                    ...suggestionData
                };

                return this.mockTaskSuggestions[suggestionIndex];
            })
        );
    }

    deleteTaskSuggestion(id: string): Observable<boolean> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const suggestionIndex = this.mockTaskSuggestions.findIndex(s => s.id === id);
                if (suggestionIndex === -1) {
                    throw new Error('Task suggestion not found');
                }

                this.mockTaskSuggestions.splice(suggestionIndex, 1);
                return true;
            })
        );
    }

    isAuthenticated(): boolean {
        return !!this.tokenSubject.value;
    }

    getToken(): string | null {
        return this.tokenSubject.value;
    }

    uploadFile(file: File, taskId: string, actionId?: string): Observable<{ url: string }> {
        return this.simulateNetworkDelay().pipe(
            map(() => {
                const mockUrl = `https://mock-storage.com/files/${taskId}/${actionId || 'general'}/${file.name}`;
                return { url: mockUrl };
            })
        );
    }
}
