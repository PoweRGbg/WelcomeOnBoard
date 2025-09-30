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
                console.log('Access denied - Users must have one of the following roles to access this page:', requiredRoles);
                console.log('Current user role:', user);
                
                // router.navigate(['/dashboard']);
            }

            return false;
    });
    return true;
};

