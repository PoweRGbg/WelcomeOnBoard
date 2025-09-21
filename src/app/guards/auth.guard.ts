import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    console.log('AuthGuard check - isLoggedIn:', authService.isLoggedIn());

    if (authService.isLoggedIn()) {
        return true;
    } else {
        router.navigate(['/login']);
        return false;
    }
};
