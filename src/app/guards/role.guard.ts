import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const RoleGuard = (route: any) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRoles = route.data?.['roles'] as (string | UserRole)[] | undefined;

    const user = authService.getCurrentUser();

    if (!requiredRoles || requiredRoles.length === 0) {
        // No role restriction configured -> allow
        return true;
    }

    if (!user) {
        console.log('Access denied - no user');
        router.navigate(['/login']);
        return false;
    }

    // Do a case-insensitive comparison to tolerate different casings in route data
    const allowed = requiredRoles
        .map(r => String(r).toUpperCase())
        .includes(String(user.role).toUpperCase());

    if (!allowed) {
        console.log('Access denied for user', user.username);
        router.navigate(['/login']);
        return false;
    }

    return true;
};





