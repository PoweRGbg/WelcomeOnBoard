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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RecurringTaskPeriod, Task, TaskCreateRequest } from '../../../models/task.model';
import { Action } from '../../../models/action.model';
import { UserInfo } from '../../../models/user.model';
import { BACKEND_SERVICE, IBackendService } from '../../../services/backend-service.factory';
import { convertAuDateToDate } from '../../../common/utils';

export interface TaskDialogData {
    task?: Task;
    currentUser: UserInfo;
    allowStatusToggle?: boolean;
    department?: string;
}

@Component({
    selector: 'app-task-dialog',
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
        MatSnackBarModule,
        MatCheckboxModule
    ],
    templateUrl: './task-dialog.component.html',
    styleUrl: './task-dialog.component.scss'
})
export class TaskDialogComponent implements OnInit {
    taskForm: FormGroup;
    isEditMode = false;
    isLoading = false;
    protected departments: string[] = [];
    protected recurringPeriods: RecurringTaskPeriod[];

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<TaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: TaskDialogData,
        @Inject(BACKEND_SERVICE) private backendService: IBackendService,
    ) {
        this.taskForm = this.createForm();
        console.log('userDepartment in taskDialog:', this.data.currentUser.department);
        if (this.data.currentUser.department) {
            this.departments = [this.data.currentUser.department, 'All Departments'];
            this.taskForm.patchValue({
                department: this.data.currentUser.department
            });
        }
        console.log('Departments in taskDialog:', this.departments);
            
        this.recurringPeriods = [
            RecurringTaskPeriod.NONE,
            RecurringTaskPeriod.DAILY,
            RecurringTaskPeriod.WEEKLY,
            RecurringTaskPeriod.MONTHLY,
            RecurringTaskPeriod.YEARLY,
            RecurringTaskPeriod.CUSTOM
        ];
        this.isEditMode = !!data.task;
    }

    public ngOnInit(): void {
        if (this.isEditMode && this.data.task) {
            this.populateForm(this.data.task);
        }
    }

    get actionsArray(): FormArray {
        return this.taskForm.get('actions') as FormArray;
    }

    protected addAction(existingAction?: Action): void {
        const actionForm = this.fb.group({
            name: [existingAction?.name || '', [Validators.required, Validators.minLength(3)]],
            description: [existingAction?.description || ''],
            imageUrl: [existingAction?.imageUrl || ''],
            url: [existingAction?.url || ''],
        });
        
        this.actionsArray.push(actionForm);
    }

    protected removeAction(index: number): void {
        this.actionsArray.removeAt(index);
        this.updateActionOrders();
    }

    protected moveActionUp(index: number): void {
        if (index > 0) {
            const actions = this.actionsArray.controls;
            const action = actions[index];
            actions.splice(index, 1);
            actions.splice(index - 1, 0, action);
            this.updateActionOrders();
        }
    }

    protected moveActionDown(index: number): void {
        if (index < this.actionsArray.length - 1) {
            const actions = this.actionsArray.controls;
            const action = actions[index];
            actions.splice(index, 1);
            actions.splice(index + 1, 0, action);
            this.updateActionOrders();
        }
    }

    protected onSubmit(): void {
        if (this.taskForm.valid) {
            this.isLoading = true;
            const formValue = this.taskForm.value;

            const actions: Action[] = formValue.actions.map((action: any) => ({
                name: action.name,
                description: action.description,
                imageUrl: action.imageUrl,
                url: action.url,
                order: action.order
            }));
            
            const dueDate = formValue.dueDate ? convertAuDateToDate(formValue.dueDate) : undefined;
            console.log('Createing task', this.data.currentUser);
            
            const taskData: TaskCreateRequest = {
                name: formValue.name,
                description: formValue.description,
                department: formValue.department,
                url: formValue.url,
                actions: actions,
                createdBy: this.data.currentUser._id,
                isActive: this.data.allowStatusToggle ? formValue.isActive : true,
                recurring: formValue.recurringTaskPeriod,
                dueDate: dueDate ?? undefined,
            };

            console.log('Task data on submit:', taskData);
            

            const operation = this.isEditMode && this.data.task
                ? this.backendService.updateTask(this.data.task.id, taskData)
                : this.backendService.createTask(taskData);

            operation.subscribe({
                next: (result: Task) => {
                    this.isLoading = false;
                    this.snackBar.open(
                        `Task ${this.isEditMode ? 'updated' : 'created'} successfully!`,
                        'Close',
                        { duration: 3000 }
                    );
                    this.dialogRef.close(result);
                },
                error: (error: Error) => {
                    this.isLoading = false;
                    this.snackBar.open(
                        `Error ${this.isEditMode ? 'updating' : 'creating'} task: ${error.message}`,
                        'Close',
                        { duration: 5000 }
                    );
                }
            });
        } else {
            this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
        }
    }

    protected onCancel(): void {
        this.dialogRef.close(false);
    }

    protected isCustomRecurringTask(): boolean {
        return this.taskForm.get('recurringTaskPeriod')?.value === RecurringTaskPeriod.CUSTOM;
    }

    private populateForm(task: Task): void {
        this.taskForm.patchValue({
            name: task.name,
            description: task.description,
            department: task.department,
            url: task.url,
            recurringPeriod: task.recurring,
            dueDate: task.dueDate,
        });

        // Add status controls if allowed
        if (this.data.allowStatusToggle) {
            this.taskForm.patchValue({
                isActive: task.isActive,
            });
        }

        // Clear filled actions
        const actionsArray = this.taskForm.get('actions') as FormArray;
        actionsArray.clear();

        // Add existing actions
        if (task.actions?.length) {
            task.actions.forEach(action => this.addAction(action));
        }
    }

    private updateActionOrders(): void {
        this.actionsArray.controls.forEach((control, index) => {
            control.patchValue({ order: index + 1 });
        });
    }

    private createForm(): FormGroup {
        const form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            department: ['', Validators.required],
            url: [''],
            actions: this.fb.array([]),
            recurringTaskPeriod: [RecurringTaskPeriod.NONE],
            dueDate: [''],
        }) as FormGroup;

        // Add status controls only if allowed
        if (this.data.allowStatusToggle) {
            form.addControl('isActive', this.fb.control(true));
        }

        return form;
    }
}
