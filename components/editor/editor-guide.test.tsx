import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { setLanguage } from "@/lib/i18n";
import { useEditorStore } from "@/lib/store/editor-store";
import { useResumeStore } from "@/lib/store/resume-store";
import { EditorGuide, GUIDE_STEPS } from "./editor-guide";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
  // Geometry is verified in the real browser; these tests exercise tour behavior.
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  useResumeStore.getState().replaceResume(sampleResume, { recordHistory: false });
  useEditorStore.setState({
    guideStep: 0,
    helpOpen: false,
    panelTab: "content",
    mobileView: "edit",
    layoutMode: false,
    expandedSections: ["basics"],
  });
});

afterEach(() => {
  for (const [name, descriptor] of [
    ["showModal", originalShowModal],
    ["close", originalClose],
  ] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
  vi.unstubAllGlobals();
});

it("keeps navigation in the same dock while every step changes, without editing the resume", () => {
  setLanguage("en-US");
  const original = useResumeStore.getState().resume;
  const { container } = render(<EditorGuide ready={false} />);
  const dock = container.querySelector(".guide-card");
  const footer = container.querySelector(".guide-actions");
  const copy = container.querySelector<HTMLElement>(".guide-copy")!;
  for (let step = 0; step < GUIDE_STEPS.length; step++) {
    expect(useEditorStore.getState().guideStep).toBe(step);
    const next = screen.getByRole("button", {
      name: step === GUIDE_STEPS.length - 1 ? "Start editing" : "Next",
    });
    expect(footer).toContainElement(next);
    expect(container.querySelector(".guide-card")).toBe(dock);
    expect(dock).not.toHaveAttribute("style");
    copy.scrollTop = 80;
    fireEvent.click(next);
    if (step < GUIDE_STEPS.length - 1) expect(copy.scrollTop).toBe(0);
  }
  expect(useEditorStore.getState().guideStep).toBeNull();
  expect(useResumeStore.getState().resume).toBe(original);
  expect(useEditorStore.getState().panelTab).toBe("content");
  expect(useEditorStore.getState().layoutMode).toBe(false);
});

it("supports back, numbered jumps and escape with the fixed Chinese controls", () => {
  render(<EditorGuide ready={false} />);
  expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "第 5 步：用 AI 打磨表达，再由你确认" }));
  expect(useEditorStore.getState().guideStep).toBe(4);
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
  expect(useEditorStore.getState().guideStep).toBe(3);
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(useEditorStore.getState().guideStep).toBeNull();
});
