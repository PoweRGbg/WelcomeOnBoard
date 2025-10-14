import { Action } from './action.model';
import { UserInfo } from './user.model';

export enum RecurringTaskPeriod {
    DAILY = 'dayly',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
    CUSTOM = 'custom',
} 
export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}
export interface Task {
    id: string;
    name: string;
    description?: string;
    department: string;
    url?: string;
    actions?: Action[];
    createdBy: UserInfo;
    createdAt?: Date;
    updatedAt?: Date;
    recurring?: RecurringTaskPeriod;
    dueDate?: Date;
    recurringPeriod?: number; // number of days
    isActive: boolean;
}

export interface TaskCreateRequest {
    name: string,
    description: string,
    department: string,
    url?: string,
    actions: Action[],    
    createdBy: string,
    isActive: boolean,
}

export interface TaskSuggestion {
    id: string;
    suggestedBy: string;
    taskName: string;
    description?: string;
    department: string;
    url?: string;
    actions?: Action[];
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
}

export interface TaskProgress {
    taskId: string;
    userId: string;
    actionsTotal: number;
    actionsCompleted: number;
    isCompleted: boolean;
    startedOn: Date;
}
