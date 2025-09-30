import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../../services/data.service';
import { User, UserRole } from '../../../models/user.model';
import { BackendMockService } from '../../../services/backend-mock.service';

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
        MatTooltipModule
    ],
    templateUrl: './admin-users.component.html',
    styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
    users: User[] = [];
    displayedColumns: string[] = ['username', 'email', 'role', 'firstName', 'lastName', 'isActive', 'actions'];

    constructor(private dataService: BackendMockService) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.dataService.getUsers().subscribe(users => {
            this.users = users;
        });
    }

    createUser(): void {
        // TODO: Implement user creation dialog
        console.log('Create user');
    }

    editUser(user: User): void {
        // TODO: Implement user editing dialog
        console.log('Edit user', user);
    }

    deleteUser(user: User): void {
        if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
            this.dataService.deleteUser(user.id);
            this.loadUsers();
        }
    }

    toggleUserStatus(user: User): void {
        this.dataService.updateUser(user.id, { isActive: !user.isActive });
        this.loadUsers();
    }
}
