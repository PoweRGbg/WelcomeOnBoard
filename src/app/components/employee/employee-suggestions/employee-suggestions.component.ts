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
import { AuthService } from '../../../services/auth.service';
import { Task, TaskSuggestion } from '../../../models/task.model';
import { Action } from '../../../models/action.model';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';

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
    templateUrl: './employee-suggestions.component.html',
    styleUrl: './employee-suggestions.component.scss'
})
export class EmployeeSuggestionsComponent implements OnInit {
    protected suggestionForm: FormGroup;
    protected mySuggestions: TaskSuggestion[] = [];
    protected departments: string[] = ['All departments'];
    protected currentUserId: string | null = null;
    protected editedTaskSuggestionId: string | undefined;

    constructor(
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
        private fb: FormBuilder,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {
        this.suggestionForm = this.createForm();
    }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(currentUser => {
            this.currentUserId = currentUser?._id || null;
            if (currentUser?.department) this.departments.push(currentUser.department);
        });
        this.backendService.getDepartments().subscribe(departments => {
            this.departments = departments;
        });
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

    addAction(action?: Action): void {
        const actionForm = this.fb.group({
            name: [action?.name || '', [Validators.required, Validators.minLength(3)]],
            description: [action?.description || ''],
            imageUrl: [action?.imageUrl || ''],
            url: [action?.url || ''],
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
                url: action.url,
            }));
            
            const suggestion = {
                name: formValue.taskName,
                description: formValue.description,
                department: formValue.department,
                url: formValue.url,
                actions: actions,
                status: undefined,
                suggestedBy: this.currentUserId
            };

            if (this.editedTaskSuggestionId) {
                this.backendService.updateTaskSuggestion(this.editedTaskSuggestionId, suggestion).subscribe(() => {
                    this.snackBar.open('Task suggestion edit submitted successfully!', 'Close', { duration: 3000 });
                    this.suggestionForm.reset();
                    this.actionsArray.clear();
                    this.loadMySuggestions();
                });
            } else {
                this.backendService.createTaskSuggestion(suggestion).subscribe(() => {
                    this.snackBar.open('Task suggestion submitted successfully!', 'Close', { duration: 3000 });
                    this.suggestionForm.reset();
                    this.actionsArray.clear();
                    this.loadMySuggestions();
                });
            }
        } else {
            this.snackBar.open('Please fill in all required fields and add at least one action', 'Close', { duration: 3000 });
        }
    }

    loadMySuggestions(): void {
        if (!this.currentUserId) return;

        this.backendService.getTaskSuggestions().subscribe(suggestions => {
            const allSuggestions = suggestions;
            this.mySuggestions = allSuggestions.filter(s => s.suggestedBy === this.currentUserId);
        })
    };

    protected deleteSugestion(suggestion: TaskSuggestion): void {
        this.backendService.deleteTaskSuggestion(suggestion.id!).subscribe(() => {
            this.snackBar.open('Suggestion deleted successfully!', 'Close', { duration: 3000 });
            this.loadMySuggestions();
        });
    }

    protected loadSuggestionDataInForm(suggestion: TaskSuggestion) {
        console.log('Loading suggestion data in form', suggestion);
        this.editedTaskSuggestionId = suggestion.id;
        
        this.suggestionForm.patchValue({
            taskName: suggestion.name,
            description: suggestion.description,
            department: suggestion.department,
            url: suggestion.url,
        });

        // Clear filled actions
        const actionsArray = this.suggestionForm.get('actions') as FormArray;
        actionsArray.clear();

        // Add existing actions
        if (suggestion.actions?.length) {
            suggestion.actions.forEach(action => this.addAction(action));
        }
    }

    getStatusColor(status?: string): string {
        switch (status) {
            case 'approved': return 'primary';
            case 'rejected': return 'warn';
            default: return 'basic';
        }
    }

    getStatusText(status?: string): string {
        console.log('status', status);
        
        switch (status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return 'Pending Review';
        }
    }
}