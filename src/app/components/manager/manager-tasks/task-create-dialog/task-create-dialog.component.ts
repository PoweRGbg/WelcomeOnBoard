import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../services/data.service';
import { Task, TaskCreateRequest } from '../../../../models/task.model';
import { Action } from '../../../../models/action.model';
import { UserInfo } from '../../../../models/user.model';

@Component({
    selector: 'app-task-create-dialog',
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
        MatChipsModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './task-create-dialog.component.html',
    styleUrl: './task-create-dialog.component.scss'
})
export class TaskCreateDialogComponent implements OnInit {
    taskForm: FormGroup;
    isEditMode = false;
    categories = ['HR', 'IT', 'Finance', 'Operations', 'Training', 'Compliance', 'Other'];

    constructor(
        private fb: FormBuilder,
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<TaskCreateDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task?: Task; currentUser: UserInfo }
    ) {
        this.taskForm = this.createForm();
        this.isEditMode = !!data.task;
    }

    ngOnInit(): void {
        if (this.isEditMode && this.data.task) {
            this.populateForm(this.data.task);
        }
    }

    private createForm(): FormGroup {
        return this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            category: ['', Validators.required],
            url: [''],
            action: this.fb.array([])
        });
    }

    private populateForm(task: Task): void {
        this.taskForm.patchValue({
            name: task.name,
            description: task.description,
            category: task.category,
            url: task.url
        });

        // Clear existing actions
        const actionsArray = this.taskForm.get('actions') as FormArray;
        actionsArray.clear();

        // Add existing actions
        if (task.actions?.length) {
            task.actions.forEach(action => {
                this.addAction(action);
            });
        }
    }

    get actionsArray(): FormArray {
        return this.taskForm.get('actions') as FormArray;
    }

    addAction(existingAction?: Action): void {
        const actionForm = this.fb.group({
            name: [existingAction?.name || '', [Validators.required, Validators.minLength(3)]],
            description: [existingAction?.description || ''],
            imageUrl: [existingAction?.imageUrl || ''],
            url: [existingAction?.url || ''],
            order: [this.actionsArray.length + 1]
        });

        this.actionsArray.push(actionForm);
    }

    removeAction(index: number): void {
        this.actionsArray.removeAt(index);
        // Update order numbers
        this.updateActionOrders();
    }

    moveActionUp(index: number): void {
        if (index > 0) {
            const actions = this.actionsArray.controls;
            const action = actions[index];
            actions.splice(index, 1);
            actions.splice(index - 1, 0, action);
            this.updateActionOrders();
        }
    }

    moveActionDown(index: number): void {
        if (index < this.actionsArray.length - 1) {
            const actions = this.actionsArray.controls;
            const action = actions[index];
            actions.splice(index, 1);
            actions.splice(index + 1, 0, action);
            this.updateActionOrders();
        }
    }

    private updateActionOrders(): void {
        this.actionsArray.controls.forEach((control, index) => {
            control.patchValue({ order: index + 1 });
        });
    }

    onSubmit(): void {
        if (this.taskForm.valid) {
            const formValue = this.taskForm.value;

            const actions: Action[] = formValue.actions.map((action: any) => ({
                name: action.name,
                description: action.description,
                imageUrl: action.imageUrl,
                url: action.url,
                order: action.order
            }));

            const taskData: TaskCreateRequest = {
                name: formValue.name,
                description: formValue.description,
                category: formValue.category,
                url: formValue.url,
                actions: actions,
                createdBy: this.data.currentUser.id,
                isActive: true,
                isInProgress: false
            };

            if (this.isEditMode && this.data.task) {
                this.dataService.updateTask(this.data.task.id, taskData);
                this.snackBar.open('Task updated successfully!', 'Close', { duration: 3000 });
            } else {
                this.dataService.createTask(taskData);
                this.snackBar.open('Task created successfully!', 'Close', { duration: 3000 });
            }

            this.dialogRef.close(true);
        } else {
            this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}

