import { Injectable } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private storedUser: User | null = null;
    private currentUserSubject: BehaviorSubject<any>;
    public currentUser$: Observable<any>;

    constructor() {
        const user = localStorage.getItem('currentUser');
        this.storedUser = user ? JSON.parse(user) : null;
        this.currentUserSubject = new BehaviorSubject<any>(this.storedUser);
        this.currentUser$ = this.currentUserSubject.asObservable();
    }

    login(user: User): void {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    logout(): void {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    getCurrentUser(): User | null {
        return this.storedUser;
    }

    hasRole(role: UserRole): boolean {
        return this.storedUser?.role === role;
    }

    hasAnyRole(roles: UserRole[]): boolean {
        return this.storedUser ? roles.includes(this.storedUser.role) : false;
    }
}
