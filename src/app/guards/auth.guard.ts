import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BackendService } from '../services/backend.service';

export const AuthGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const backendService = inject(BackendService);

    if (!!authService.getCurrentUser()) {
        console.log('Access granted - User is authenticated', authService.getCurrentUser());
        return true;
    } else {
        console.log('Access denied - Users must be logged in to access this page');
        
        router.navigate(['/login']);
        return false;
    }
};




