import { User } from "../models/user.model";

export function toUser(userData: any): User {
    if (!userData || (!userData._id && !userData.id)) {
        throw Error('No error converting user data to User');
    }
    return {
        _id: userData._id ?? userData.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: userData.isActive,
        department: userData.department,
    };
}