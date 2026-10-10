"use client";
import { t, useLanguage } from "@/lib/i18n";
import Link from "next/link";
import { LanguageSwitch } from "@/components/editor/language-switch";
export default function PrivacyPage() {
  useLanguage();
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <LanguageSwitch />
      <Link href="/builder" className="text-primary underline">
        {t("返回编辑器")}
      </Link>
      <h1 className="text-3xl font-semibold">{t("隐私与本地数据说明")}</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-medium">{t("免费、本地优先")}</h2>
        <p>
          {t(
            "无需注册、付费或关注作者即可使用编辑与导出。简历库和导入照片存于当前浏览器的 IndexedDB，不提供云端同步。清除站点数据、无痕会话结束或存储回收可能导致丢失，请定期逐份导出 JSON 备份。删除简历需要确认，删除后不能撤销。",
          )}
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-medium">{t("可选 AI")}</h2>
        <p>
          {t(
            "使用自己的 DeepSeek API Key，模型费用由你的账户承担。Key 只放在当前页面内存，刷新后清除，不包含在简历、IndexedDB 或导出文件中。点击生成时，Key、所选内容、目标岗位和可选 JD 会经本站后端转发到 DeepSeek 官方接口；应用不持久保存密钥，不记录正文或密钥日志。请自行了解模型服务商的数据政策。本站后端仍会在处理请求时接触密钥，并非端到端不可见。",
          )}
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-medium">{t("照片、检查与导出")}</h2>
        <p>
          {t(
            "上传照片在浏览器内解码、压缩；虚构示意头像仅用于预览。投递前检查使用本地规则，不打招聘分、不预测 ATS 通过率。Word、JSON 和系统打印在本机完成。若自托管者配置了 PDF Worker，高保真 PDF/PNG 会把简历 HTML（含照片）发送到该 Worker。JSON 备份含完整个人资料，请妥善保管。",
          )}
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-medium">{t("托管与外部链接")}</h2>
        <p>
          {t(
            "托管平台可能处理请求 IP、时间和常规访问日志。关注作者与 Star 均为自愿，不会阻止导出。打开外部链接或加载导入文件中的远程照片时，相关站点可能获得请求信息；优先使用本地上传照片。",
          )}
        </p>
      </section>
    </main>
  );
}
