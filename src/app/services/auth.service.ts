import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { BackendService } from './backend.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private backendService: BackendService) {
        this.checkAuthStatus();
    }

    private checkAuthStatus(): void {
        if (this.backendService.isAuthenticated()) {
            const loggedUser = this.backendService.getCurrentUser();
            if (loggedUser) {
                this.currentUserSubject.next(loggedUser);
            } else {
                this.logout();
            }
                
            // this.backendService.getCurrentUser().subscribe({
            //     next: (user) => this.currentUserSubject.next(user),
            //     error: () => this.logout()
            // });
        }
    }

    login(loggedUser: User): void {
        this.currentUserSubject.next(loggedUser);
    }

    logout(): void {
        console.log('Logging out user in authService:');
        this.currentUserSubject.next(null);
        this.backendService.logout();
    }

    getCurrentUser(): User | null {
        this.backendService.getCurrentUser();
        console.log('AuthService getCurrentUser:', this.backendService.getCurrentUser());
        
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        console.log('AuthService isAuthenticated check:', this.backendService.isAuthenticated(), this.currentUserSubject.value);
        
        return this.backendService.isAuthenticated() && !!this.currentUserSubject.value;
    }

    hasRole(role: UserRole): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    hasAnyRole(roles: UserRole[]): boolean {
        const user = this.getCurrentUser();
        return user ? roles.includes(user.role) : false;
    }

    isAdmin(): boolean {
        return this.hasRole(UserRole.ADMIN);
    }

    isManager(): boolean {
        return this.hasRole(UserRole.MANAGER);
    }

    isEmployee(): boolean {
        return this.hasRole(UserRole.EMPLOYEE);
    }

    isManagerOrAdmin(): boolean {
        return this.hasAnyRole([UserRole.MANAGER, UserRole.ADMIN]);
    }

    refreshUser(): void {
        const user = this.backendService.getCurrentUser();
        this.currentUserSubject.next(user);
    }
}
