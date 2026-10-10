import { parseResume } from "@/lib/schema";
import type { ResumeData } from "@/lib/schema";

/**
 * 全项目的测试基准数据。
 *
 * 刻意包含三种"难看的真实情况"，后面每个阶段都靠它暴露问题：
 *  1. 一条弱开头、无量化的 highlight（P5 的 ATS 引擎必须扣它的分）
 *  2. 一条超长 highlight（P2 的分页算法必须处理它跨页）
 *  3. 中英混排 + 括号 + 百分号（P3 的 PDF 文本回读比对必须能对上）
 */
export const sampleResume: ResumeData = parseResume({
  basics: {
    name: "陈亦然",
    headline: "后端工程师 · Java / 分布式",
    email: "yiran.chen@example.com",
    phone: "138-0000-0000",
    location: "杭州",
    url: "https://github.com/example",
    photo: { url: "", visible: false, size: 88, rounded: false },
    customFields: [
      {
        id: "cf-github",
        icon: "github",
        label: "GitHub",
        value: "github.com/example",
        url: "https://github.com/example",
      },
      {
        id: "cf-blog",
        icon: "link",
        label: "博客",
        value: "blog.example.com",
        url: "https://blog.example.com",
      },
    ],
  },
  sections: {
    summary: {
      id: "summary",
      type: "summary",
      name: "个人简介",
      visible: true,
      columns: 1,
      content:
        "3 年后端开发经验，专注高并发交易系统。主导过日均 800 万订单的支付链路重构，将 P99 延迟从 420ms 降至 130ms。熟悉 JVM 调优与分布式事务，有从 0 到 1 的系统设计经验。",
    },
    experience: {
      id: "experience",
      type: "experience",
      name: "工作经历",
      visible: true,
      columns: 1,
      items: [
        {
          id: "exp-1",
          visible: true,
          company: "某电商科技有限公司",
          position: "后端开发工程师",
          location: "杭州",
          startDate: "2023-07",
          endDate: "present",
          summary: "交易中台，负责订单与支付链路",
          highlights: [
            "主导支付链路重构，引入本地消息表 + 定时补偿解决分布式事务一致性问题，将对账差异率从 0.3% 降至 0.002%",
            "负责订单系统的日常维护和需求开发", // ← 故意：弱动词开头、零量化，ATS 应扣分
            "针对大促场景设计多级缓存（Caffeine + Redis Cluster），配合热点探测与本地限流，把订单查询接口的 P99 从 420ms 优化到 130ms，大促期间峰值 QPS 承载 12000，全程无降级", // ← 故意超长，测分页与断行
          ],
          tech: ["Java", "Spring Boot", "MySQL", "Redis", "RocketMQ"],
          url: "",
        },
        {
          id: "exp-2",
          visible: true,
          company: "某互联网公司",
          position: "后端开发实习生",
          location: "上海",
          startDate: "2022-06",
          endDate: "2022-09",
          summary: "",
          highlights: ["独立完成内部权限系统的 RBAC 模型设计与落地，覆盖 4 个业务线共 200+ 接口"],
          tech: ["Java", "MyBatis"],
          url: "",
        },
      ],
    },
    project: {
      id: "project",
      type: "project",
      name: "项目经历",
      visible: true,
      columns: 1,
      items: [
        {
          id: "prj-1",
          visible: true,
          name: "分布式任务调度平台",
          role: "核心开发",
          startDate: "2024-03",
          endDate: "2024-08",
          summary: "支撑公司内部 300+ 定时任务的统一调度与可观测",
          highlights: [
            "基于时间轮 + Raft 实现调度器高可用，单集群支撑 3000 QPS 触发量，故障切换 < 2s",
            "设计分片广播执行模型，将千万级数据的对账任务耗时从 6 小时压缩到 25 分钟",
          ],
          tech: ["Java", "Netty", "etcd", "Prometheus"],
          url: "",
          repo: "https://github.com/example/scheduler",
        },
      ],
    },
    education: {
      id: "education",
      type: "education",
      name: "教育经历",
      visible: true,
      columns: 1,
      items: [
        {
          id: "edu-1",
          visible: true,
          school: "某大学",
          degree: "本科",
          major: "计算机科学与技术",
          location: "南京",
          startDate: "2019-09",
          endDate: "2023-06",
          score: "GPA 3.7/4.0，专业前 10%",
          highlights: [],
          url: "",
        },
      ],
    },
    skill: {
      id: "skill",
      type: "skill",
      name: "专业技能",
      visible: true,
      columns: 1,
      items: [
        { id: "sk-1", visible: true, name: "语言", keywords: ["Java", "Go", "SQL"], level: 4 },
        {
          id: "sk-2",
          visible: true,
          name: "框架",
          keywords: ["Spring Boot", "MyBatis", "Netty"],
          level: 4,
        },
        {
          id: "sk-3",
          visible: true,
          name: "中间件",
          keywords: ["Redis", "RocketMQ", "Elasticsearch"],
          level: 3,
        },
        {
          id: "sk-4",
          visible: true,
          name: "工程化",
          keywords: ["Docker", "K8s", "Prometheus", "CI/CD"],
          level: 3,
        },
      ],
    },
    certificate: {
      id: "certificate",
      type: "certificate",
      name: "证书与奖项",
      visible: true,
      columns: 1,
      items: [
        {
          id: "cert-1",
          visible: true,
          name: "全国大学生程序设计竞赛 银奖",
          issuer: "ICPC",
          date: "2021-11",
          summary: "",
          url: "",
        },
      ],
    },
  },
  layout: [
    [
      ["summary", "experience", "project"],
      ["basics", "skill", "education", "certificate"],
    ],
  ],
  metadata: {
    template: "modern",
    itemLayouts: {},
    page: { format: "a4", margin: 16, showPageNumbers: false, columnRatio: 0.66 },
    theme: { primary: "#2563eb", text: "#18181b", muted: "#71717a", background: "#ffffff" },
    typography: {
      fontFamily: "Noto Sans SC",
      fontSize: 10.5,
      lineHeight: 1.5,
      sectionGap: 12,
      itemGap: 8,
    },
    locale: "zh-CN",
    css: { visible: false, value: "" },
  },
});
