export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}

export interface User {
    _id: string;
    username: string;
    password?: string;
    email: string;
    role: UserRole;
    department?: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
}
export interface UserToken {
    _id: string;
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

