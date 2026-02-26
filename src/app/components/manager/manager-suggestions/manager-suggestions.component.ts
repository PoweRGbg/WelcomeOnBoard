import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { RecurringTaskPeriod, SuggestionStatus, TaskSuggestion } from '../../../models/task.model';
import { TaskCreateRequest } from '../../../models/task.model';
import { UserInfo } from '../../../models/user.model';
import { SuggestionReviewDialogComponent } from './suggestion-review-dialog/suggestion-review-dialog.component';
import { BackendService } from '../../../services/backend.service';
import { map, Subscription, switchMap } from 'rxjs';

@Component({
    selector: 'app-manager-suggestions',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatTableModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDialogModule
    ],
    templateUrl: './manager-suggestions.component.html',
    styleUrl: './manager-suggestions.component.scss'
})
export class ManagerSuggestionsComponent implements OnInit {
    suggestions: TaskSuggestion[] = [];
    displayedColumns: string[] = ['taskName', 'suggestedBy', 'category', 'actions-count', 'status', 'createdAt', 'actions'];
    currentUser: UserInfo | null = null;
    private mainSubscription: Subscription | null = null;

    constructor(
        private backendService: BackendService,
        private authService: AuthService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.mainSubscription = this.authService.currentUser$.pipe(
            switchMap((currentUser) => {
                return this.backendService.getUserById(currentUser?._id || '').pipe(
                    map((user) => {
                        this.currentUser = user;
                        return user;
                    })
                );
            }),
        ).subscribe(() => {
            this.loadSuggestions();

        });
    }

    loadSuggestions(): void {
            console.log('Current user', this.currentUser);
            this.backendService.getTaskSuggestions().subscribe(suggestions => {
                suggestions ? this.suggestions = suggestions : console.log("no suggestions.data");
                if (this.currentUser?.department) {
                    this.suggestions = this.suggestions.filter(suggestion => 
                        this.currentUser!.department === suggestion.department || suggestion.department === 'All Departments'
                    );
                }
                // Now show only pending suggestions
                this.suggestions = this.suggestions.filter(s => s.status === SuggestionStatus.PENDING);
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

    reviewSuggestion(suggestion: TaskSuggestion): void {
        const dialogRef = this.dialog.open(SuggestionReviewDialogComponent, {
            width: '800px',
            data: { suggestion, currentUserId: this.currentUser?._id }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadSuggestions();
                this.snackBar.open('Suggestion reviewed successfully!', 'Close', { duration: 3000 });
            }
        });
    }

    approveSuggestion(suggestion: TaskSuggestion): void {
        const taskData: TaskCreateRequest = {
            name: suggestion.name,
            description: suggestion.description || '',
            department: suggestion.department,
            url: suggestion.url || '',
            actions: suggestion.actions || [],
            createdBy: suggestion.suggestedBy,
            isActive: true,
            recurring: suggestion.recurring || RecurringTaskPeriod.NONE,
            dueDate: suggestion.recurring !== RecurringTaskPeriod.NONE ? suggestion.dueDate : undefined
        };

        this.backendService.createTask(taskData).subscribe(createdTask => {
            console.log('Created task', createdTask.name);
            
            this.backendService.updateTaskSuggestion(suggestion.id, {
                status: SuggestionStatus.APPROVED,
                reviewedAt: new Date(),
                reviewedBy: this.currentUser?._id!
            }).subscribe((suggestion) => {
                console.log('Suggestion approved', suggestion);
                
                this.loadSuggestions();
                this.snackBar.open('Suggestion approved and task created!', 'Close', { duration: 3000 });
            });

        });
    }

    rejectSuggestion(suggestion: TaskSuggestion): void {
        this.backendService.updateTaskSuggestion(suggestion.id, {
            status: SuggestionStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedBy: this.currentUser?._id!
        }).subscribe(() => {
            this.loadSuggestions();
            this.snackBar.open('Suggestion rejected', 'Close', { duration: 3000 });
        });
    }

    getSuggestionsByStatus(status: string): TaskSuggestion[] {
        return this.suggestions.filter(s => s.status === status);
    }

    getPendingSuggestions(): TaskSuggestion[] {
        return this.getSuggestionsByStatus('pending');
    }

    getApprovedSuggestions(): TaskSuggestion[] {
        return this.getSuggestionsByStatus('approved');
    }

    getRejectedSuggestions(): TaskSuggestion[] {
        return this.getSuggestionsByStatus('rejected');
    }

    ngOnDestroy(): void {
        if (this.mainSubscription) {
            this.mainSubscription.unsubscribe();
        }
    }
}
