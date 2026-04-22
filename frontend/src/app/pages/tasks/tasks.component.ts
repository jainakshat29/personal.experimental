import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { Task, TaskCreate, TaskUpdate, TaskFilter, Project, TaskStatus, TaskPriority } from '../../models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-subtitle">{{ filteredTasks().length }} tasks</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()" data-testid="new-task-btn">
          + New task
        </button>
      </div>

      <div class="filters-bar" data-testid="filters-bar">
        <select class="filter-select" [(ngModel)]="filterStatus" (change)="applyFilter()" data-testid="filter-status">
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select class="filter-select" [(ngModel)]="filterPriority" (change)="applyFilter()" data-testid="filter-priority">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select class="filter-select" [(ngModel)]="filterProject" (change)="applyFilter()" data-testid="filter-project">
          <option value="">All projects</option>
          @for (p of projects(); track p.id) {
            <option [value]="p.id">{{ p.name }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div style="text-align:center;padding:40px;color:var(--text3)">Loading…</div>
      } @else if (filteredTasks().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">◈</div>
          <div class="empty-title">No tasks found</div>
          <div class="empty-desc">
            @if (hasFilter()) { Try clearing your filters } @else { Create your first task to get started }
          </div>
        </div>
      } @else {
        <div class="task-list" data-testid="task-list">
          @for (task of filteredTasks(); track task.id) {
            <div class="task-item" [attr.data-testid]="'task-item-' + task.id">
              <div
                class="task-check"
                [class.done]="task.status === 'done'"
                (click)="toggleDone(task)"
                [attr.data-testid]="'task-check-' + task.id"
              ></div>
              <div class="task-body">
                <div class="task-title" [class.done]="task.status === 'done'">{{ task.title }}</div>
                <div class="task-meta">
                  <span class="badge badge-{{ task.status }}">{{ formatStatus(task.status) }}</span>
                  <span class="badge badge-{{ task.priority }}">{{ task.priority }}</span>
                  @if (task.project_id) {
                    <span style="font-size:12px;color:var(--text3)">{{ getProjectName(task.project_id) }}</span>
                  }
                </div>
              </div>
              <div class="task-actions">
                <button class="btn btn-ghost btn-sm" (click)="openEdit(task)" [attr.data-testid]="'edit-task-' + task.id">Edit</button>
                <button class="btn btn-danger btn-sm" (click)="deleteTask(task.id)" [attr.data-testid]="'delete-task-' + task.id">Delete</button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" data-testid="task-modal">
          <div class="modal-header">
            <h2>{{ editingTask() ? 'Edit task' : 'New task' }}</h2>
            <button class="btn btn-ghost btn-sm" (click)="closeModal()">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" [(ngModel)]="form.title" placeholder="Task title" data-testid="task-title-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" [(ngModel)]="form.description" placeholder="Optional details…" data-testid="task-desc-input"></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" [(ngModel)]="form.status" data-testid="task-status-select">
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" [(ngModel)]="form.priority" data-testid="task-priority-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Project</label>
            <select class="form-select" [(ngModel)]="form.project_id" data-testid="task-project-select">
              <option value="">No project</option>
              @for (p of projects(); track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Due date</label>
            <input class="form-input" type="date" [(ngModel)]="form.due_date" data-testid="task-due-input" />
          </div>

          @if (formError()) {
            <div class="alert-error">{{ formError() }}</div>
          }

          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveTask()" [disabled]="saving()" data-testid="save-task-btn">
              @if (saving()) { <span class="spinner"></span> } @else { {{ editingTask() ? 'Update' : 'Create' }} }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TasksComponent implements OnInit {
  private taskSvc = inject(TaskService);
  private projectSvc = inject(ProjectService);

  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingTask = signal<Task | null>(null);
  saving = signal(false);
  formError = signal('');

  filterStatus = '';
  filterPriority = '';
  filterProject = '';

  form: Partial<TaskCreate & { project_id: string; due_date: string }> = this.emptyForm();

  filteredTasks = () => {
    let t = this.tasks();
    if (this.filterStatus) t = t.filter(x => x.status === this.filterStatus);
    if (this.filterPriority) t = t.filter(x => x.priority === this.filterPriority);
    if (this.filterProject) t = t.filter(x => x.project_id === this.filterProject);
    return t;
  };

  hasFilter = () => !!(this.filterStatus || this.filterPriority || this.filterProject);

  ngOnInit(): void {
    this.loadTasks();
    this.projectSvc.getAll().subscribe(p => this.projects.set(p));
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskSvc.getAll().subscribe(tasks => {
      this.tasks.set(tasks);
      this.loading.set(false);
    });
  }

  applyFilter(): void { /* filtering is reactive via signal */ }

  openCreate(): void {
    this.editingTask.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(task: Task): void {
    this.editingTask.set(task);
    this.form = {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      project_id: task.project_id ?? '',
      due_date: task.due_date ? task.due_date.substring(0, 10) : '',
    };
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveTask(): void {
    if (!this.form.title?.trim()) {
      this.formError.set('Title is required.');
      return;
    }
    this.saving.set(true);
    const payload: TaskCreate = {
      title: this.form.title!.trim(),
      description: this.form.description || undefined,
      status: (this.form.status as TaskStatus) || 'todo',
      priority: (this.form.priority as TaskPriority) || 'medium',
      project_id: this.form.project_id || undefined,
      due_date: this.form.due_date || undefined,
    };

    const obs = this.editingTask()
      ? this.taskSvc.update(this.editingTask()!.id, payload)
      : this.taskSvc.create(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadTasks(); },
      error: () => { this.formError.set('Something went wrong. Please try again.'); this.saving.set(false); },
    });
  }

  toggleDone(task: Task): void {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    this.taskSvc.update(task.id, { status: newStatus }).subscribe(() => this.loadTasks());
  }

  deleteTask(id: string): void {
    this.taskSvc.delete(id).subscribe(() => this.loadTasks());
  }

  getProjectName(id: string): string {
    return this.projects().find(p => p.id === id)?.name ?? '';
  }

  formatStatus(s: string): string {
    return s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1);
  }

  private emptyForm() {
    return { title: '', description: '', status: 'todo' as TaskStatus, priority: 'medium' as TaskPriority, project_id: '', due_date: '' };
  }
}
