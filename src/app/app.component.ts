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
import { combineLatest, startWith } from 'rxjs';

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
        const savedLanguage = localStorage.getItem('language') || 'en';
        this.translate.use(savedLanguage);
    }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user;
            this.dashboardMenuItems = this.getRoleBasedMenuItems();
        });
    }

    getRoleBasedMenuItems(): any[] {
        if (!this.currentUser) return [];

        // 2. Return KEYS only. Do NOT use this.translate.instant() here.
        switch (this.currentUser.role) {
            case UserRole.ADMIN:
                return [
                    { label: 'ONBOARDING.MY_TASKS', icon: 'add', route: '/admin/tasks' },
                    { label: 'ONBOARDING.USERS', icon: 'people', route: '/admin/users' },
                    { label: 'ONBOARDING.TASKS', icon: 'assignment', route: '/manage/tasks' }
                ];
            case UserRole.MANAGER:
                return [
                    { label: 'ONBOARDING.MANAGE_TASKS', icon: 'assignment', route: '/manage/tasks' },
                    { label: 'ONBOARDING.SUGGESTIONS', icon: 'lightbulb', route: '/manager/suggestions' }
                ];
            default:
                return [
                    { label: 'ONBOARDING.MY_TASKS', icon: 'assignment', route: '/employee/tasks' },
                    { label: 'ONBOARDING.SUGGESTIONS', icon: 'add', route: '/employee/suggestions' }
                ];
        }
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
