import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (!!authService.getCurrentUser()) {
        return true;
    } else {
        console.log('Access denied - Users must be logged in to access this page');
        router.navigate(['/login']);
        return false;
    }
};





