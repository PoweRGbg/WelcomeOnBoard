import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [CommonModule, MatCardModule],
    templateUrl: './task-detail.component.html',
    styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent { }
