---
day: 04
date: 2026-08-17
phase: P1
hours: 2.0
status: done
commits: []
---

# Day 04 · 编辑器表单：声明式字段表 + 防抖输入

## 今日目标

- [x] 基本信息表单
- [x] 六类区块的条目编辑
- [x] highlights（bullet）列表编辑
- [x] 样式面板（模板 / 配色 / 字体 / 间距）

## 做了什么

- [`components/editor/debounced-field.tsx`](../../components/editor/debounced-field.tsx)：`TextField` / `TextAreaField` / `TagsField` / `DebouncedTextarea`
- [`components/editor/item-fields.ts`](../../components/editor/item-fields.ts)：**声明式字段表**
- [`components/editor/section-editor.tsx`](../../components/editor/section-editor.tsx)：条目增删改、上移下移、复制、显隐
- [`components/editor/design-panel.tsx`](../../components/editor/design-panel.tsx)：模板切换 + 主题 + 排版滑块
- [`components/editor/editor-panel.tsx`](../../components/editor/editor-panel.tsx)：折叠面板容器

## 决策

**D1. 表单字段用一张声明表驱动，不写六套 JSX。**

```ts
export const ITEM_FIELDS: Record<Exclude<SectionType, "summary">, FieldDef[]> = {
  experience: [
    { key: "company", label: "公司", kind: "text" },
    { key: "summary", label: "一句话概述", kind: "textarea", span: 2, aiWritable: true },
    …
  ],
  …
};
```

加一个字段 = 表里加一行，不动任何 JSX。而且 `aiWritable` 这个标记 P4 会直接复用——AI 面板读这张表就知道哪些字段可以交给模型改写，不用再维护第二份清单。

**D2. 左侧面板按简历上的实际阅读顺序排，不按对象 key 顺序。**

```ts
const orderedIds = flattenLayout(layout);
```

用户在预览里看到的顺序和在编辑器里找到的顺序必须一致，否则每次都要重新找。这也意味着 P2 拖拽换顺序时，左侧面板会跟着重排——是想要的行为。

**D3. 输入框全部受控于本地 state，停顿 200ms 才写 store。**
ADR-005 的第一条性能措施。直接受控于 store 的话，每敲一个字符触发一次全量 React 更新 + 预览重排。
两个细节：

- 外部值变化（撤销、AI 改写、导入）要能覆盖本地值，**但只在未聚焦时**，否则用户正在打字会被抢输入
- 失焦时立即提交，避免"改完就切走、200ms 内组件被卸载"导致丢字

## 踩坑

**坑 1：highlights 的输入框我一开始直接受控于 store 了。**
写完 `HighlightsField` 才反应过来——它是**全站输入频率最高的字段**（写经历要点就是在这里敲），却是唯一一个没走防抖的。等于 ADR-005 的措施在最该生效的地方失效了。
修法：补了一个无 label 的 `DebouncedTextarea`，走同一个 `useDebouncedValue` hook。
教训：**性能措施要按"用户在哪里花时间"来铺，不是按"组件数量"来铺。**

**坑 2：用 label 文本拼 `id`，两个区块同时展开就撞车。**

```ts
const inputId = id ?? `f-${label}`; // ← 有问题
```

"区块标题"这个 label 在每个区块的表单里都有一份。用户同时展开"工作经历"和"项目经历"，页面上就出现两个 `id="f-区块标题"`——`<label for>` 会关联到**第一个**输入框，点标签会聚焦到错误的框里。

排查方式：用浏览器的可访问性树读页面，发现几个输入框的可访问名不对，再回到 DOM 里验证：

```js
[...document.querySelectorAll("aside label")].map((l) => ({
  text: l.textContent,
  htmlFor: l.htmlFor,
}));
// → { text: "姓名", htmlFor: "f-姓名" }  ← 靠文本拼的
```

修法：`useId()`。React 生成的 id 全局唯一，SSR 和客户端也能对上。

**坑 3：好几个按钮没有可访问名。**
折叠按钮（内容是嵌套的 div）、模板卡片（内容是标题+描述两个 div）在可访问性树里都是 `button` 无名字——屏幕阅读器读出来就是"按钮"。补 `aria-label`：

```tsx
aria-label={`${expanded ? "收起" : "展开"}${title}`}
aria-label={`使用 ${template.name} 模板：${template.description}`}
```

P2 做拖拽时会有更硬的无障碍要求（键盘拖拽 + 语音播报），今天先把静态部分补齐。

## 数据

| 项           | 值                                    |
| ------------ | ------------------------------------- |
| 表单组件     | 6 个文件                              |
| 字段表覆盖   | 6 类区块 / 32 个字段                  |
| 输入防抖     | 200ms                                 |
| 可访问性修复 | 3 类（重复 id、按钮无名、label 关联） |

## 未解决 / 欠的债

1. 表单还没接 `react-hook-form` + `zodResolver`——目前是直接写 store，schema 校验只在导入/持久化边界跑。字段级即时错误提示还没有。装了依赖，P2 补。
2. `TagsField` 用顿号/逗号分隔，没做成 chip 交互。够用但不够好。
3. 照片目前只能填 URL，没有上传/裁剪。

## 明日

- [ ] A4 实时预览与溢出检测
- [ ] 性能基线埋点
