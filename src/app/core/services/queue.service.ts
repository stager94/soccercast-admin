import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { FailedJob, JobStatus, QueueJob, QueueProcess, QueueStats, RecurringTask } from '../models/queue.model';
import { PaginatedResponse } from '../models/pagination.model';

export interface JobsFilter {
  page?: number;
  status?: JobStatus | '';
  class_name?: string;
  queue_name?: string;
}

@Injectable({ providedIn: 'root' })
export class QueueService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<QueueStats> {
    return this.http.get<QueueStats>('/admin/queue/stats');
  }

  getJobs(filter: JobsFilter = {}): Observable<PaginatedResponse<QueueJob>> {
    const params: Record<string, string | number> = { page: filter.page ?? 1, per_page: 25 };
    if (filter.status) params['status'] = filter.status;
    if (filter.class_name) params['class_name'] = filter.class_name;
    if (filter.queue_name) params['queue_name'] = filter.queue_name;
    return this.http.get<PaginatedResponse<QueueJob>>('/admin/queue/jobs', { params });
  }

  getFailedJobs(filter: { page?: number; class_name?: string; queue_name?: string } = {}): Observable<PaginatedResponse<FailedJob>> {
    const params: Record<string, string | number> = { page: filter.page ?? 1, per_page: 25 };
    if (filter.class_name) params['class_name'] = filter.class_name;
    if (filter.queue_name) params['queue_name'] = filter.queue_name;
    return this.http.get<PaginatedResponse<FailedJob>>('/admin/queue/failed_jobs', { params });
  }

  retryFailedJob(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/admin/queue/failed_jobs/${id}/retry`, null);
  }

  deleteFailedJob(id: number): Observable<void> {
    return this.http.delete<void>(`/admin/queue/failed_jobs/${id}`);
  }

  deleteAllFailedJobs(): Observable<void> {
    return this.http.delete<void>('/admin/queue/failed_jobs/destroy_all');
  }

  getRecurringTasks(): Observable<{ data: RecurringTask[] }> {
    return this.http.get<{ data: RecurringTask[] }>('/admin/queue/recurring_tasks');
  }

  getProcesses(): Observable<{ data: QueueProcess[] }> {
    return this.http.get<{ data: QueueProcess[] }>('/admin/queue/processes');
  }
}
