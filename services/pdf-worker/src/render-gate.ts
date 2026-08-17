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

type QueuedTask<T> = {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

/**
 * Chromium 的 Context 会消耗显著内存。这个小型 semaphore 让运行中的渲染数和
 * 排队请求数都有明确上限；超过上限立即失败，而不是让所有请求一起超时。
 */
export class RenderGate {
  private active = 0;
  private closed = false;
  private readonly queued: QueuedTask<unknown>[] = [];

  constructor(
    readonly maxConcurrent: number,
    readonly maxQueued: number,
  ) {
    if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
      throw new Error("maxConcurrent must be a positive integer");
    }
    if (!Number.isInteger(maxQueued) || maxQueued < 0) {
      throw new Error("maxQueued must be a non-negative integer");
    }
  }

  get snapshot() {
    return {
      active: this.active,
      queued: this.queued.length,
      maxConcurrent: this.maxConcurrent,
      maxQueued: this.maxQueued,
      accepting: !this.closed,
    };
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    if (this.closed) return Promise.reject(new RenderQueueClosedError());
    if (this.active < this.maxConcurrent) return this.start(task);
    if (this.queued.length >= this.maxQueued) return Promise.reject(new RenderQueueFullError());

    return new Promise<T>((resolve, reject) => {
      this.queued.push({ task, resolve, reject } as QueuedTask<unknown>);
    });
  }

  close() {
    this.closed = true;
    while (this.queued.length) this.queued.shift()?.reject(new RenderQueueClosedError());
  }

  private async start<T>(task: () => Promise<T>): Promise<T> {
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.drain();
    }
  }

  private drain() {
    if (this.closed || this.active >= this.maxConcurrent) return;
    const next = this.queued.shift();
    if (!next) return;
    void this.start(next.task).then(next.resolve, next.reject);
  }
}
