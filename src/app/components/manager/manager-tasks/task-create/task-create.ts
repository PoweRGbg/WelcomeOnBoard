import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../services/auth.service';
import { TaskSuggestion } from '../../../../models/task.model';
import { Action } from '../../../../models/action.model';
import { BACKEND_SERVICE, IBackendService } from '../../../../services/backend-service.factory';

@Component({
    selector: 'app-employee-suggestions',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatSnackBarModule
    ],
    templateUrl: './task-create.html',
    styleUrl: './task-create.scss'
})
export class EmployeeSuggestionsComponent implements OnInit {
    suggestionForm: FormGroup;
    mySuggestions: TaskSuggestion[] = [];
    categories = ['HR', 'IT', 'Finance', 'Operations', 'Training', 'Compliance', 'Other'];
    currentUserId: string | null = null;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private fb: FormBuilder,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {
        this.suggestionForm = this.createForm();
    }

    ngOnInit(): void {
        this.currentUserId = this.authService.getCurrentUser()?._id || null;
        this.loadMySuggestions();
    }

    private createForm(): FormGroup {
        return this.fb.group({
            taskName: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            department: ['', Validators.required],
            url: [''],
            actions: this.fb.array([])
        });
    }

    get actionsArray(): FormArray {
        return this.suggestionForm.get('actions') as FormArray;
    }

    addAction(): void {
        const actionForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            imageUrl: [''],
            url: [''],
            order: [this.actionsArray.length + 1]
        });

        this.actionsArray.push(actionForm);
    }

    removeAction(index: number): void {
        this.actionsArray.removeAt(index);
        this.updateActionOrders();
    }

    private updateActionOrders(): void {
        this.actionsArray.controls.forEach((control, index) => {
            control.patchValue({ order: index + 1 });
        });
    }

    onSubmit(): void {
        if (this.suggestionForm.valid && this.actionsArray.length > 0) {
            const formValue = this.suggestionForm.value;

            const actions: Action[] = formValue.actions.map((action: any) => ({
                name: action.name,
                description: action.description,
                imageUrl: action.imageUrl,
                url: action.url,
                order: action.order
            }));

            const suggestion: Omit<TaskSuggestion, 'id' | 'createdAt'> = {
                suggestedBy: this.currentUserId!,
                taskName: formValue.taskName,
                description: formValue.description,
                department: formValue.department,
                url: formValue.url,
                actions: actions,
                status: 'pending'
            };

            this.backendService.createTaskSuggestion(suggestion);
            this.snackBar.open('Task suggestion submitted successfully!', 'Close', { duration: 3000 });
            this.suggestionForm.reset();
            this.actionsArray.clear();
            this.loadMySuggestions();
        } else {
            this.snackBar.open('Please fill in all required fields and add at least one action', 'Close', { duration: 3000 });
        }
    }

    loadMySuggestions(): void {
        if (!this.currentUserId) return;

        this.backendService.getTaskSuggestions().subscribe((allSuggestions) =>{
            this.mySuggestions = allSuggestions.data.filter(s => s.suggestedBy === this.currentUserId);
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'approved': return 'primary';
            case 'rejected': return 'warn';
            default: return 'basic';
        }
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return 'Pending Review';
        }
    }
}