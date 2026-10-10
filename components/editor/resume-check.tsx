"use client";
import { t, useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { checkResume, matchKeywords } from "@/lib/checks/resume-check";
import { useResumeStore } from "@/lib/store/resume-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { Button } from "@/components/ui/button";
import { LocalDialog } from "./local-dialog";
export function ResumeCheck({ onClose }: { onClose: () => void }) {
  useLanguage();
  const resume = useResumeStore((s) => s.resume);
  const [keywords, setKeywords] = useState("");
  const issues = checkResume(resume, t);
  return (
    <LocalDialog title={t("投递前检查")} onClose={onClose}>
      <p className="text-muted-foreground text-sm">
        {t(
          "这是本地规则检查，不是招聘评价或 ATS 通过率。不打总分、不预测录用，也不会为了“量化”要求你编造数字。所有检查都在浏览器中完成。",
        )}
      </p>
      <p className="font-medium">
        {issues.length
          ? t("{0} 项值得核对", issues.length)
          : t("未发现当前规则覆盖的问题；不代表简历内容或投递效果已被验证。")}
      </p>
      <div className="space-y-2">
        {issues.map((issue) => (
          <section key={issue.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">
                {issue.level === "suggestion" ? t("建议 · ") : t("核对 · ")}{" "}
                {issue.title}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose();
                  const ui = useEditorStore.getState();
                  ui.setPanelTab("content");
                  ui.setMobileView("edit");
                  ui.expand(issue.sectionId);
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                      document
                        .getElementById(`panel-${issue.sectionId}`)
                        ?.scrollIntoView({ block: "start", behavior: "smooth" }),
                    ),
                  );
                }}
              >
                {t("去查看")}
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{issue.reason}</p>
          </section>
        ))}
      </div>
      <label className="block text-sm font-medium">
        {t("岗位关键词核对（可选）")}
        <textarea
          className="mt-2 min-h-20 w-full rounded-lg border p-2 text-sm"
          value={keywords}
          maxLength={800}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={t("自己从岗位描述中挑出关键词，用逗号分隔，例如 Java、MySQL、项目管理")}
        />
      </label>
      <p className="text-muted-foreground text-xs">
        {t(
          "最多 20 项，仅检查可见区块内容中是否出现文本，不做语义匹配或判断能力。未出现不等于不具备，不要为匹配而堆词。",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {matchKeywords(resume, keywords).map(({ term, found }) => (
          <span
            key={term}
            className={`rounded border px-2 py-1 text-xs ${found ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900"}`}
          >
            {term} · {found ? t("出现过") : t("未找到")}
          </span>
        ))}
      </div>
    </LocalDialog>
  );
}
