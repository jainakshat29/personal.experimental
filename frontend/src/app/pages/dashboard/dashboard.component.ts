import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Task, Project } from '../../models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title" data-testid="dashboard-title">
            Good day, {{ auth.user()?.username }} 👋
          </h1>
          <p class="page-subtitle">Here's an overview of your work</p>
        </div>
      </div>

      <div class="stats-grid" data-testid="stats-grid">
        <div class="stat-card">
          <div class="stat-value" data-testid="stat-total">{{ total() }}</div>
          <div class="stat-label">Total tasks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent2)" data-testid="stat-inprogress">{{ inProgress() }}</div>
          <div class="stat-label">In progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success)" data-testid="stat-done">{{ done() }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--warning)" data-testid="stat-projects">{{ projects().length }}</div>
          <div class="stat-label">Projects</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h2 style="font-size:15px;font-weight:600">Recent tasks</h2>
            <a routerLink="/tasks" style="font-size:13px;color:var(--accent2);text-decoration:none">View all →</a>
          </div>
          @if (recentTasks().length === 0) {
            <div class="empty-state" style="padding:30px">
              <div class="empty-icon">◈</div>
              <div class="empty-title">No tasks yet</div>
              <div class="empty-desc"><a routerLink="/tasks" style="color:var(--accent2);text-decoration:none">Create your first task</a></div>
            </div>
          }
          @for (task of recentTasks(); track task.id) {
            <div class="task-item" style="margin-bottom:8px" data-testid="dashboard-task">
              <div class="task-body">
                <div class="task-title" [class.done]="task.status === 'done'">{{ task.title }}</div>
                <div class="task-meta">
                  <span class="badge badge-{{ task.status }}">{{ task.status | titlecase }}</span>
                  <span class="badge badge-{{ task.priority }}">{{ task.priority }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h2 style="font-size:15px;font-weight:600">Projects</h2>
            <a routerLink="/projects" style="font-size:13px;color:var(--accent2);text-decoration:none">View all →</a>
          </div>
          @if (projects().length === 0) {
            <div class="empty-state" style="padding:30px">
              <div class="empty-icon">◉</div>
              <div class="empty-title">No projects yet</div>
              <div class="empty-desc"><a routerLink="/projects" style="color:var(--accent2);text-decoration:none">Create a project</a></div>
            </div>
          }
          @for (project of projects().slice(0, 4); track project.id) {
            <div class="project-card" style="margin-bottom:8px" data-testid="dashboard-project" [routerLink]="['/projects']">
              <div class="project-color-bar" [style.background]="project.color"></div>
              <div class="project-name">{{ project.name }}</div>
              <div style="font-size:12px;color:var(--text2)">{{ project.task_count }} tasks</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private taskSvc = inject(TaskService);
  private projectSvc = inject(ProjectService);

  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);

  total = () => this.tasks().length;
  inProgress = () => this.tasks().filter(t => t.status === 'in_progress').length;
  done = () => this.tasks().filter(t => t.status === 'done').length;
  recentTasks = () => this.tasks().slice(0, 5);

  ngOnInit(): void {
    forkJoin({
      tasks: this.taskSvc.getAll(),
      projects: this.projectSvc.getAll(),
    }).subscribe(({ tasks, projects }) => {
      this.tasks.set(tasks);
      this.projects.set(projects);
    });
  }
}
