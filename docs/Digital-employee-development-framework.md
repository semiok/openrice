# 数字员工开发框架

> **定位：** 本文是 OpenRice 数字员工模块的权威开发框架。后续 Codex、M5、lindong 以及新增协作者在设计或开发数字员工时，必须先阅读并遵循本文。
> **相关文档：** [SkillHub 开发框架](<https://linear.app/metasnowsky/document/skillhub-%E5%BC%80%E5%8F%91%E6%A1%86%E6%9E%B6-0615b46230cf>) · [OpenRice 开发协作方式](<https://linear.app/metasnowsky/document/openrice-%E5%BC%80%E5%8F%91%E5%8D%8F%E4%BD%9C%E6%96%B9%E5%BC%8F-c5fe29dfa7de>)
> **最近核对：** 2026-08-03 EDT

# 一、产品关系

```text
OpenLoomi（开源技术上游）
        ↓
OpenRice（独立 fork、产品开发与技术验证环境）
```

OpenRice 直接跟随 OpenLoomi 上游，在保持内部兼容的前提下，独立建设品牌层、SkillHub、数字员工、任务、Memory、Connector、权限和审计能力。

上游同步与 OpenRice 自有能力必须分层管理：上游更新进入独立同步分支；OpenRice 的品牌覆盖和自有模块通过清晰边界持续维护，避免同步时互相覆盖。

# 二、核心概念

## 2.1 SkillHub

SkillHub 是数字员工的能力市场和工具箱。

一个 Skill 表示一种可复用能力，例如论文检索、专利分析、数据清洗、报告生成或调用 TN-Alpha。Skill 不代表一个长期岗位，也不直接拥有企业数据、人员权限和长期记忆。

## 2.2 科研数字员工

科研数字员工是一个可版本化、可授权、可运行和可审计的岗位 Agent。它由多个部分组合而成：

```text
岗位与使命
+ 模型与运行时
+ Skill / Workflow
+ 数据范围
+ Connector / MCP
+ Memory 范围
+ 权限与审批
+ 定时任务
+ 产出规范
+ 版本与审计
```

## 2.3 EmployeeHub

产品模块名称建议使用“科研员工”，技术层可称 `EmployeeHub`。

EmployeeHub 负责创建、配置、发布、运行和管理数字员工；不重新实现模型、Skill、Memory 或 Connector，而是对现有底层能力进行组合与治理。

## 2.4 Employee Run

每次人工指派、定时运行或 Loop 触发都生成一个独立 Employee Run。Run 必须记录输入、执行步骤、模型、Skill、工具、数据来源、审批、产物、耗时、费用、状态和错误。

# 三、设计原则

 1. **岗位与能力分离：** 员工选择 Skill，但 Skill 不等于员工。
 2. **能力与数据分离：** 论文、专利、实验、配方和项目资料属于数据层，不打包进 Skill。
 3. **配置而非写死：** 岗位、Prompt、模型、技能、数据、权限和审批均通过 Manifest 配置。
 4. **默认最小权限：** 新员工默认没有外部写入、发布、删除或跨项目读取权限。
 5. **所有关键动作可审计：** 模型、Prompt 版本、数据来源、工具调用和人工批准必须留痕。
 6. **先单员工，再多员工：** MVP 不做自动多 Agent 编排，先保证单个岗位可靠、可控。
 7. **人类保留最终责任：** 发布、外部写入、高风险结论和敏感数据导出默认需要人工确认。
 8. **支持私有化：** 模型、数据、向量库、凭证和运行日志可以完全留在企业内网。
 9. **可版本化和回滚：** 员工配置修改不能直接影响生产版本。
10. **证据优先：** 科研结论必须能够追溯到原始资料、实验数据或明确推理过程。

# 四、Research Employee Manifest

每个科研数字员工使用稳定 ID 和版本化 Manifest。建议结构：

```yaml
id: research-intelligence-analyst
name: 科技情报研究员
title: 科技情报研究员
version: 1.0.0
status: draft

mission: 持续追踪新材料论文、专利、产业动态和竞争技术路线
instructions:
  system_prompt: prompts/research-intelligence.md
  output_contract: evidence-report-v1

runtime:
  provider: enterprise
  model: research-model
  fallback_model: null
  reasoning_level: high

skills:
  - paper-search
  - patent-analysis
  - data-analysis
  - research-report

workflows:
  - weekly-technology-radar

data_scope:
  organization_ids: []
  project_ids: []
  knowledge_spaces: []
  sensitivity_levels:
    - public
    - internal

memory_scope:
  employee_shared: true
  user_private: true
  project_memory: true
  cross_project: false

connectors:
  - enterprise-knowledge
  - patent-database
  - literature-database

permissions:
  read: []
  write: []
  export: false
  delete: false

approval:
  external_write: required
  publish_report: required
  sensitive_export: required

schedule:
  enabled: false
  jobs: []

ownership:
  owner_team: research
  maintainers: []

audit:
  retain_runs: true
  record_model: true
  record_sources: true
  record_tool_calls: true
```

Manifest 是接口契约。UI、API、数据库和运行时必须围绕同一份结构，不分别维护互相漂移的字段。

# 五、系统分层

```text
EmployeeHub UI
  ├── 员工目录与模板
  ├── 创建/编辑/发布
  ├── 指派任务
  ├── 运行与产出
  └── 审计与版本

Employee Orchestration Layer
  ├── Manifest 解析
  ├── 权限计算
  ├── 上下文组装
  ├── Skill/Workflow 调度
  ├── 审批与状态机
  └── Run 记录

OpenLoomi / OpenRice 基础能力
  ├── Agent Runtime
  ├── SkillHub
  ├── Connector / MCP
  ├── Memory / RAG
  ├── Task / Loop
  ├── Decision Card
  └── Audit Log
```

EmployeeHub 是新的组合与治理层，不复制底层模块。

# 六、数据与记忆隔离

科研数字员工至少有三层记忆：

1. **员工公共记忆：** 该岗位经过批准、可供所有授权用户复用的经验。
2. **用户私有记忆：** 同一员工服务不同用户时形成的个人上下文，互相隔离。
3. **项目记忆：** 仅限指定研发项目，默认禁止跨项目读取。

每次上下文组装都必须同时校验：

* 当前登录用户；
* 数字员工权限；
* 项目成员身份；
* 数据密级；
* Connector 授权；
* 运行目的和审批状态。

禁止把所有 Memory 拼进 Prompt。必须先按权限过滤，再做检索和上下文压缩。

# 七、凭证与权限

* 数字员工不能读取 API Key、数据库密码或 Connector token。
* 凭证由系统集中保管，员工只能请求执行被授权的工具动作。
* 权限按“用户权限 ∩ 员工权限 ∩ 项目权限 ∩ 数据密级”计算。
* 读取、写入、导出、删除和发布分别授权。
* 外部写入、敏感数据导出和正式发布默认需要 Decision Card 人工批准。
* 权限拒绝必须有清晰原因并写入 Audit Log。

# 八、版本与发布

数字员工采用以下生命周期：

```text
Draft → Testing → Published → Deprecated → Archived
```

规则：

* Draft 可以编辑，不向普通用户开放。
* Testing 使用测试数据和测试权限，不写生产系统。
* Published 是用户实际调用的固定版本。
* 每次发布生成版本号、配置快照、Diff、测试结果和发布人。
* 已发布版本不可原地覆盖；修改后生成新版本。
* 支持一键回滚到上一个已发布版本。
* Manifest、Prompt、Skill、Workflow、权限和数据范围变化都进入 Diff。

# 九、Employee Run 状态

建议状态：

```text
queued
→ preparing_context
→ running
→ awaiting_approval
→ completed

异常分支：
failed / canceled / timed_out
```

每次 Run 至少保存：

* employee_id 与 employee_version；
* objective 和输入附件；
* user_id、project_id、触发方式；
* provider、model、Prompt 版本；
* 使用的 Skill、Workflow、Connector；
* 引用资料和证据；
* 工具调用与审批；
* 输出文件和结构化结果；
* token、成本、耗时；
* 错误、重试与最终状态。

# 十、产品界面

左侧增加一级模块 **“科研员工”**。

## 员工目录

* 展示已发布、草稿和停用员工。
* 支持按岗位、部门、技能和状态筛选。
* 显示当前任务数、最近产出和异常状态。
* 提供员工模板，但创建后仍需配置权限和数据范围。

## 员工详情

建议使用以下 Tab：

* 概览：岗位、使命、负责人和当前版本。
* 技能：从 SkillHub 选择 Skill 和 Workflow。
* 数据：绑定知识空间、项目和数据密级。
* 任务：人工指派、定时任务和当前队列。
* 记忆：员工公共、用户私有和项目记忆。
* 产出：报告、表格、分析、文件和证据。
* 运行：Run 状态、耗时、模型、费用和错误。
* 审计：工具调用、审批、版本和敏感操作。
* 设置：模型、权限、凭证策略和发布流程。

## 指派任务

点击“指派任务”后：

1. 选择项目和任务目标；
2. 上传或选择资源库资料；
3. 显示员工将使用的技能、数据范围和模型；
4. 创建独立 Run 和工作区；
5. 执行中展示状态；
6. 需要批准时生成 Decision Card；
7. 完成后产物进入资源库，并回写授权 Memory。

# 十一、首批员工模板

## 科技情报研究员

* 追踪论文、专利、竞争企业和技术路线；
* 生成每日/每周技术雷达；
* 输出来源、证据等级和风险提示。

## 材料研究员

* 阅读内部资料、实验和检测数据；
* 比较材料、配方、性能和证据；
* 不替代人工签署正式研发结论。

## 研发项目助理

* 整理会议、实验进度、待办和阶段产出；
* 维护项目记忆；
* 定期生成项目报告和风险清单。

## 专利分析员

* 专利检索、权利要求对比、技术空白和风险提示；
* 输出仅供研究参考，正式法律结论需人工审核。

# 十二、MVP 范围

第一版只实现：

 1. 创建、编辑和查看科研数字员工；
 2. 绑定 SkillHub 技能；
 3. 配置模型、数据范围、Memory 和权限；
 4. 从员工页面人工指派任务；
 5. 每个任务生成独立 Employee Run；
 6. 展示运行状态、产物、模型和证据；
 7. 产物进入资源库；
 8. 外部写入与发布必须人工批准；
 9. Manifest 版本化并支持发布和回滚；
10. 提供三个可运行员工模板。

第一版明确不做：

* 数字员工自动招聘或自我复制；
* 多员工自动组织和无限递归委派；
* 未经审批的外部写入；
* 跨项目默认共享 Memory；
* 让模型自行提升权限；
* 复杂绩效考核或薪酬拟人化。

# 十三、后续阶段

## 第二阶段

* Task/Loop 定时与事件触发；
* 员工公共经验沉淀；
* 运行统计、成本和质量评估；
* 企业内部系统连接器；
* 可配置 Workflow。

## 第三阶段

* 首席研究员拆解任务并委派给多个员工；
* 员工间结构化交接；
* 多结论对照和证据冲突检测；
* 人工评审门与阶段性验收。

多员工协作必须基于明确 DAG、最大深度、预算、超时和审批策略，不允许无界自主循环。

# 十四、开发与协作规则

* 所有数字员工相关开发必须关联 Linear issue。
* 开工前阅读本文和《OpenRice 开发协作方式》。
* SkillHub、EmployeeHub、Memory、Connector 和权限分别保持清晰边界。
* 数据结构调整先更新 Manifest 契约，再修改 UI/API/数据库。
* 不把客户名称、员工名称、项目 ID 或模型写死在通用 Prompt。
* 不修改 OpenLoomi 内部兼容标识，除非存在独立迁移 issue。
* 每个 PR 写明是否影响 Manifest、数据迁移、权限、Memory、审计和回滚。
* UI 改动提供截图；运行时改动提供真实 Run 记录；权限改动提供允许与拒绝两类测试。
* Codex 负责架构、PR review、最终合并 `main`、版本与部署；M5 和 lindong 是同级实现者，只按独立 issue 和分支开发、验证并提交 PR，不自行合并 `main` 或发布。

# 十五、与飞书 Aily 的参考关系

飞书 Aily 自定义智能体采用了类似结构：管理员配置角色与 Prompt，关联企业知识，接入 Skill、Workflow、MCP 和业务系统，并提供记忆隔离、中心化凭证、定时任务、权限、运行日志、审计、发布 Diff 与回滚。

OpenRice 借鉴其企业治理逻辑，但重点强化：

* 科研数据和证据链；
* 论文、专利、实验、配方和检测数据；
* 私有模型与内网算力；
* 项目和密级隔离；
* 模型与结论来源留痕；
* 科研 SOP、评审和阶段交付。

官方参考：

* [飞书 Aily 自定义智能体](<https://www.feishu.cn/content/article/7631864469689240764>)
* [飞书 Aily 企业级 Agent 平台](<https://www.feishu.cn/content/article/7576921890476788922>)
* [飞书 Aily 技能说明](<https://www.feishu.cn/content/s855fpkr>)
* [飞书 Aily 开发与管理能力](<https://www.feishu.cn/content/ap8ie3h2>)

# 十六、最终定义

> SkillHub 管能力，科研员工管岗位，任务中心管工作，资源库管数据，Memory 管经验，审计中心管责任。

> EmployeeHub 是 OpenRice 在 OpenLoomi 基础上建设的核心自有模块。

