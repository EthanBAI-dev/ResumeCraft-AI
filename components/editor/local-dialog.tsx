"use client";
import { t, useLanguage } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export function LocalDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="help-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="flex items-center justify-between border-b p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button aria-label={t("关闭{0}", title)} onClick={onClose} className="rounded p-1">
          <X className="size-5" />
        </button>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </dialog>
  );
}
