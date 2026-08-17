import { describe, expect, it, vi } from "vitest";
import { RenderGate, RenderQueueClosedError, RenderQueueFullError } from "./render-gate.js";

describe("RenderGate", () => {
  it("限制并发并在空位出现时按先进先出执行", async () => {
    const gate = new RenderGate(1, 2);
    let releaseFirst!: () => void;
    const first = vi.fn(
      () => new Promise<string>((resolve) => (releaseFirst = () => resolve("first"))),
    );
    const second = vi.fn(async () => "second");

    const firstResult = gate.run(first);
    const secondResult = gate.run(second);
    expect(gate.snapshot).toMatchObject({ active: 1, queued: 1 });
    expect(second).not.toHaveBeenCalled();

    releaseFirst();
    await expect(firstResult).resolves.toBe("first");
    await expect(secondResult).resolves.toBe("second");
    expect(second).toHaveBeenCalledTimes(1);
    expect(gate.snapshot).toMatchObject({ active: 0, queued: 0 });
  });

  it("队列满时快速拒绝，避免无限堆积", async () => {
    const gate = new RenderGate(1, 1);
    const hold = new Promise<void>(() => {});
    void gate.run(() => hold);
    void gate.run(async () => undefined);

    await expect(gate.run(async () => undefined)).rejects.toBeInstanceOf(RenderQueueFullError);
  });

  it("关闭时拒绝等待中的任务", async () => {
    const gate = new RenderGate(1, 1);
    const hold = new Promise<void>(() => {});
    void gate.run(() => hold);
    const queued = gate.run(async () => undefined);

    gate.close();
    await expect(queued).rejects.toBeInstanceOf(RenderQueueClosedError);
    await expect(gate.run(async () => undefined)).rejects.toBeInstanceOf(RenderQueueClosedError);
  });
});
