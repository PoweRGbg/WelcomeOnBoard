import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';
import { BACKEND_SERVICE } from '../../services/backend-service.factory';
import { BackendService } from '../../services/backend.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
        MatSelectModule,
        TranslateModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    userRoles = Object.values(UserRole);

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: BackendService,
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private translate: TranslateService
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            if (!!user) {
                this.router.navigate(['/dashboard']);
            }
        });
     }

    onSubmit(): void {
        if (this.loginForm.valid) {
            const loiginRequest = {
                username: this.loginForm.value.username,
                password: this.loginForm.value.password,
            }
            this.backendService.login(loiginRequest).subscribe({
                next: () => {
                    this.backendService.login(loiginRequest).subscribe((user) => {
                        this.authService.login(user.user);
                        this.router.navigate(['/dashboard']);
                    });
                },
                error: (err: Error) => {
                    alert(this.translate.instant('LOGIN.FAILED') + ': ' + err.message);
                }
            });
        }
    }
}
