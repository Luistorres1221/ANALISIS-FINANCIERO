import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.token) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = response.mensaje || 'Error en el inicio de sesión';
        }
      },
      error: (err) => {
        this.error = 'Error en la conexión con el servidor';
        console.error(err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
