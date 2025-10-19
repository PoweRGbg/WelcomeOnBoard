import { User } from "../models/user.model";
import { RecurringTaskPeriod, Task, TaskProgress } from "../models/task.model";
import { last } from "rxjs";

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

export function hoursLeft(task: Task): number {
    if (!task.dueDate && task.recurring !== RecurringTaskPeriod.DAILY) {
        return -1;
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const hoursLeft = Math.floor((today.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    return hoursLeft;
}

export function daysLeft(task: Task): number {
    if (!task.dueDate && !task.recurring) {
        return -1;
    }
    let daysLeft = 0;
    const today = new Date();
    if (task.recurring === RecurringTaskPeriod.MONTHLY) {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        task.dueDate = lastDayOfMonth;
        daysLeft = (lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    } else if (task.recurring === RecurringTaskPeriod.YEARLY) {
        const lastDayOfYear = new Date(today.getFullYear() + 1, 0, 0);
        task.dueDate = lastDayOfYear;
        daysLeft = (lastDayOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    } else if (task.recurring === RecurringTaskPeriod.WEEKLY) {
        const lastDayOfWeek = getLastDayOfTheWeek(today);
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

export function isFinishedOnTime(task: Task, taskProgress?: TaskProgress): boolean {
    if ((!task.dueDate && !task.recurring) ||
        !taskProgress ||
        !taskProgress.isCompleted ||
        !taskProgress.updatedAt ||
        task.recurring === RecurringTaskPeriod.NONE) {
        
        return false;
    }
    
    const today = new Date();
    const lastCompleted = Math.floor((taskProgress.updatedAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    switch (task.recurring) {
        case RecurringTaskPeriod.DAILY:
            task.dueDate = today;
            const hoursLeft = 24 / today.getHours();
            return hoursLeft  < 24;
        case RecurringTaskPeriod.WEEKLY:
            return daysLeft(task) + (lastCompleted - 7) < 7;
        case RecurringTaskPeriod.MONTHLY:
            return daysLeft(task) + (lastCompleted - 30) < 30;
        case RecurringTaskPeriod.YEARLY:
            return daysLeft(task) + (lastCompleted - 365) > 365;

        default:
            return daysLeft(task) > 0;
    }
}

export function taskIsExpiringSoon(task: Task): boolean {
    const taskDaysLeft = daysLeft(task);
    let tolerance = 0;
    switch (task.recurring) {
        case RecurringTaskPeriod.YEARLY:
            tolerance = 31; // One month should be enough
            break;
        case RecurringTaskPeriod.MONTHLY || RecurringTaskPeriod.CUSTOM:
            tolerance = 7; // One week
            break;
        case RecurringTaskPeriod.WEEKLY:
            tolerance = 4; // 2 days + weekend
            break;
        default:
            tolerance = 0; 
            break;
    }

    return taskDaysLeft < tolerance;
}
    
export function filterTasks(tasks: Task[], searchTerm: string, selectedDepartment: string): Task[] {
    if (selectedDepartment !== 'All Departments' && selectedDepartment.length !== 0) {
        
        tasks = tasks.filter((task) => task.department === selectedDepartment);
    }
    
    if (searchTerm.length !== 0) {
        tasks = tasks.filter((task) => task.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return tasks;
}

function getLastDayOfTheWeek(date: Date = new Date()): Date {
    const lastDay = new Date(date);
    lastDay.setDate(date.getDate());
    lastDay.setHours(23, 59, 59, 999);

    return lastDay;
}
