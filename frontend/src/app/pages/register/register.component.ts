import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card" data-testid="register-card">
        <div class="auth-logo">
          <div class="logo-icon">✦</div>
          <h1>Create account</h1>
          <p>Start organizing your work with TaskFlow</p>
        </div>

        @if (error()) {
          <div class="alert-error" data-testid="register-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input
              class="form-input"
              type="text"
              name="username"
              [(ngModel)]="username"
              required
              placeholder="yourname"
              data-testid="username-input"
            />
          </div>
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
              minlength="8"
              placeholder="Min 8 characters"
              data-testid="password-input"
            />
          </div>
          <button
            class="btn btn-primary"
            type="submit"
            style="width:100%;justify-content:center;margin-top:4px"
            [disabled]="loading()"
            data-testid="register-btn"
          >
            @if (loading()) { <span class="spinner"></span> } @else { Create account }
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login" data-testid="login-link">Sign in</a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password || !this.username) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.email, this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.detail || 'Registration failed.');
        this.loading.set(false);
      },
    });
  }
}
