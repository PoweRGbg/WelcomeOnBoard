import { User } from "../models/user.model";

export function toUser(userData: any): User {
    return {
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: userData.isActive,
        department: userData.department,
    };
}