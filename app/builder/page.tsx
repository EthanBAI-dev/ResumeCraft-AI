import type { Metadata } from "next";
import { BuilderShell } from "./builder-shell";

export const metadata: Metadata = {
  title: "编辑器 · ResumeCraft",
};

export default function BuilderPage() {
  return <BuilderShell />;
}
