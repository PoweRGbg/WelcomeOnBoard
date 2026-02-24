import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { BACKEND_SERVICE } from './backend-service.factory';
import { BackendService } from './backend.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: BackendService,
    ) {
        this.checkAuthStatus();
        this.backendService.token$.subscribe((token) => {
            if (!token && this.currentUserSubject.value !== null) {
                this.logout();
            }
        });
    }

    private checkAuthStatus(): void {
        if (this.backendService.isAuthenticated()) {
            
            console.log('Getting current user in auth service');
            const loggedUser = this.backendService.getCurrentUser();
            if (loggedUser) {
                try {
                    this.currentUserSubject.next(loggedUser);
                } catch (error) {
                    console.error(error);
                    this.logout()
                }
                
            } else {
                this.logout();
            }
        }
    }

    login(loggedUser: User): void {
        this.currentUserSubject.next(loggedUser);
    }

    logout(): void {
        this.currentUserSubject.next(null);
        this.backendService.logout();
    }

    getCurrentUser(): User | null {
        try {
            this.backendService.getCurrentUser();
            if (this.currentUserSubject.value) {
                return this.currentUserSubject.value;
            } else {
                return null;
            }
        } catch {
            throw Error('Cannot get current user in AuthService');
        }
    }

    isAuthenticated(): boolean {
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
}
