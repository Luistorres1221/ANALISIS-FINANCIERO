import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]]
    });
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        if (response.token) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = response.mensaje || 'Error en el registro';
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
  
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
