import { Action } from './action.model';
import { UserInfo } from './user.model';

export enum RecurringTaskPeriod {
    NONE = 'None',
    DAILY = 'Daily',
    WEEKLY = 'Weekly',
    MONTHLY = 'Monthly',
    YEARLY = 'Yearly',
    CUSTOM = 'Custom',
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
    recurring: RecurringTaskPeriod,
    dueDate?: Date,
}

export interface TaskSuggestion {
    id: string;
    suggestedBy: string;
    name: string;
    description?: string;
    department: string;
    url?: string;
    actions?: Action[];
    status?: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    // reviewedBy?: string;
    recurring?: RecurringTaskPeriod;
    dueDate?: Date;
}

export interface TaskProgress {
    taskId: string;
    userId: string;
    actionsTotal: number;
    actionsCompleted: number;
    isCompleted: boolean;
    startedOn: Date;
    completedOn?: Date;
    updatedAt?: Date;
}
