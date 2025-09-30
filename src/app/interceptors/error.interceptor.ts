import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'An error occurred';

                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = `Error: ${error.error.message}`;
                } else {
                    // Server-side error
                    switch (error.status) {
                        case 400:
                            errorMessage = error.error?.message || 'Bad Request';
                            break;
                        case 401:
                            errorMessage = 'Unauthorized access';
                            break;
                        case 403:
                            errorMessage = 'Forbidden access';
                            break;
                        case 404:
                            errorMessage = 'Resource not found';
                            break;
                        case 409:
                            errorMessage = error.error?.message || 'Conflict - resource already exists';
                            break;
                        case 422:
                            errorMessage = error.error?.message || 'Validation error';
                            break;
                        case 500:
                            errorMessage = 'Internal server error';
                            break;
                        case 503:
                            errorMessage = 'Service unavailable';
                            break;
                        default:
                            errorMessage = error.error?.message || `Error Code: ${error.status}`;
                    }
                }

                console.error('HTTP Error:', errorMessage);

                // You can also show a toast notification here
                // this.notificationService.showError(errorMessage);

                return throwError(() => new Error(errorMessage));
            })
        );
    }
}


