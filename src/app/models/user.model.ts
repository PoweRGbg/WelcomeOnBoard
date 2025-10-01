export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}

export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    startedTasks: StartedTask[];
}
export interface UserToken {
    id: string;
    username: string;
    password?: string;
    email?: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserInfo {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
}

export interface StartedTask {
    taskId: string;
    actionCompleted: number; // last completed action index in the task's action list
    startedAt: Date;
    isInProgress: boolean;
}