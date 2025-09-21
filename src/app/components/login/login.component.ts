import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { UserRole } from '../../models/user.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    userRoles = Object.values(UserRole);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private dataService: DataService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            role: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            const { username, role } = this.loginForm.value;

            // Find user by username and role
            const users = this.dataService.getUsers();
            const user = users.find(u => u.username === username && u.role === role);

            if (user) {
                this.authService.login(user);
                this.router.navigate(['/dashboard']);
            } else {
                alert('Invalid username or role');
            }
        }
    }
}
