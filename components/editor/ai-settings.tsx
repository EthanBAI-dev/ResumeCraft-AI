"use client";
import { t, useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { useAiSettings } from "@/lib/store/ai-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDialog } from "./local-dialog";
export function AiSettings() {
  useLanguage();
  const settings = useAiSettings();
  const [key, setKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  return (
    <LocalDialog title={t("AI 设置 · 自带密钥")} onClose={() => settings.setOpen(false)}>
      <p className="text-sm">
        {t(
          "编辑、检查和导出全部免费，不需要 API Key。AI 为可选功能，费用由你的 DeepSeek 账户承担，网站不提供公共模型额度。",
        )}
      </p>
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        {t(
          "密钥仅保存在当前页面内存，刷新或关闭后清除，不进入简历备份。生成时，密钥和选定内容会经过本站后端转发到 DeepSeek 官方接口；后端不持久保存密钥。请只在信任的网站使用，勿在公共电脑输入。",
        )}
      </p>
      <label className="block space-y-2 text-sm">
        DeepSeek API Key
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t("输入自己的 API Key")}
          maxLength={256}
        />
      </label>
      <label className="block space-y-2 text-sm">
        {t("模型 ID")}
        <Input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          maxLength={100}
          placeholder="deepseek-flash"
        />
      </label>
      <p className="text-muted-foreground text-xs">
        {t(
          "仅支持官方 DeepSeek 地址，不接受任意代理 URL。模型以你的账户支持情况为准。保存设置不会调用模型；点击生成才产生用量。",
        )}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={
            !/^[\x21-\x7e]{8,256}$/.test(key.trim()) ||
            !/^[a-zA-Z0-9._-]{1,100}$/.test(model.trim())
          }
          onClick={() => settings.configure(key, model)}
        >
          {t("本次会话使用")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            settings.clear();
            setKey("");
            setModel("deepseek-flash");
          }}
        >
          {t("清除密钥")}
        </Button>
      </div>
    </LocalDialog>
  );
}
