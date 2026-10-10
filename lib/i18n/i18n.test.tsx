import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { LanguageSwitch } from "@/components/editor/language-switch";
import { EditorPanel } from "@/components/editor/editor-panel";
import { EditorGuide } from "@/components/editor/editor-guide";
import { useEditorStore } from "@/lib/store/editor-store";
import { useResumeStore } from "@/lib/store/resume-store";
import { englishSampleResume } from "@/fixtures/english-sample-resume";
import { demoResume } from "@/lib/store/library";
import { ResumeDataSchema, createEmptyResume } from "@/lib/schema";
import { en } from "./en";
import { LANGUAGE_KEY, getLanguage, initializeLanguage, setLanguage, t } from ".";

describe("English and Chinese UI", () => {
  it("has English translations for every migrated UI phrase", () => {
    const files = [
      ...readdirSync("components/editor")
        .filter(
          (file) =>
            file.endsWith(".tsx") && !file.includes(".test.") && file !== "ai-highlight-review.tsx",
        )
        .map((file) => `components/editor/${file}`),
      "app/page.tsx",
      "app/privacy/page.tsx",
      "app/builder/builder-shell.tsx",
      "components/preview/preview-canvas.tsx",
      "components/preview/layout-editor.tsx",
    ];
    const missing = new Set<string>();
    for (const file of files) {
      const ast = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(ast) === "t" &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          const phrase = node.arguments[0].text;
          if (/[\u3400-\u9fff]/u.test(phrase) && !en[phrase]) missing.add(phrase);
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
    expect([...missing]).toEqual([]);
  });

  it("defaults to English, persists the preference, and leaves edited content and undo history untouched", () => {
    localStorage.removeItem(LANGUAGE_KEY);
    useResumeStore.getState().replaceResume(englishSampleResume, { recordHistory: false });
    useResumeStore.getState().updateBasics("name", "我的真实姓名 / My own name");
    const before = useResumeStore.getState().resume;
    const history = useResumeStore.temporal.getState().pastStates;
    render(
      <>
        <LanguageSwitch />
        <EditorPanel />
      </>,
    );
    expect(getLanguage()).toBe("en-US");
    expect(screen.getByRole("tab", { name: "Templates & style" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Language / 语言"), { target: { value: "zh-CN" } });
    expect(screen.getByRole("tab", { name: "模板与样式" })).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe("zh-CN");
    fireEvent.change(screen.getByLabelText("Language / 语言"), { target: { value: "en-US" } });
    expect(useResumeStore.getState().resume).toBe(before);
    expect(useResumeStore.temporal.getState().pastStates).toBe(history);
    initializeLanguage();
    expect(getLanguage()).toBe("en-US");
  });

  it("creates schema-valid English samples and blank resumes without altering the Chinese sample", () => {
    setLanguage("en-US");
    expect(ResumeDataSchema.safeParse(demoResume()).success).toBe(true);
    expect(demoResume().metadata.locale).toBe("en-US");
    expect(demoResume().basics.name).toBe("Alex Chen");
    expect(createEmptyResume("en-US").sections.experience.name).toBe("Experience");
    setLanguage("zh-CN");
    expect(demoResume().basics.name).toBe("陈亦然");
    expect(t("减少{0}宽度", "公司")).toBe("减少公司宽度");
    setLanguage("en-US");
    expect(t("减少{0}宽度", "公司")).toBe("Decrease Company width");
  });

  it("shows feature help in English without rewriting the resume", () => {
    setLanguage("en-US");
    // jsdom lacks the native dialog API.
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    act(() => useEditorStore.setState({ helpOpen: true, guideStep: null }));
    const view = render(<EditorGuide ready={false} />);
    expect(screen.getByText("Get to know your workspace")).toBeInTheDocument();
    expect(screen.getByText("Arrange fields on a 12-column grid")).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(/[\u3400-\u9fff]/u);
    act(() => useEditorStore.setState({ helpOpen: false }));
  });
});
