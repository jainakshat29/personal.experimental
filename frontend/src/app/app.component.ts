import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell" [class.authenticated]="auth.isLoggedIn()">
      @if (auth.isLoggedIn()) {
        <nav class="sidebar" data-testid="sidebar">
          <div class="sidebar-header">
            <div class="logo">
              <span class="logo-icon">✦</span>
              <span class="logo-text">TaskFlow</span>
            </div>
          </div>
          <ul class="nav-links">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" data-testid="nav-dashboard">
                <span class="nav-icon">⬡</span> Dashboard
              </a>
            </li>
            <li>
              <a routerLink="/tasks" routerLinkActive="active" data-testid="nav-tasks">
                <span class="nav-icon">◈</span> Tasks
              </a>
            </li>
            <li>
              <a routerLink="/projects" routerLinkActive="active" data-testid="nav-projects">
                <span class="nav-icon">◉</span> Projects
              </a>
            </li>
          </ul>
          <div class="sidebar-footer">
            <div class="user-info">
              <span class="user-avatar">{{ auth.user()?.username?.charAt(0)?.toUpperCase() }}</span>
              <span class="user-name">{{ auth.user()?.username }}</span>
            </div>
            <button class="logout-btn" (click)="auth.logout()" data-testid="logout-btn">
              Sign out
            </button>
          </div>
        </nav>
      }
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  auth = inject(AuthService);
}
