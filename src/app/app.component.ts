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
import { Router } from '@angular/router';

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
    protected dashboardMenuItems: any[] = [];
    constructor(private authService: AuthService, private router: Router) {
    }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user; // Check if user object exists to set the login status
            this.dashboardMenuItems = this.getRoleBasedMenuItems();
        });
    }

    getRoleBasedMenuItems(): any[] {
        if (!this.currentUser) {
            return [];
        }
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
        console.log('Current user:', this.currentUser.firstName, this.currentUser.lastName);
        console.log('Menu items:', items);
        
        return items;
    }

    protected logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
