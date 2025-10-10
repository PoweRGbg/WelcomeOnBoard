import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User, UserRole } from '../../../models/user.model';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';

export interface UserDialogData {
    user?: User;
    currentUser: User;
}

@Component({
    selector: 'app-user-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatTooltipModule
    ],
    templateUrl: './user-dialog.component.html',
    styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
    userForm: FormGroup;
    isEditMode = false;
    isLoading = false;
    hidePassword = true;
    hideConfirmPassword = true;
    departments: string[] = []
    userRoles = [
        { value: UserRole.ADMIN, label: 'Administrator' },
        { value: UserRole.MANAGER, label: 'Manager' },
        { value: UserRole.EMPLOYEE, label: 'Employee' }
    ];

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<UserDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
    ) {
        this.userForm = this.createForm();
        this.isEditMode = !!data.user;
    }

    ngOnInit(): void {
        this.backendService.getDepartments().subscribe(
            (departments) => this.departments = departments);
            
        if (this.isEditMode && this.data.user) {
            this.populateForm(this.data.user);
        }
    }

    private createForm(): FormGroup {
        const form = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email]],
            firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            role: ['', Validators.required],
            department: ['', Validators.required],
            isActive: [true]
        }) as FormGroup;

        // Add password fields only for new users
        if (!this.isEditMode) {
            form.addControl('password', this.fb.control('', [
                Validators.required,
                Validators.minLength(6),
                Validators.maxLength(100)
            ]));
            form.addControl('confirmPassword', this.fb.control('', [
                Validators.required
            ]));
        }

        return form;
    }

    private populateForm(user: User): void {
        this.userForm.patchValue({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            isActive: user.isActive
        });
    }

    onSubmit(): void {
        if (this.userForm.valid) {
            // Check password confirmation for new users
            if (!this.isEditMode) {
                const password = this.userForm.get('password')?.value;
                const confirmPassword = this.userForm.get('confirmPassword')?.value;

                if (password !== confirmPassword) {
                    this.snackBar.open('Passwords do not match', 'Close', { duration: 3000 });
                    return;
                }
            }

            this.isLoading = true;
            const formValue = this.userForm.value;

            const userData: Partial<User> = {
                username: formValue.username,
                email: formValue.email,
                firstName: formValue.firstName,
                lastName: formValue.lastName,
                role: formValue.role,
                isActive: formValue.isActive
            };

            // Add password for new users
            if (!this.isEditMode) {
                (userData as any).password = formValue.password;
            }

            const operation = this.isEditMode && this.data.user
                ? this.backendService.updateUser(this.data.user.id, userData)
                : this.backendService.createUser(userData as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);

            operation.subscribe({
                next: (result) => {
                    this.isLoading = false;
                    this.snackBar.open(
                        `User ${this.isEditMode ? 'updated' : 'created'} successfully!`,
                        'Close',
                        { duration: 3000 }
                    );
                    this.dialogRef.close(result);
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(
                        `Error ${this.isEditMode ? 'updating' : 'creating'} user: ${error.message}`,
                        'Close',
                        { duration: 5000 }
                    );
                }
            });
        } else {
            this.markFormGroupTouched();
            this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
        }
    }

    private markFormGroupTouched(): void {
        Object.keys(this.userForm.controls).forEach(key => {
            const control = this.userForm.get(key);
            control?.markAsTouched();
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    getFieldError(fieldName: string): string {
        const field = this.userForm.get(fieldName);
        if (field?.hasError('required')) {
            return `${this.getFieldLabel(fieldName)} is required`;
        }
        if (field?.hasError('email')) {
            return 'Please enter a valid email address';
        }
        if (field?.hasError('minlength')) {
            const requiredLength = field.errors?.['minlength']?.requiredLength;
            return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
        }
        if (field?.hasError('maxlength')) {
            const requiredLength = field.errors?.['maxlength']?.requiredLength;
            return `${this.getFieldLabel(fieldName)} must not exceed ${requiredLength} characters`;
        }
        return '';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            username: 'Username',
            email: 'Email',
            firstName: 'First Name',
            lastName: 'Last Name',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            role: 'Role'
        };
        return labels[fieldName] || fieldName;
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.userForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }
}
