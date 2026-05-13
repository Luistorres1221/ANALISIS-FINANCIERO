import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export interface UsuarioDto {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  activo: boolean;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioDto;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<UsuarioDto | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      })
    );
  }
  
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      })
    );
  }
  
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
  
  getCurrentUser(): UsuarioDto | null {
    return this.currentUserSubject.value;
  }
  
  private getUserFromStorage(): UsuarioDto | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}
