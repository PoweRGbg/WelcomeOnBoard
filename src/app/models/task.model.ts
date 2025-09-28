import { Action } from './action.model';
import { UserInfo } from './user.model';

export interface Task {
    id: string;
    name: string;
    description?: string;
    category: string;
    url?: string;
    actions?: Action[];
    createdBy: UserInfo;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    completionCount: number;
    lastCompletedAt?: Date;
    isInProgress: boolean;
}

export interface TaskCreateRequest {
    name: string,
    description: string,
    category: string,
    url: string,
    actions: Action[],    
    createdBy: string,
    isActive: boolean,
    isInProgress: boolean
}

export interface TaskSuggestion {
    id: string;
    suggestedBy: string;
    taskName: string;
    description?: string;
    category: string;
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
    completedActions: string[];
    isCompleted: boolean;
    startedAt: Date;
    completedAt?: Date;
    currentActionIndex: number;
}
