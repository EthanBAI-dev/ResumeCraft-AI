import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_PHOTO, DEMO_PHOTOS } from "@/fixtures/demo-photo";
import { createEmptyResume } from "@/lib/schema";
import { useResumeStore } from "@/lib/store/resume-store";
import { BasicsForm } from "./basics-form";

beforeEach(() =>
  useResumeStore.getState().replaceResume(createEmptyResume(), { recordHistory: false }),
);

describe("demo portrait choices", () => {
  it("does not insert a placeholder merely by opening an empty resume", () => {
    render(<BasicsForm />);
    expect(screen.queryByText("照片预览")).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-tour="photo"] img')).toHaveLength(2);
    expect(useResumeStore.getState().resume.basics.photo.url).toBe("");
    expect(screen.getByRole("button", { name: "男生示例头像" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches between both portraits, shows the photo, and preserves the size", () => {
    useResumeStore
      .getState()
      .updateBasics("photo", { url: "", visible: false, size: 120, rounded: false });
    render(<BasicsForm />);
    fireEvent.click(screen.getByRole("button", { name: "女生示例头像" }));
    expect(useResumeStore.getState().resume.basics.photo).toEqual({
      url: DEMO_PHOTOS[1].url,
      visible: true,
      size: 120,
      rounded: false,
    });
    expect(screen.getByRole("button", { name: "女生示例头像" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "男生示例头像" }));
    expect(useResumeStore.getState().resume.basics.photo.url).toBe(DEMO_PHOTO);
    fireEvent.click(screen.getByRole("button", { name: "移除照片" }));
    expect(useResumeStore.getState().resume.basics.photo.url).toBe("");
    expect(useResumeStore.getState().resume.basics.photo.visible).toBe(false);
  });
});
