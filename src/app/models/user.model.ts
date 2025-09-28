export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    EMPLOYEE = 'employee'
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
}
export interface UserInfo {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
}
