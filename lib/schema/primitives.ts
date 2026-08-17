import { z } from "zod";

/**
 * 基础字段。刻意不用 z.string().email() / .url()：
 * 一是不同 zod 大版本对内置格式的 API 位置改过（v4 把它们提到了顶层），
 * 二是简历场景需要"允许留空"和中文报错，自己写正则反而更可控。
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)[^\s.]+\.[^\s]{2,}$/i;
/** 'YYYY' | 'YYYY-MM' */
const DATE_RE = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** 允许空字符串的可选字段：表单里用户清空后是 ""，不该报错 */
const optionalWith = (re: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || re.test(v), { message })
    .default("");

export const EmailField = optionalWith(EMAIL_RE, "邮箱格式不正确");
export const UrlField = optionalWith(URL_RE, "链接需要以 http:// 或 https:// 开头");
export const HexColor = z.string().regex(HEX_RE, "需要是 #RGB 或 #RRGGBB 格式的颜色");

/** 'YYYY' 或 'YYYY-MM'，允许留空 */
export const DateField = optionalWith(DATE_RE, "日期格式应为 2024 或 2024-06");

/** 结束时间：日期，或 'present' 表示至今 */
export const EndDateField = z.union([z.literal("present"), DateField]).default("");

export const NonEmpty = (label: string, max = 200) =>
  z.string().trim().min(1, `${label}不能为空`).max(max, `${label}不能超过 ${max} 个字符`);

export const Id = z.string().min(1);

export type Email = z.infer<typeof EmailField>;
export type DateStr = z.infer<typeof DateField>;
export type EndDate = z.infer<typeof EndDateField>;
