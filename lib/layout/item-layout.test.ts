import { describe, expect, it } from "vitest";
import { DEFAULT_ITEM_LAYOUT, type ItemLayoutConfig } from "@/lib/schema";
import { createItemLayoutAtoms, resolveItemLayoutAtoms } from "./item-layout";

describe("atomic item layout", () => {
  it("repairs duplicate and unsupported fields without rendering content twice", () => {
    const atoms = createItemLayoutAtoms("experience", "split");
    const resolved = resolveItemLayoutAtoms("experience", {
      ...DEFAULT_ITEM_LAYOUT,
      atoms: [atoms[0], atoms[0], { ...atoms[0], field: "phone" }, ...atoms.slice(1)],
    });
    expect(resolved.filter((atom) => atom.field === "primary")).toHaveLength(1);
    expect(resolved.some((atom) => atom.field === "phone")).toBe(false);
  });
  it("紧凑预设把三个头部原子恰好装入 12 格", () => {
    const atoms = createItemLayoutAtoms("experience", "inline");
    expect(atoms.slice(0, 3).map((atom) => atom.field)).toEqual(["primary", "secondary", "date"]);
    expect(atoms.slice(0, 3).reduce((sum, atom) => sum + atom.span, 0)).toBe(12);
    expect(atoms.slice(0, 3).every((atom) => !atom.breakBefore)).toBe(true);
  });

  it("基本信息标准预设让长邮箱和主页在窄侧栏独占一行", () => {
    const atoms = createItemLayoutAtoms("basics", "split");
    expect(atoms.find((atom) => atom.field === "phone")).toMatchObject({
      span: 6,
      breakBefore: true,
    });
    expect(atoms.find((atom) => atom.field === "email")).toMatchObject({
      span: 12,
      breakBefore: true,
    });
    expect(atoms.find((atom) => atom.field === "url")).toMatchObject({
      span: 12,
      breakBefore: true,
    });
    expect(atoms.slice(3, 5).map((atom) => atom.field)).toEqual(["phone", "location"]);
  });

  it("标准预设让副信息显式开始新行", () => {
    const atoms = createItemLayoutAtoms("education", "split");
    expect(atoms.find((atom) => atom.field === "secondary")).toMatchObject({
      span: 12,
      breakBefore: true,
    });
  });

  it("旧版隐藏设置迁移为原子的 visible 状态", () => {
    const config: ItemLayoutConfig = {
      ...DEFAULT_ITEM_LAYOUT,
      hidden: ["date"],
    };
    expect(
      resolveItemLayoutAtoms("experience", config).find((atom) => atom.field === "date"),
    ).toMatchObject({ visible: false });
  });

  it("自定义顺序就是视觉和 PDF 阅读顺序", () => {
    const atoms = createItemLayoutAtoms("certificate", "inline");
    const config: ItemLayoutConfig = {
      ...DEFAULT_ITEM_LAYOUT,
      preset: "custom",
      atoms: [atoms[2], atoms[0], atoms[1], ...atoms.slice(3)],
    };
    expect(resolveItemLayoutAtoms("certificate", config).map((atom) => atom.field)).toEqual([
      "date",
      "primary",
      "secondary",
      "summary",
    ]);
  });
});
