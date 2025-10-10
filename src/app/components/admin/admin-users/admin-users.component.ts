import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { User, UserRole } from '../../../models/user.model';
import { UserDialogComponent } from '../../shared/user-dialog/user-dialog.component';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatDialogModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatChipsModule
    ],
    templateUrl: './admin-users.component.html',
    styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
    users: User[] = [];
    displayedColumns: string[] = ['username', 'email', 'role', 'firstName', 'lastName', 'isActive', 'actions'];
    isLoading = false;
    currentUser: User | null = null;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.currentUser = this.backendService.getCurrentUser();
        this.loadUsers();
    }

    loadUsers(): void {
        this.isLoading = true;
        this.backendService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(`Error loading users: ${error.message}`, 'Close', { duration: 5000 });
            }
        });
    }

    createUser(): void {
        if (!this.currentUser) {
            this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(UserDialogComponent, {
            width: '90vw',
            maxWidth: '600px',
            data: { currentUser: this.currentUser }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadUsers();
            }
        });
    }

    editUser(user: User): void {
        if (!this.currentUser) {
            this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
            return;
        }

        console.log('Editing user:', user);
        
        const dialogRef = this.dialog.open(UserDialogComponent, {
            width: '90vw',
            maxWidth: '600px',
            data: { user: user, currentUser: this.currentUser }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadUsers();
            }
        });
    }

    deleteUser(user: User): void {
        if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
            this.isLoading = true;
            this.backendService.deleteUser(user.id).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.snackBar.open('User deleted successfully!', 'Close', { duration: 3000 });
                    this.loadUsers();
                },
                error: (error) => {
                    this.isLoading = false;
                    this.snackBar.open(`Error deleting user: ${error.message}`, 'Close', { duration: 5000 });
                }
            });
        }
    }

    toggleUserStatus(user: User): void {
        const updatedUser = { ...user, isActive: !user.isActive };
        this.isLoading = true;

        this.backendService.updateUser(user.id, updatedUser).subscribe({
            next: () => {
                this.isLoading = false;
                this.snackBar.open(
                    `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully!`,
                    'Close',
                    { duration: 3000 }
                );
                this.loadUsers();
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(`Error updating user: ${error.message}`, 'Close', { duration: 5000 });
            }
        });
    }

    getRoleColor(role: UserRole): string {
        switch (role) {
            case UserRole.ADMIN:
                return 'warn';
            case UserRole.MANAGER:
                return 'accent';
            case UserRole.EMPLOYEE:
                return 'primary';
            default:
                return 'primary';
        }
    }
}
