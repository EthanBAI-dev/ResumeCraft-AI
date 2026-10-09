import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { useResumeStore } from "@/lib/store/resume-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { ItemLayoutEditor } from "./item-layout-editor";

beforeEach(() => {
  useResumeStore.getState().replaceResume(sampleResume, { recordHistory: false });
  useEditorStore.setState({ layoutMode: false, activeSectionId: null, guideStep: null });
});

it("shows the corresponding section guides when opening layout controls without modifying content", () => {
  const original = useResumeStore.getState().resume;
  const { container } = render(
    <ItemLayoutEditor sectionId="experience" sectionType="experience" />,
  );
  const details = container.querySelector("details")!;
  details.open = true;
  fireEvent(details, new Event("toggle"));
  expect(useEditorStore.getState().layoutMode).toBe(true);
  expect(useEditorStore.getState().activeSectionId).toBe("experience");
  expect(useResumeStore.getState().resume).toBe(original);
});

it("activates guides after applying a preset and preserves the specified spans", () => {
  render(<ItemLayoutEditor sectionId="experience" sectionType="experience" />);
  fireEvent.click(screen.getByRole("button", { name: "套用紧凑一行预设", hidden: true }));
  expect(useEditorStore.getState().layoutMode).toBe(true);
  expect(useEditorStore.getState().activeSectionId).toBe("experience");
  expect(useResumeStore.getState().resume.metadata.itemLayouts.experience.preset).toBe("inline");
});
