import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { Task, TaskCreateRequest, TaskSuggestion, TaskProgress } from '../models/task.model';
import { Action, ActionCreateRequest } from '../models/action.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private users = signal<User[]>([]);
    private tasks = signal<Task[]>([]);
    private taskSuggestions = signal<TaskSuggestion[]>([]);
    private taskProgress = signal<TaskProgress[]>([]);

    constructor() {
        this.initializeData();
    }

    private initializeData(): void {
        // Initialize with sample data
        const sampleUsers: User[] = [
            {
                id: '1',
                username: 'admin',
                password: 'admin',
                email: 'admin@company.com',
                role: UserRole.ADMIN,
                firstName: 'Admin',
                lastName: 'User',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '2',
                username: 'manager',
                password: 'manager',
                email: 'manager1@company.com',
                role: UserRole.MANAGER,
                firstName: 'John',
                lastName: 'Manager',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '3',
                username: 'employee',
                password: 'employee',
                email: 'employee1@company.com',
                role: UserRole.EMPLOYEE,
                firstName: 'Jane',
                lastName: 'Employee',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        const sampleTasks: Task[] = [
            {
                id: '1',
                name: 'New Employee Onboarding',
                description: 'Complete onboarding process for new employees',
                category: 'HR',
                actions: [
                    {
                        id: '1',
                        name: 'Complete HR paperwork',
                        description: 'Fill out all required HR forms',
                        order: 1,
                        isCompleted: false
                    },
                    {
                        id: '2',
                        name: 'Set up computer and accounts',
                        description: 'Configure work computer and create necessary accounts',
                        order: 2,
                        isCompleted: false
                    },
                    {
                        id: '3',
                        name: 'Attend orientation meeting',
                        description: 'Join the company orientation session',
                        order: 3,
                        isCompleted: false
                    }
                ],
                createdBy: '1',
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                completionCount: 0,
                isInProgress: false
            }
        ];

        this.users.set(sampleUsers);
        this.tasks.set(sampleTasks);
    }

    // User management
    getUsers(): User[] {
        return this.users();
    }

    createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
        const newUser: User = {
            ...user,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.users.update(users => [...users, newUser]);
        return newUser;
    }

    updateUser(id: string, updates: Partial<User>): User | null {
        const user = this.users().find(u => u.id === id);
        if (!user) return null;

        const updatedUser = { ...user, ...updates, updatedAt: new Date() };
        this.users.update(users => users.map(u => u.id === id ? updatedUser : u));
        return updatedUser;
    }

    deleteUser(id: string): boolean {
        const userExists = this.users().some(u => u.id === id);
        if (!userExists) return false;

        this.users.update(users => users.filter(u => u.id !== id));
        return true;
    }

    // Task management
    getTasks(): Task[] {
        return this.tasks();
    }

    getTaskById(id: string): Task | null {
        return this.tasks().find(t => t.id === id) || null;
    }

    createTask(taskData: TaskCreateRequest, createdBy: string): Task {
        const actions = this.convertActionsToAction(taskData.actions);

        const newTask: Task = {
            ...taskData,
            actions,
            id: uuidv4(),
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            completionCount: 0,
            isInProgress: false
        };
        this.tasks.update(tasks => [...tasks, newTask]);
        return newTask;
    }

    private convertActionsToAction(actions: any[]): Action[] {
        return actions.map(actionData => {
            if ('id' in actionData && 'isCompleted' in actionData) {
                // Already an Action
                return actionData as Action;
            } else {
                // ActionCreateRequest, convert to Action
                return {
                    ...actionData,
                    id: uuidv4(),
                    isCompleted: false
                };
            }
        });
    }

    updateTask(id: string, updates: Partial<Task> | TaskCreateRequest): Task | null {
        const task = this.tasks().find(t => t.id === id);
        if (!task) return null;

        let updatedTask: Task;

        // Handle different update types
        if ('actions' in updates && updates.actions && Array.isArray(updates.actions)) {
            // TaskCreateRequest with actions - convert actions
            const actions = this.convertActionsToAction(updates.actions);
            updatedTask = {
                ...task,
                name: updates.name || task.name,
                description: updates.description,
                category: updates.category || task.category,
                url: updates.url,
                actions,
                updatedAt: new Date()
            };
        } else {
            // Partial<Task> update - ensure no ActionCreateRequest[] in actions
            const safeUpdates = { ...updates } as any;
            if ('actions' in safeUpdates && safeUpdates.actions && Array.isArray(safeUpdates.actions)) {
                safeUpdates.actions = this.convertActionsToAction(safeUpdates.actions);
            }
            updatedTask = { ...task, ...safeUpdates, updatedAt: new Date() };
        }

        this.tasks.update(tasks => tasks.map(t => t.id === id ? updatedTask : t));
        return updatedTask;
    }

    deleteTask(id: string): boolean {
        const taskExists = this.tasks().some(t => t.id === id);
        if (!taskExists) return false;

        this.tasks.update(tasks => tasks.filter(t => t.id !== id));
        return true;
    }

    // Task suggestions
    getTaskSuggestions(): TaskSuggestion[] {
        return this.taskSuggestions();
    }

    createTaskSuggestion(suggestion: Omit<TaskSuggestion, 'id' | 'createdAt'>): TaskSuggestion {
        const newSuggestion: TaskSuggestion = {
            ...suggestion,
            id: uuidv4(),
            createdAt: new Date()
        };
        this.taskSuggestions.update(suggestions => [...suggestions, newSuggestion]);
        return newSuggestion;
    }

    updateTaskSuggestion(id: string, updates: Partial<TaskSuggestion>): TaskSuggestion | null {
        const suggestion = this.taskSuggestions().find(s => s.id === id);
        if (!suggestion) return null;

        const updatedSuggestion = { ...suggestion, ...updates };
        this.taskSuggestions.update(suggestions =>
            suggestions.map(s => s.id === id ? updatedSuggestion : s)
        );
        return updatedSuggestion;
    }

    // Task progress
    getTaskProgress(userId: string): TaskProgress[] {
        return this.taskProgress().filter(p => p.userId === userId);
    }

    updateTaskProgress(progress: TaskProgress): void {
        this.taskProgress.update(progresses => {
            const existingIndex = progresses.findIndex(p => p.taskId === progress.taskId && p.userId === progress.userId);
            if (existingIndex >= 0) {
                return progresses.map((p, index) => index === existingIndex ? progress : p);
            } else {
                return [...progresses, progress];
            }
        });
    }

    completeAction(taskId: string, actionId: string, userId: string): void {
        const progress = this.taskProgress().find(p => p.taskId === taskId && p.userId === userId);
        const task = this.getTaskById(taskId);

        if (!task) return;

        if (!progress) {
            // Create new progress
            const newProgress: TaskProgress = {
                taskId,
                userId,
                completedActions: [actionId],
                isCompleted: false,
                startedAt: new Date(),
                currentActionIndex: 1
            };
            this.updateTaskProgress(newProgress);
        } else {
            // Update existing progress
            if (!progress.completedActions.includes(actionId)) {
                const updatedProgress = {
                    ...progress,
                    completedActions: [...progress.completedActions, actionId],
                    currentActionIndex: progress.currentActionIndex + 1
                };

                // Check if task is completed
                if (updatedProgress.completedActions.length === task.actions.length) {
                    updatedProgress.isCompleted = true;
                    updatedProgress.completedAt = new Date();
                }

                this.updateTaskProgress(updatedProgress);
            }
        }
    }
}
