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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
        MatTooltipModule,
        TranslateModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    @ViewChild('sidenav') sidenav!: MatSidenav;
    protected title = 'WelcomeOnBoard';
    protected currentUser: User | null = null;
    protected isLoggedIn = false;
    protected dashboardMenuItems: any[] = [];
    constructor(private authService: AuthService, private router: Router, private translate: TranslateService) {
        // Set default language
        this.translate.setDefaultLang('en');
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            this.translate.use(savedLanguage);
        } else {
            this.translate.use('en');
        }
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
                    { label: this.translate.instant('ONBOARDING.MY_TASKS'), icon: 'add', route: '/admin/tasks' }, 
                    { label: this.translate.instant('ONBOARDING.USERS'), icon: 'people', route: '/admin/users' },
                    { label: this.translate.instant('ONBOARDING.TASKS'), icon: 'assignment', route: '/manage/tasks' }
                );
                break;
            case UserRole.MANAGER:
                items.push(
                    { label: this.translate.instant('ONBOARDING.MANAGE_TASKS'), icon: 'assignment', route: '/manage/tasks' },
                    { label: this.translate.instant('ONBOARDING.SUGGESTIONS'), icon: 'lightbulb', route: '/manager/suggestions' }
                );
                break;
            case UserRole.EMPLOYEE:
                items.push(
                    { label: this.translate.instant('ONBOARDING.MY_TASKS'), icon: 'assignment', route: '/employee/tasks' },
                    { label: this.translate.instant('ONBOARDING.SUGGESTIONS'), icon: 'add', route: '/employee/suggestions' }
                );
                break;
        }
        
        return items;
    }

    protected switchToEnglish(): void {
        // set a cookie or local storage item to remember the preference
        localStorage.setItem('language', 'en');
        this.translate.use('en');
        this.dashboardMenuItems = this.getRoleBasedMenuItems();
    }

    protected switchToBulgarian(): void {
        localStorage.setItem('language', 'bg');
        this.translate.use('bg');
        this.dashboardMenuItems = this.getRoleBasedMenuItems();
    }

    protected logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
