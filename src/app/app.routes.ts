import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminTasksComponent } from './components/admin/admin-tasks/admin-tasks.component';
import { ManagerTasksComponent } from './components/manager/manager-tasks/manager-tasks.component';
import { ManagerSuggestionsComponent } from './components/manager/manager-suggestions/manager-suggestions.component';
import { EmployeeTasksComponent } from './components/employee/employee-tasks/employee-tasks.component';
import { EmployeeSuggestionsComponent } from './components/employee/employee-suggestions/employee-suggestions.component';
import { TaskDetailComponent } from './components/shared/task-detail/task-detail.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'admin/tasks',
        component: AdminTasksComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'manager/tasks',
        component: ManagerTasksComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['manager', 'admin'] }
    },
    {
        path: 'manager/suggestions',
        component: ManagerSuggestionsComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['manager', 'admin'] }
    },
    {
        path: 'employee/tasks',
        component: EmployeeTasksComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['employee', 'manager', 'admin'] }
    },
    {
        path: 'employee/suggestions',
        component: EmployeeSuggestionsComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['employee', 'manager', 'admin'] }
    },
    {
        path: 'task/:id',
        component: TaskDetailComponent,
        canActivate: [AuthGuard]
    },
    { path: '**', redirectTo: '/login' }
];