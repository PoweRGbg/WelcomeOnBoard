import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { BackendService } from '../services/backend.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;

    constructor(private backendService: BackendService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip auth for login and refresh token endpoints
        if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
            return next.handle(req);
        }

        const token = this.backendService.getToken();

        if (token) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 && !this.isRefreshing) {
                    return this.handle401Error(req, next);
                }
                return throwError(() => error);
            })
        );
    }

    private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.isRefreshing = true;

        return this.backendService.refreshToken(this.backendService.getCurrentUser()?._id ?? '').pipe(
            switchMap((response) => {
                this.isRefreshing = false;

                // Retry the original request with new token
                const newReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${response.token}`
                    }
                });

                return next.handle(newReq);
            }),
            catchError((error) => {
                this.isRefreshing = false;
                // If refresh fails, redirect to login or clear tokens
                this.backendService.logout();
                return throwError(() => error);
            })
        );
    }
}
