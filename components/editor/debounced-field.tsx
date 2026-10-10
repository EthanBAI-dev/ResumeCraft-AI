"use client";
import { t, useLanguage } from "@/lib/i18n";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INPUT_DEBOUNCE_MS } from "@/lib/constants";

/**
 * 受控于本地 state、防抖写 store 的输入控件。
 *
 * ADR-005 的第一条性能措施：如果输入框直接受控于 store，
 * 每敲一个字符就会触发一次全量 React 更新 + 预览重排。
 * 这里让输入框自己持有值，停顿 200ms 后才提交，把重渲染次数降一个数量级。
 *
 * 外部值变化（撤销、AI 改写、导入）时要能覆盖本地值——但只在未聚焦时，
 * 否则用户正在打字会被"抢输入"。
 */
function useDebouncedValue(value: string, onCommit: (next: string) => void) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef(value);

  useEffect(() => {
    if (focused.current) return;
    if (value !== committed.current) {
      committed.current = value;
      setLocal(value);
    }
  }, [value]);

  const flush = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    committed.current = next;
    onCommit(next);
  };

  const change = (next: string) => {
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(next), INPUT_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return {
    value: local,
    onChange: change,
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
      // 失焦立即提交，避免"改完就切走、200ms 内组件被卸载"导致丢字
      flush(local);
    },
  };
}

type FieldProps = {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  hint?: string;
  id?: string;
};

export function TextField({ label, value, onCommit, placeholder, hint, id }: FieldProps) {
  useLanguage();
  const field = useDebouncedValue(value, onCommit);
  // 用 useId 而不是 `f-${label}`：同一页上完全可能有两个「区块标题」，
  // 靠文本拼 id 会产生重复 id，label 会关联到错误的输入框。
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-muted-foreground text-xs font-medium">
        {t(label)}
      </label>
      <Input
        id={inputId}
        value={field.value}
        placeholder={t(placeholder)}
        onChange={(e) => field.onChange(e.target.value)}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
      />
      {hint ? <p className="text-muted-foreground text-xs">{t(hint)}</p> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onCommit,
  placeholder,
  rows = 3,
  id,
}: FieldProps & { rows?: number }) {
  useLanguage();
  const field = useDebouncedValue(value, onCommit);
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-muted-foreground text-xs font-medium">
        {t(label)}
      </label>
      <Textarea
        id={inputId}
        rows={rows}
        value={field.value}
        placeholder={t(placeholder)}
        onChange={(e) => field.onChange(e.target.value)}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
      />
    </div>
  );
}

/** 无 label 的防抖多行输入，用于 highlights 这类列表项 */
export function DebouncedTextarea({
  value,
  onCommit,
  placeholder,
  rows = 2,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  "aria-label"?: string;
}) {
  useLanguage();
  const field = useDebouncedValue(value, onCommit);
  return (
    <Textarea
      rows={rows}
      className={className}
      aria-label={ariaLabel}
      value={field.value}
      placeholder={t(placeholder)}
      onChange={(e) => field.onChange(e.target.value)}
      onFocus={field.onFocus}
      onBlur={field.onBlur}
    />
  );
}

/** 逗号/空格分隔的标签输入（技术栈、技能关键词） */
export function TagsField({
  label,
  value,
  onCommit,
  placeholder,
}: {
  label: string;
  value: string[];
  onCommit: (value: string[]) => void;
  placeholder?: string;
}) {
  useLanguage();
  const field = useDebouncedValue(value.join("、"), (next) =>
    onCommit(
      next
        .split(/[、,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-xs font-medium">{t(label)}</label>
      <Input
        value={field.value}
        placeholder={placeholder ?? t("用顿号或逗号分隔")}
        onChange={(e) => field.onChange(e.target.value)}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
      />
    </div>
  );
}
