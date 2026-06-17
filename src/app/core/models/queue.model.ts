export interface QueueStats {
  ready: number;
  running: number;
  scheduled: number;
  failed: number;
  blocked: number;
  finished: number;
  total: number;
}

export type JobStatus = 'ready' | 'running' | 'scheduled' | 'failed' | 'blocked' | 'finished';

export interface QueueJob {
  id: number;
  queue_name: string;
  class_name: string;
  arguments: unknown[];
  priority: number;
  active_job_id: string | null;
  status: JobStatus;
  scheduled_at: string | null;
  finished_at: string | null;
  concurrency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface FailedJob {
  id: number;
  error: string | Record<string, unknown>;
  created_at: string;
  job: {
    id: number;
    queue_name: string;
    class_name: string;
    arguments: unknown[];
    priority: number;
    status: JobStatus;
    scheduled_at: string | null;
    finished_at: string | null;
    created_at: string;
  };
}

export interface RecurringTask {
  id: number;
  key: string;
  schedule: string;
  class_name: string | null;
  command: string | null;
  queue_name: string | null;
  priority: number;
  description: string | null;
  static: boolean;
  arguments: unknown[] | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueProcess {
  id: number;
  kind: string;
  name: string;
  pid: number;
  hostname: string;
  last_heartbeat_at: string;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}
