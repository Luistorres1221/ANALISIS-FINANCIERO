import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { GlobalErrorService } from '../services/global-error.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errors = inject(GlobalErrorService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        errors.setMessage('Sin conexión con el servidor. ¿Está el backend en marcha?');
      } else if (err.status >= 500 && err.status !== 503) {
        errors.setMessage(err.error?.message ?? `Error del servidor (${err.status})`);
      }
      return throwError(() => err);
    }),
  );
};
