import type { Metadata } from "next";
import { BuilderShell } from "./builder-shell";

export const metadata: Metadata = {
  title: "Resume builder · ResumeCraft",
};

export default function BuilderPage() {
  return <BuilderShell />;
}
