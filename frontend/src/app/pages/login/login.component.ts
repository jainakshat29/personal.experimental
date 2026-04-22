import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card" data-testid="login-card">
        <div class="auth-logo">
          <div class="logo-icon">✦</div>
          <h1>Welcome back</h1>
          <p>Sign in to your TaskFlow account</p>
        </div>

        @if (error()) {
          <div class="alert-error" data-testid="login-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              class="form-input"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="you@example.com"
              data-testid="email-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              class="form-input"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              placeholder="••••••••"
              data-testid="password-input"
            />
          </div>
          <button
            class="btn btn-primary"
            type="submit"
            style="width:100%;justify-content:center;margin-top:4px"
            [disabled]="loading()"
            data-testid="login-btn"
          >
            @if (loading()) { <span class="spinner"></span> } @else { Sign in }
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register" data-testid="register-link">Create one</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.detail || 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
