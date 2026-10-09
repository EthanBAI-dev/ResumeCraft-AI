# facts.json 字段约定

这是 Skill 的中间格式，不直接导入网站。运行脚本得到 `*.resumecraft.json` 后再导入。所有字段可省略；省略表示未知/没有内容，不是让模型猜测。字符串不能用 null，列表不能用逗号拼接的字符串替代。未知字段会报错，避免看似导入成功却丢数据。

| 顶层字段    | 类型 / 可用子字段                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| basics      | 对象：name、headline、email、phone、location、url；customFields 为对象数组，每项 label、value、url                     |
| summary     | 个人简介字符串                                                                                                         |
| experience  | 数组；每项 company、position、location、startDate、endDate、summary、highlights（字符串数组）、tech（字符串数组）、url |
| project     | 数组；每项 name、role、startDate、endDate、summary、highlights、tech、url、repo                                        |
| education   | 数组；每项 school、degree、major、location、startDate、endDate、score、highlights、url                                 |
| skill       | 数组；每项 name、keywords（字符串数组）、level（0–5 整数，默认 0 不显示，非原文明确等级不填）                          |
| certificate | 数组；证书/奖项，每项 name、issuer、date、summary、url                                                                 |
| custom      | 数组；每项 name（区块名）、items（条目数组）；条目 name、subtitle、startDate、endDate、summary、highlights、url        |
| review      | 待核对事项字符串数组，不进入简历正文，仅写入报告                                                                       |

日期用 `YYYY`、`YYYY-MM` 或空字符串，结束日期还允许 `present`（原文明确至今）。有具体日时简历只显示年月，把原日期留在 review；模糊时间如“毕业后”不要编成日期。链接只接受完整 HTTP(S) URL；不要为猜测的用户名构造地址。未能确认的邮箱保留原文并提醒，不纠正成另一个人的邮箱。长要点不截断，脚本提醒后由用户决定拆分或缩短。

同一段经历的任务分别放在 highlights。不要把“负责 X”改成“主导 X”，不要计算来源未给的提升百分比。多段经历按来源顺序保留，用户要求排序时再调整。

以下是完全虚构的格式示例，不可当作用户数据：

```json
{
  "basics": { "name": "示例用户", "headline": "后端开发", "email": "demo@example.com" },
  "experience": [
    {
      "company": "示例公司",
      "position": "开发工程师",
      "startDate": "2023",
      "endDate": "present",
      "highlights": ["参与内部工具维护。"],
      "tech": ["Java"]
    }
  ],
  "education": [{ "school": "示例大学", "startDate": "2019", "endDate": "2023" }],
  "custom": [
    { "name": "志愿活动", "items": [{ "name": "社区活动", "summary": "协助现场登记。" }] }
  ],
  "review": ["原文未提供手机号，已留空。"]
}
```

脚本输出单栏、经典模板的初始布局，照片关闭、无自定义 CSS、无 AI Key。内容长度可能触发网站自动分页；不为了凑一页删除经历。用户可在网站切换六种模板、调整字段十二格排版。原生草稿允许保留未完成信息，正式投递前仍要校对。
