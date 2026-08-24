import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { DEFAULT_ITEM_LAYOUT } from "@/lib/schema";
import { createItemLayoutAtoms } from "@/lib/layout/item-layout";
import { BasicsBlock, SectionBlock } from "./blocks";

describe("SectionBlock item layout", () => {
  it("应用紧凑布局并只隐藏日期呈现，不删除其他内容", () => {
    const section = sampleResume.sections.experience;
    if (section.type !== "experience") throw new Error("示例缺少工作经历");

    const html = renderToStaticMarkup(
      <SectionBlock
        section={section}
        locale="zh-CN"
        itemLayouts={{
          experience: {
            preset: "inline",
            atoms: [],
            primaryWidth: 52,
            dateWidth: 22,
            hidden: ["date"],
          },
        }}
      />,
    );

    expect(html).toContain('data-layout="inline"');
    expect(html).not.toContain('data-item-slot="date"');
    expect(html).toContain("某电商科技有限公司");
    expect(html).toContain("后端开发工程师");
    expect(html).toContain("交易中台，负责订单与支付链路");
  });
});

describe("BasicsBlock atomic layout", () => {
  it("基本信息字段顺序与原子数组一致，空照片不占格", () => {
    const atoms = createItemLayoutAtoms("basics", "split");
    const phoneIndex = atoms.findIndex((atom) => atom.field === "phone");
    const [phone] = atoms.splice(phoneIndex, 1);
    atoms.unshift(phone);

    const html = renderToStaticMarkup(
      <BasicsBlock
        basics={sampleResume.basics}
        layout={{ ...DEFAULT_ITEM_LAYOUT, preset: "custom", atoms }}
      />,
    );

    expect(html.indexOf('data-item-slot="phone"')).toBeLessThan(
      html.indexOf('data-item-slot="primary"'),
    );
    expect(html).not.toContain('data-item-slot="photo"');
    expect(html).toContain('data-item-slot="url"');
  });
});
