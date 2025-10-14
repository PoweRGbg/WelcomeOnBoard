import { User } from "../models/user.model";
import { RecurringTaskPeriod, Task } from "../models/task.model";

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

export function getTaskDueDate(task: Task): Date | null{
    if (!task.dueDate) {
        if (task.recurring === RecurringTaskPeriod.NONE) {
            return null;
        } else if (task.recurring === RecurringTaskPeriod.DAILY) {
            return new Date(new Date().setDate(new Date().getDate() + 1));
        } else if (task.recurring === RecurringTaskPeriod.WEEKLY) {
            return new Date(new Date().setDate(new Date().getDate() + 7));
        } else if (task.recurring === RecurringTaskPeriod.MONTHLY) {
            return new Date(new Date().setMonth(new Date().getMonth() + 1));
        } else if (task.recurring === RecurringTaskPeriod.YEARLY) {
            return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        }
    } else {
        return new Date(task.dueDate);
    }
    return null;
}

export function convertAuDateToDate(dateString: string): Date | null {
    if (!dateString || dateString.split('/').length !== 3) {
        return null;
    }

    const parts = dateString.split('/');
    const day = +parts[0];
    const month = +parts[1];
    const year = +parts[2];
    const dateObject = new Date(year, month - 1, day);
    
    if (
        dateObject.getFullYear() === year &&
        dateObject.getMonth() === month - 1 &&
        dateObject.getDate() === day
    ) {
        return dateObject;
    } else {
        return null;
    }
}

export function getNextSunday(referenceDate: Date = new Date()): Date {
    const currentDayOfWeek = referenceDate.getDay();
    let daysUntilNextSunday: number;

    if (currentDayOfWeek === 0) {
        daysUntilNextSunday = 7;
    } else {
        daysUntilNextSunday = 7 - currentDayOfWeek;
    }

    const nextSunday = new Date(referenceDate);
    nextSunday.setDate(referenceDate.getDate() + daysUntilNextSunday);
    nextSunday.setHours(0, 0, 0, 0);

    return nextSunday;
}

export function daysLeft(task: Task): number {
    if (!task.dueDate && !task.recurring) {
        return -1;
    }
    let daysLeft = 0;
    const today = new Date();
    if (task.recurring === RecurringTaskPeriod.MONTHLY) {
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        task.dueDate = lastDayOfMonth;
        daysLeft = (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    } else if (task.recurring === RecurringTaskPeriod.YEARLY) {
        const lastDayOfYear = new Date(today.getFullYear() + 1, 0, 0);
        task.dueDate = lastDayOfYear;
        daysLeft = (lastDayOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    } else if (task.recurring === RecurringTaskPeriod.WEEKLY) {
        const lastDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7 - today.getDay());
        task.dueDate = lastDayOfWeek;
        daysLeft = (lastDayOfWeek.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    } else if (task.recurring === RecurringTaskPeriod.DAILY) {          
        today.setHours(23, 59, 59, 999);
        task.dueDate = today;
        daysLeft = (today.getTime() - today.getTime()) / (1000 * 60 * 60);
    } else if (task.recurring === RecurringTaskPeriod.CUSTOM) {
        if (!task.dueDate) {
            return -1;
        }
        daysLeft = (new Date(task.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    }
    return Math.floor(daysLeft);
}