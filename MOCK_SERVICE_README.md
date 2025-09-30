# Backend Mock Service

This project includes a comprehensive mock backend service for local testing when no API is available.

## Features

The mock service provides realistic test data and simulates all the functionality of the real backend service:

### Authentication
- **Login**: Use any of the predefined test users (see Test Data section)
- **Logout**: Clears authentication tokens
- **Token Refresh**: Simulates token refresh functionality
- **Current User**: Returns user information from JWT token

### User Management
- **Get Users**: Paginated user listing with search functionality
- **Get User by ID**: Retrieve specific user details
- **Create User**: Add new users to the mock database
- **Update User**: Modify existing user information
- **Delete User**: Remove users from the mock database

### Task Management
- **Get Tasks**: Paginated task listing with category and search filters
- **Get Task by ID**: Retrieve specific task details
- **Create Task**: Add new tasks with actions
- **Update Task**: Modify existing task information
- **Delete Task**: Remove tasks from the mock database

### Action Management
- **Get Actions by Task**: Retrieve all actions for a specific task
- **Create Action**: Add new actions to tasks
- **Update Action**: Modify existing action information
- **Delete Action**: Remove actions from tasks
- **Complete Action**: Mark actions as completed

### Task Progress
- **Get Task Progress**: Retrieve user's task completion progress
- **Update Task Progress**: Modify task progress
- **Start Task**: Begin working on a task
- **Complete Task**: Mark entire task as completed

### Task Suggestions
- **Get Task Suggestions**: Paginated suggestions with status filtering
- **Create Task Suggestion**: Submit new task suggestions
- **Update Task Suggestion**: Modify suggestion status (approve/reject)
- **Delete Task Suggestion**: Remove suggestions

## Test Data

The mock service comes pre-loaded with realistic test data:

### Test Users
- **admin** / admin123 (Admin role)
- **manager1** / manager123 (Manager role)
- **employee1** / employee123 (Employee role)
- **employee2** / employee123 (Employee role)

### Sample Tasks
1. **Complete Employee Onboarding** (Onboarding category)
   - Read Company Handbook
   - Complete IT Setup
   - Attend Welcome Meeting

2. **Security Training** (Training category)
   - Watch Security Video
   - Take Security Quiz

3. **Equipment Setup** (Equipment category)
   - Collect Equipment
   - Configure Software

### Sample Task Suggestions
- Team Building Workshop (pending)
- Mentorship Program (approved)

## Configuration

### Environment Setup

The service automatically switches between real and mock backends based on environment configuration:

**For Local Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  useMockBackend: true, // Uses mock service
  apiUrl: 'http://localhost:3000'
};
```

**For Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  useMockBackend: false, // Uses real API
  apiUrl: 'https://your-production-api.com'
};
```

### Using the Service

The mock service implements the same interface as the real backend service, so no code changes are needed when switching between them.

```typescript
// Inject the service using the factory
constructor(@Inject(BACKEND_SERVICE) private backendService: IBackendService) {}

// Use exactly the same way as the real service
login(credentials: LoginRequest): Observable<LoginResponse> {
  return this.backendService.login(credentials);
}
```

## Network Simulation

The mock service includes realistic network delays (200-700ms) to simulate real API behavior, making it perfect for testing loading states and user experience.

## Data Persistence

Mock data is stored in memory and persists during the application session. Data is reset when the application is reloaded, ensuring consistent test conditions.

## File Upload Mock

The file upload functionality returns mock URLs for testing purposes:
```
https://mock-storage.com/files/{taskId}/{actionId}/{filename}
```

## Switching Between Services

To switch between mock and real services:

1. **Use Mock Service**: Set `useMockBackend: true` in environment.ts
2. **Use Real API**: Set `useMockBackend: false` in environment.ts
3. **Build for Production**: The production build automatically uses the real API

## Benefits

- **No API Required**: Test the application without setting up a backend
- **Consistent Data**: Predictable test data for reliable testing
- **Realistic Behavior**: Simulates network delays and API responses
- **Easy Switching**: Toggle between mock and real services with a single flag
- **Complete Coverage**: All backend functionality is mocked
