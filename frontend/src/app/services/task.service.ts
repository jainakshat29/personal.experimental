import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, TaskCreate, TaskUpdate, TaskFilter } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tasks`;

  getAll(filter?: TaskFilter): Observable<Task[]> {
    let params = new HttpParams();
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.priority) params = params.set('priority', filter.priority);
    if (filter?.project_id) params = params.set('project_id', filter.project_id);
    return this.http.get<Task[]>(this.base + '/', { params });
  }

  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.base}/${id}`);
  }

  create(data: TaskCreate): Observable<Task> {
    return this.http.post<Task>(this.base + '/', data);
  }

  update(id: string, data: TaskUpdate): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
