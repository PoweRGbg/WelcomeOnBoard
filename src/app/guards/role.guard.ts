import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const RoleGuard = (route: any) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRoles = route.data?.['roles'] as UserRole[];
    authService.currentUser$.subscribe(
        (user) => {
            if (!user || !requiredRoles.includes(user.role)) {
                console.log('Access denied for user', user?.username, 'needed roles:', requiredRoles);
                router.navigate(['/login']);
            }

            return false;
    });
    return true;
};





