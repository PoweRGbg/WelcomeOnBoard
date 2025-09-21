import { Action, ActionCreateRequest } from './action.model';

export interface Task {
    id: string;
    name: string;
    description?: string;
    category: string;
    url?: string;
    actions: Action[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    completionCount: number;
    lastCompletedAt?: Date;
    isInProgress: boolean;
}

export interface TaskCreateRequest {
    name: string;
    description?: string;
    category: string;
    url?: string;
    actions: ActionCreateRequest[];
}

export interface TaskSuggestion {
    id: string;
    suggestedBy: string;
    taskName: string;
    description?: string;
    category: string;
    url?: string;
    actions: ActionCreateRequest[];
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
