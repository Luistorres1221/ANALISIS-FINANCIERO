import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppStatusService } from '../../core/services/app-status.service';
import { GlobalErrorService } from '../../core/services/global-error.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  protected readonly status = inject(AppStatusService);
  protected readonly globalError = inject(GlobalErrorService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly runBusy = signal(false);

  ngOnInit(): void {
    this.status.loadSymbolsOnly();
    this.status.startPolling(this.destroyRef);
  }

  protected runEtl(): void {
    if (this.runBusy()) return;
    this.runBusy.set(true);
    this.status.runEtlFromUi().subscribe({
      complete: () => this.runBusy.set(false),
      error: () => this.runBusy.set(false),
    });
  }

  protected refresh(): void {
    this.globalError.clear();
    this.status.forceRefreshFromServer();
  }

  protected dismissError(): void {
    this.globalError.clear();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected getCurrentUser() {
    return this.authService.getCurrentUser();
  }
}
