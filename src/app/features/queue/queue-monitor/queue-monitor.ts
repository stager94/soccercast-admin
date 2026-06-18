import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, interval } from 'rxjs';

import { FailedJob, JobStatus, QueueJob, QueueProcess, QueueStats, RecurringTask } from '../../../core/models/queue.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { JobsFilter, QueueService } from '../../../core/services/queue.service';
import { Pagination } from '../../../shared/pagination/pagination';

type Tab = 'jobs' | 'failed' | 'recurring' | 'processes';

const JOB_STATUSES: JobStatus[] = ['ready', 'running', 'scheduled', 'failed', 'blocked', 'finished'];

@Component({
  selector: 'app-queue-monitor',
  imports: [DatePipe, Pagination],
  templateUrl: './queue-monitor.html',
})
export class QueueMonitor implements OnInit {
  private readonly queueService = inject(QueueService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly jobSearch$ = new Subject<void>();
  private statsPolling: Subscription | null = null;

  readonly activeTab = signal<Tab>('jobs');
  readonly tabLoaded = signal<Set<Tab>>(new Set());

  // Stats
  readonly stats = signal<QueueStats | null>(null);
  readonly statsLoading = signal(true);

  // Jobs tab
  readonly jobs = signal<QueueJob[]>([]);
  readonly jobsMeta = signal<PaginationMeta | null>(null);
  readonly jobsLoading = signal(false);
  readonly jobStatusFilter = signal<JobStatus | ''>('');
  readonly jobClassFilter = signal('');
  readonly jobQueueFilter = signal('');

  // Failed tab
  readonly failedJobs = signal<FailedJob[]>([]);
  readonly failedMeta = signal<PaginationMeta | null>(null);
  readonly failedLoading = signal(false);
  readonly retryingIds = signal<Set<number>>(new Set());
  readonly deletingIds = signal<Set<number>>(new Set());
  readonly deletingAll = signal(false);

  // Recurring tab
  readonly recurringTasks = signal<RecurringTask[]>([]);
  readonly recurringLoading = signal(false);

  // Processes tab
  readonly processes = signal<QueueProcess[]>([]);
  readonly processesLoading = signal(false);

  readonly jobStatuses = JOB_STATUSES;

  ngOnInit(): void {
    this.jobSearch$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() =>
      this.loadJobs(1),
    );
    this.loadStats();
    this.loadJobs(1);
    this.tabLoaded.update((s) => new Set([...s, 'jobs']));

    this.statsPolling = interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStats());
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (!this.tabLoaded().has(tab)) {
      this.tabLoaded.update((s) => new Set([...s, tab]));
      if (tab === 'failed') this.loadFailed(1);
      if (tab === 'recurring') this.loadRecurring();
      if (tab === 'processes') this.loadProcesses();
    }
  }

  // Stats
  loadStats(): void {
    this.queueService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (s) => { this.stats.set(s); this.statsLoading.set(false); }, error: () => this.statsLoading.set(false) });
  }

  // Jobs
  loadJobs(page: number): void {
    this.jobsLoading.set(true);
    const filter: JobsFilter = {
      page,
      status: this.jobStatusFilter() || undefined,
      class_name: this.jobClassFilter() || undefined,
      queue_name: this.jobQueueFilter() || undefined,
    };
    this.queueService
      .getJobs(filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.jobs.set(res.data); this.jobsMeta.set(res.meta); this.jobsLoading.set(false); },
        error: () => this.jobsLoading.set(false),
      });
  }

  onJobStatusChange(v: string): void { this.jobStatusFilter.set(v as JobStatus | ''); this.loadJobs(1); }
  onJobClassInput(v: string): void { this.jobClassFilter.set(v); this.jobSearch$.next(); }
  onJobQueueInput(v: string): void { this.jobQueueFilter.set(v); this.jobSearch$.next(); }
  resetJobFilters(): void { this.jobStatusFilter.set(''); this.jobClassFilter.set(''); this.jobQueueFilter.set(''); this.loadJobs(1); }

  // Failed
  loadFailed(page: number): void {
    this.failedLoading.set(true);
    this.queueService
      .getFailedJobs({ page })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.failedJobs.set(res.data); this.failedMeta.set(res.meta); this.failedLoading.set(false); },
        error: () => this.failedLoading.set(false),
      });
  }

  retryJob(job: FailedJob): void {
    if (this.retryingIds().has(job.id)) return;
    this.retryingIds.update((s) => new Set([...s, job.id]));
    this.queueService
      .retryFailedJob(job.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.retryingIds.update((s) => { const n = new Set(s); n.delete(job.id); return n; });
          this.loadFailed(1);
          this.loadStats();
        },
        error: () => this.retryingIds.update((s) => { const n = new Set(s); n.delete(job.id); return n; }),
      });
  }

  deleteJob(job: FailedJob): void {
    if (!confirm(`Delete failed job #${job.id} (${job.job.class_name})?`)) return;
    if (this.deletingIds().has(job.id)) return;
    this.deletingIds.update((s) => new Set([...s, job.id]));
    this.queueService
      .deleteFailedJob(job.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingIds.update((s) => { const n = new Set(s); n.delete(job.id); return n; });
          this.loadFailed(this.failedMeta()?.page ?? 1);
          this.loadStats();
        },
        error: () => this.deletingIds.update((s) => { const n = new Set(s); n.delete(job.id); return n; }),
      });
  }

  deleteAllJobs(): void {
    if (!confirm(`Delete all ${this.failedMeta()?.total_count ?? ''} failed jobs? This cannot be undone.`)) return;
    if (this.deletingAll()) return;
    this.deletingAll.set(true);
    this.queueService
      .deleteAllFailedJobs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingAll.set(false);
          this.loadFailed(1);
          this.loadStats();
        },
        error: () => this.deletingAll.set(false),
      });
  }

  // Recurring
  loadRecurring(): void {
    this.recurringLoading.set(true);
    this.queueService
      .getRecurringTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => { this.recurringTasks.set(r.data); this.recurringLoading.set(false); },
        error: () => this.recurringLoading.set(false),
      });
  }

  // Processes
  loadProcesses(): void {
    this.processesLoading.set(true);
    this.queueService
      .getProcesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => { this.processes.set(r.data); this.processesLoading.set(false); },
        error: () => this.processesLoading.set(false),
      });
  }

  processQueues(p: QueueProcess): string {
    const q = p.metadata['queues'];
    return Array.isArray(q) ? (q as string[]).join(', ') : '—';
  }

  processThreads(p: QueueProcess): number | null {
    const t = p.metadata['thread_count'];
    return typeof t === 'number' ? t : null;
  }

  jobStatusClass(status: JobStatus): string {
    const map: Record<JobStatus, string> = {
      running: 'bg-blue-100 text-blue-700',
      ready: 'bg-brand-100 text-brand-600',
      scheduled: 'bg-purple-100 text-purple-700',
      failed: 'bg-red-100 text-red-700',
      blocked: 'bg-orange-100 text-orange-700',
      finished: 'bg-green-100 text-green-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  isRetrying(id: number): boolean { return this.retryingIds().has(id); }
  isDeleting(id: number): boolean { return this.deletingIds().has(id); }
  hasJobFilters(): boolean { return !!(this.jobStatusFilter() || this.jobClassFilter() || this.jobQueueFilter()); }

  formatError(error: string | Record<string, unknown>): string {
    if (typeof error === 'string') return error;
    // Common GoodJob/Solid Queue error shape: { message, backtrace }
    if (typeof error === 'object' && error !== null) {
      const msg = (error['message'] ?? error['error'] ?? '') as string;
      const bt = error['backtrace'];
      const trace = Array.isArray(bt) ? '\n' + (bt as string[]).slice(0, 10).join('\n') : '';
      return msg ? msg + trace : JSON.stringify(error, null, 2);
    }
    return String(error);
  }
}
