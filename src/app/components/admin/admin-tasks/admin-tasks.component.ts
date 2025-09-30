import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../../services/data.service';
import { Task } from '../../../models/task.model';

@Component({
    selector: 'app-admin-tasks',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule
    ],
    templateUrl: './admin-tasks.component.html',
    styleUrl: './admin-tasks.component.scss'
})
export class AdminTasksComponent implements OnInit {
    tasks: Task[] = [];

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.loadTasks();
    }

    loadTasks(): void {
        this.dataService.getTasks().subscribe(tasks => {
            this.tasks = tasks;
        });
    }

    createTask(): void {
        console.log('Create task clicked');
    }

    editTask(task: Task): void {
        console.log('Edit task', task);
    }

    deleteTask(task: Task): void {
        if (confirm(`Are you sure you want to delete task "${task.name}"?`)) {
            this.dataService.deleteTask(task.id);
            this.loadTasks();
        }
    }
}



