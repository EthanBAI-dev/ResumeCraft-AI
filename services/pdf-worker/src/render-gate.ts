export class RenderQueueFullError extends Error {
  constructor() {
    super("PDF render queue is full");
  }
}

export class RenderQueueClosedError extends Error {
  constructor() {
    super("PDF render queue is closed");
  }
}

export class RenderQueueTimeoutError extends Error {
  constructor() {
    super("PDF render queue wait timed out");
  }
}

type QueuedTask<T> = {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Chromium 的 Context 会消耗显著内存。这个小型 semaphore 让运行中的渲染数和
 * 排队请求数都有明确上限；超过上限立即失败，而不是让所有请求一起超时。
 */
export class RenderGate {
  private active = 0;
  private closed = false;
  private readonly queued: QueuedTask<unknown>[] = [];
  private startedTotal = 0;
  private completedTotal = 0;
  private failedTotal = 0;
  private rejectedTotal = 0;
  private queueTimeoutTotal = 0;
  private totalDurationMs = 0;
  private lastDurationMs = 0;

  constructor(
    readonly maxConcurrent: number,
    readonly maxQueued: number,
    readonly queueTimeoutMs = 5_000,
  ) {
    if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
      throw new Error("maxConcurrent must be a positive integer");
    }
    if (!Number.isInteger(maxQueued) || maxQueued < 0) {
      throw new Error("maxQueued must be a non-negative integer");
    }
    if (!Number.isInteger(queueTimeoutMs) || queueTimeoutMs < 1) {
      throw new Error("queueTimeoutMs must be a positive integer");
    }
  }

  get snapshot() {
    return {
      active: this.active,
      queued: this.queued.length,
      maxConcurrent: this.maxConcurrent,
      maxQueued: this.maxQueued,
      queueTimeoutMs: this.queueTimeoutMs,
      accepting: !this.closed,
      startedTotal: this.startedTotal,
      completedTotal: this.completedTotal,
      failedTotal: this.failedTotal,
      rejectedTotal: this.rejectedTotal,
      queueTimeoutTotal: this.queueTimeoutTotal,
      lastDurationMs: this.lastDurationMs,
      averageDurationMs:
        this.completedTotal + this.failedTotal === 0
          ? 0
          : Math.round(this.totalDurationMs / (this.completedTotal + this.failedTotal)),
    };
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    if (this.closed) {
      this.rejectedTotal += 1;
      return Promise.reject(new RenderQueueClosedError());
    }
    if (this.active < this.maxConcurrent) return this.start(task);
    if (this.queued.length >= this.maxQueued) {
      this.rejectedTotal += 1;
      return Promise.reject(new RenderQueueFullError());
    }

    return new Promise<T>((resolve, reject) => {
      const queuedTask = {
        task,
        resolve,
        reject,
        timer: setTimeout(() => {
          const index = this.queued.indexOf(queuedTask as QueuedTask<unknown>);
          if (index === -1) return;
          this.queued.splice(index, 1);
          this.queueTimeoutTotal += 1;
          reject(new RenderQueueTimeoutError());
        }, this.queueTimeoutMs),
      } as QueuedTask<T>;
      this.queued.push(queuedTask as QueuedTask<unknown>);
    });
  }

  close() {
    this.closed = true;
    while (this.queued.length) {
      const task = this.queued.shift();
      if (!task) continue;
      clearTimeout(task.timer);
      this.rejectedTotal += 1;
      task.reject(new RenderQueueClosedError());
    }
  }

  private async start<T>(task: () => Promise<T>): Promise<T> {
    this.active += 1;
    this.startedTotal += 1;
    const startedAt = performance.now();
    try {
      const result = await task();
      this.completedTotal += 1;
      return result;
    } catch (error) {
      this.failedTotal += 1;
      throw error;
    } finally {
      this.lastDurationMs = Math.round(performance.now() - startedAt);
      this.totalDurationMs += this.lastDurationMs;
      this.active -= 1;
      this.drain();
    }
  }

  private drain() {
    if (this.closed || this.active >= this.maxConcurrent) return;
    const next = this.queued.shift();
    if (!next) return;
    clearTimeout(next.timer);
    void this.start(next.task).then(next.resolve, next.reject);
  }
}
