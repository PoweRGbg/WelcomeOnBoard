import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TaskSuggestion } from '../../../../models/task.model';

@Component({
    selector: 'app-suggestion-review-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatSnackBarModule
    ],
    templateUrl: './suggestion-review-dialog.component.html',
    styleUrl: './suggestion-review-dialog.component.scss'
})
export class SuggestionReviewDialogComponent {
    suggestion: TaskSuggestion;
    currentUserId: string | null;

    constructor(
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<SuggestionReviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { suggestion: TaskSuggestion; currentUserId: string | null }
    ) {
        this.suggestion = data.suggestion;
        this.currentUserId = data.currentUserId;
    }

    onClose(): void {
        this.dialogRef.close(false);
    }
}

