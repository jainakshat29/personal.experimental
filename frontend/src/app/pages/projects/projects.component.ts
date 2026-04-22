import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectCreate } from '../../models';

const COLORS = ['#7c6ef7','#e11d48','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6'];

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects</h1>
          <p class="page-subtitle">{{ projects().length }} projects</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()" data-testid="new-project-btn">
          + New project
        </button>
      </div>

      @if (projects().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">◉</div>
          <div class="empty-title">No projects yet</div>
          <div class="empty-desc">Create a project to group your tasks</div>
        </div>
      } @else {
        <div class="project-grid" data-testid="project-grid">
          @for (project of projects(); track project.id) {
            <div class="project-card" [attr.data-testid]="'project-card-' + project.id">
              <div class="project-color-bar" [style.background]="project.color"></div>
              <div class="project-name">{{ project.name }}</div>
              <div class="project-desc">{{ project.description || 'No description' }}</div>
              <div class="project-footer">
                <span style="font-size:12px;color:var(--text2)">{{ project.task_count }} tasks</span>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" (click)="openEdit(project); $event.stopPropagation()" [attr.data-testid]="'edit-project-' + project.id">Edit</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteProject(project.id); $event.stopPropagation()" [attr.data-testid]="'delete-project-' + project.id">Delete</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" data-testid="project-modal">
          <div class="modal-header">
            <h2>{{ editingProject() ? 'Edit project' : 'New project' }}</h2>
            <button class="btn btn-ghost btn-sm" (click)="closeModal()">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Name *</label>
            <input class="form-input" [(ngModel)]="form.name" placeholder="Project name" data-testid="project-name-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" [(ngModel)]="form.description" placeholder="Optional description…" data-testid="project-desc-input"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
              @for (color of colors; track color) {
                <div
                  (click)="form.color = color"
                  style="width:28px;height:28px;border-radius:50%;cursor:pointer;transition:all 0.15s"
                  [style.background]="color"
                  [style.box-shadow]="form.color === color ? '0 0 0 3px var(--bg2), 0 0 0 5px ' + color : 'none'"
                  [attr.data-testid]="'color-' + color"
                ></div>
              }
            </div>
          </div>

          @if (formError()) {
            <div class="alert-error">{{ formError() }}</div>
          }

          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveProject()" [disabled]="saving()" data-testid="save-project-btn">
              @if (saving()) { <span class="spinner"></span> } @else { {{ editingProject() ? 'Update' : 'Create' }} }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProjectsComponent implements OnInit {
  private projectSvc = inject(ProjectService);

  projects = signal<Project[]>([]);
  showModal = signal(false);
  editingProject = signal<Project | null>(null);
  saving = signal(false);
  formError = signal('');
  colors = COLORS;

  form: { name: string; description: string; color: string } = this.emptyForm();

  ngOnInit(): void { this.loadProjects(); }

  loadProjects(): void {
    this.projectSvc.getAll().subscribe(p => this.projects.set(p));
  }

  openCreate(): void {
    this.editingProject.set(null);
    this.form = this.emptyForm();
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(project: Project): void {
    this.editingProject.set(project);
    this.form = { name: project.name, description: project.description ?? '', color: project.color };
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveProject(): void {
    if (!this.form.name.trim()) { this.formError.set('Name is required.'); return; }
    this.saving.set(true);
    const payload: ProjectCreate = {
      name: this.form.name.trim(),
      description: this.form.description || undefined,
      color: this.form.color,
    };
    const obs = this.editingProject()
      ? this.projectSvc.update(this.editingProject()!.id, payload)
      : this.projectSvc.create(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadProjects(); },
      error: () => { this.formError.set('Something went wrong.'); this.saving.set(false); },
    });
  }

  deleteProject(id: string): void {
    this.projectSvc.delete(id).subscribe(() => this.loadProjects());
  }

  private emptyForm() { return { name: '', description: '', color: COLORS[0] }; }
}
