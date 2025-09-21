import { Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';
import { User, UserRole } from './models/user.model';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatSidenavModule,
        MatListModule,
        MatMenuModule,
        MatTooltipModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    @ViewChild('sidenav') sidenav!: MatSidenav;
    title = 'WelcomeOnBoard';
    currentUser: User | null = null;
    isLoggedIn = false;

    constructor(private authService: AuthService) {
        this.updateAuthState();
    }

    private updateAuthState(): void {
        console.log('APP updateAuthState called');
        
        this.currentUser = this.authService.getCurrentUser();
        this.isLoggedIn = this.authService.isLoggedIn();
        console.log('Auth state updated - isLoggedIn:', this.isLoggedIn, 'currentUser:', this.currentUser);
    }

    logout(): void {
        this.authService.logout();
        this.isLoggedIn = false;
        this.currentUser = null;
    }

    getRoleBasedMenuItems(): any[] {
        console.log('APP getRoleBasedMenuItems called');

        if (!this.currentUser) return [];
        const items = [];

        switch (this.currentUser.role) {
            case UserRole.ADMIN:
                items.push(
                    { label: 'Users', icon: 'people', route: '/admin/users' },
                    { label: 'Tasks', icon: 'assignment', route: '/admin/tasks' }
                );
                break;
            case UserRole.MANAGER:
                items.push(
                    { label: 'My Tasks', icon: 'assignment', route: '/manager/tasks' },
                    { label: 'Suggestions', icon: 'lightbulb', route: '/manager/suggestions' }
                );
                break;
            case UserRole.EMPLOYEE:
                items.push(
                    { label: 'My Tasks', icon: 'assignment', route: '/employee/tasks' },
                    { label: 'Suggest Tasks', icon: 'add', route: '/employee/suggestions' }
                );
                break;
        }
        console.log('Current user:', items);
        console.log('Menu items:', items);
        
        return items;
    }
}
