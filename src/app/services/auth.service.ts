import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUser = signal<User | null>(null);
    private isAuthenticated = signal<boolean>(false);


    constructor() {
        // Check for stored user data on service initialization
        console.log('AuthService initialized');


        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser.set(JSON.parse(storedUser));
            this.isAuthenticated.set(true);
        }
    }

    login(user: User): void {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    logout(): void {
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        localStorage.removeItem('currentUser');
    }

    getCurrentUser(): User | null {
        return this.currentUser();
    }

    isLoggedIn(): boolean {
        console.log('AuthService isLoggedIn check!!!!');

        return this.isAuthenticated();
    }

    hasRole(role: UserRole): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    hasAnyRole(roles: UserRole[]): boolean {
        const user = this.getCurrentUser();
        return user ? roles.includes(user.role) : false;
    }
}
