import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';

@Component({
    selector: 'task-filter',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        FormsModule
    ],
    templateUrl: './task-filter.component.html',
    styleUrl: './task-filter.component.scss'
})
export class TaskFilterComponent implements OnInit {
    @Input() searchTerm: string = '';
    @Input() selectedDepartment: string = '';
    
    @Output() selectedDepartmentChange = new EventEmitter<string>();
    @Output() searchTermChange = new EventEmitter<string>();
    
    protected currentUserId: string | null = null;
    protected departments = ['All Departments'];
    private currentUserDepartment = 'All Departments';
    

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.backendService.getCurrentUser();
        this.authService.currentUser$.subscribe(currentUser => {
            this.currentUserId = currentUser?._id || null;
        });
        
        if (this.currentUserId) {
            this.backendService.getUserById(this.currentUserId).subscribe((user) => {
                this.currentUserDepartment = user.department || 'All Departments';
                this.departments.push(this.currentUserDepartment);
                this.selectedDepartment = this.currentUserDepartment;
            });
        }
    }

    onSearchChange(): void {
        this.searchTermChange.emit(this.searchTerm);
    }

    onDepartmentChange(): void {
        this.selectedDepartmentChange.emit(this.selectedDepartment);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.selectedDepartment = '';
    }
}