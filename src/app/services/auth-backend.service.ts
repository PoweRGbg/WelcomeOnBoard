import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { BackendService, LoginRequest, LoginResponse } from './backend.service';

@Injectable({
    providedIn: 'root'
})
export class AuthBackendService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private backendService: BackendService) {
        // Check if user is already logged in
        this.checkAuthStatus();
    }

    private checkAuthStatus(): void {
        if (this.backendService.isAuthenticated()) {
            this.backendService.getCurrentUser().subscribe({
                next: (user) => this.currentUserSubject.next(user),
                error: () => this.logout()
            });
        }
    }

    login(credentials: LoginRequest): Observable<User> {
        return this.backendService.login(credentials).pipe(
            tap((response: LoginResponse) => {
                this.currentUserSubject.next(response.user);
            }),
            map((response: LoginResponse) => response.user),
            catchError((error) => {
                console.error('Login failed:', error);
                return throwError(() => error);
            })
        );
    }

    logout(): Observable<any> {
        return this.backendService.logout().pipe(
            tap(() => {
                this.currentUserSubject.next(null);
            }),
            catchError((error) => {
                // Even if logout fails on server, clear local state
                this.currentUserSubject.next(null);
                return throwError(() => error);
            })
        );
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
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

    refreshUser(): Observable<User> {
        return this.backendService.getCurrentUser().pipe(
            tap((user) => this.currentUserSubject.next(user)),
            catchError((error) => {
                this.logout();
                return throwError(() => error);
            })
        );
    }
}
