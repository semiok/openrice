# SkillHub 开发框架

> 定位：本文是 OpenRice SkillHub 的权威开发框架。后续涉及技能发现、创建、安装、发布、版本、安全、权限、运行和数字员工绑定的设计与开发，必须先阅读并遵循本文。
>
> 相关规范：Linear《数字员工开发框架》与《OpenRice 开发协作方式》。
>
> 最近核对：2026-08-03 EDT；OpenRice `origin/main@a4951b4`。

## 一、产品定义

SkillHub 不是单纯的技能卡片页面，而是 OpenRice 的能力资产平台：

```text
经验 / Prompt / SOP / 脚本 / Workflow
                ↓
           标准 Skill
                ↓
创建 → 测试 → 扫描 → 审核 → 发布
                ↓
发现 → 安装 → 绑定 → 调用 → 度量
                ↓
反馈 → 更新 → 回滚 → 下架
```

SkillHub 负责把分散在个人、团队和开源社区中的工作方法，沉淀为可安装、可审核、可分发、可度量、可版本化的能力资产。

## 二、模块边界

### SkillHub

SkillHub 管理“能力”：

- Skill 的创建、导入、发现和分类；
- 版本、发布、审核、更新和回滚；
- 安装、卸载、启用、禁用和收藏；
- 依赖、权限、安全扫描和兼容性；
- 调用记录、成功率、使用量和质量反馈。

### 常用技能

“常用技能”是已安装 Skill 的个人快捷入口，不承担市场、版本和治理功能：

- 所有技能默认不加入常用；
- 用户主动打开“常用技能”开关后显示；
- 禁用或删除 Skill 后不再显示；
- 重启后保留设置；
- 状态使用稳定 Skill ID 保存。

### 数字员工

数字员工管理“岗位”，从 SkillHub 选择经过批准的能力：

- 数字员工不复制 Skill 内容；
- 生产员工默认绑定明确的 Skill 版本；
- 员工权限、项目权限和 Skill 声明权限共同决定实际可执行范围；
- Skill 更新不能绕过数字员工版本和审批流程。

### 资源库与 Memory

- 资源库管理文档、数据、报告和附件，不承载 Skill 代码。
- Memory 管理经验和上下文，不等于 Skill。
- Skill 可以声明需要哪些数据类型，但不能把客户资料、项目数据或凭证写进技能包。

## 三、用户角色

### 使用者

- 浏览、搜索和筛选 Skill；
- 查看详情、示例、安全说明和权限；
- 安装到个人空间或添加给数字员工；
- 在对话中通过 `+`、`/` 或自然语言调用；
- 收藏、评分和提交问题反馈。

### 技能作者

- 从模板、文件上传、Git 或对话创建 Skill；
- 编辑 `SKILL.md`、元数据、示例和测试；
- 在沙箱中调试；
- 提交发布并查看扫描、评估和审核结果；
- 发布新版本并维护更新说明。

### 管理员

- 审核企业技能；
- 调整可见范围和可用范围；
- 查看安全扫描和质量评估；
- 上架、拒绝、下架或冻结 Skill；
- 配置网络出口、Connector 和敏感权限策略；
- 查看使用、失败、成本和贡献统计。

## 四、Skill 分类

### 按来源

- OpenRice 官方：随产品维护并通过官方验证。
- 企业专属：企业内部创建，只对授权成员开放。
- 个人技能：用户自己的草稿或私有 Skill。
- 审核开源：从开源仓库引入并完成安全审核。

MVP 不建设公开社区交易市场，优先完成企业内部 SkillHub。

### 按能力形态

- Instruction Skill：以 `SKILL.md`、Prompt、规范和参考资料为主。
- Tool Skill：封装本地脚本、API、Connector 或 MCP 工具。
- Workflow Skill：明确节点、条件、数据转换和输出契约的确定性流程。
- Skill Pack：面向一个场景组合多个 Skill，例如“行业研究技能包”。

Skill Pack 只是安装和分发组合，不改变各 Skill 的独立版本、权限和运行记录。

## 五、技能包契约

继续兼容现有 Agent Skill 的 `SKILL.md`，平台治理信息使用独立 Manifest，避免把本地状态写回技能源码。

```text
skill-id/
├── SKILL.md
├── skill.json
├── prompts/
├── scripts/
├── references/
├── examples/
├── tests/
└── README.md
```

### SKILL.md

负责 Agent 运行时指令：何时触发、如何执行、输入输出要求、工具使用方法、失败和澄清策略。

### skill.json

建议结构：

```json
{
  "id": "patent-analysis",
  "name": "专利分析",
  "version": "1.0.0",
  "publisher": "openrice",
  "license": "internal",
  "categories": ["research", "patent"],
  "visibility": "enterprise",
  "runtime": {
    "supportedAgents": ["codex", "claude"],
    "platforms": ["darwin", "linux"]
  },
  "entry": "SKILL.md",
  "permissions": {
    "filesystem": "workspace-read",
    "network": ["patents.example.com"],
    "connectors": ["patent-database"],
    "shell": false,
    "externalWrite": false
  },
  "dependencies": {
    "skills": [],
    "mcpServers": [],
    "executables": []
  },
  "approval": {
    "externalWrite": "required",
    "sensitiveExport": "required"
  }
}
```

Manifest 是市场、安装、安全和运行时共同使用的接口契约。禁止 UI、API 和运行器分别维护不同字段。

## 六、状态与生命周期

```text
Draft → Testing → Pending Review → Published → Deprecated → Archived
```

异常状态：`Rejected / Quarantined / Disabled`。

- Draft 可以编辑，只对作者可见。
- Testing 只使用沙箱和测试凭证。
- Pending Review 不允许修改；修改后重新生成提交版本。
- Published 版本不可原地覆盖。
- 新版本必须重新扫描，并展示版本 Diff。
- Deprecated 可以继续服务已绑定用户，但禁止新安装。
- Quarantined 立即停止调用，用于严重安全风险。
- 所有发布、拒绝、回滚和下架操作写入审计日志。

## 七、发现与安装模型

SkillHub 必须区分三个对象：

```text
Catalog Skill     市场中的技能身份
Skill Version     不可变的发布版本
Installation      某用户、项目或数字员工的安装关系
```

安装目标包括个人工作区、指定项目、指定数字员工和企业默认安装集。

安装记录至少保存：

- `skill_id` 和 `version`；
- `target_type` 和 `target_id`；
- `installed_by` 和 `installed_at`；
- `enabled`、`favorite`；
- `permission_grants`；
- `update_policy`；
- `pinned_version`。

企业和数字员工生产环境默认固定版本；个人技能可选择自动安装兼容补丁版本。

## 八、搜索与市场页面

左侧一级模块使用 SkillHub，页面包含：

- 市场；
- 已安装；
- 企业专属；
- 我的发布；
- 管理后台（仅管理员可见）。

市场首页包括官方精选、企业推荐、技能包、最近更新、分类浏览、搜索和筛选。

筛选维度包括场景与分类、来源、可见范围、Skill 类型、运行时兼容性、Connector、权限风险、安装状态、更新时间和使用热度。

排名不能只按调用量，应综合安装量、成功率、用户反馈、更新时间和安全等级。

## 九、技能详情

每个 Skill 详情至少展示：

- 名称、简介、作者、来源和当前版本；
- 适用场景和不适用场景；
- 示例指令、输入输出和结果示例；
- 依赖的 Skill、MCP、Connector 和 executable；
- 文件、网络、Shell、外部写入和敏感导出权限；
- 安全扫描和质量评估报告；
- 版本记录、Diff、更新说明和回滚点；
- 安装量、调用量、成功率、平均耗时和失败原因；
- 安装到个人或添加给数字员工的操作。

## 十、创建与发布

创建入口：上传包含 `SKILL.md` 的目录或 ZIP、从 Git 导入、通过 `/skill-creator` 对话创建、从企业模板复制、将一次成功工作流沉淀为 Skill 草稿。

```text
结构校验
→ 依赖解析
→ Secret 扫描
→ 脚本与危险命令扫描
→ 网络域名检查
→ 权限风险评估
→ 测试用例
→ 质量评估
→ 人工审核
→ 发布签名
```

重大风险直接拦截；一般风险必须在详情和审核页明确展示。

## 十一、安全与权限

Skill 包内禁止保存 API Key、Token、密码、客户或项目敏感数据、用户凭证和未声明的远程下载地址。

```text
用户权限
∩ 安装授权
∩ 数字员工权限
∩ Skill 声明权限
∩ 项目数据权限
∩ 企业安全策略
```

重点检查路径穿越、任意文件读写、Shell 注入、危险命令、未声明公网访问、动态下载安装、敏感数据外传、Connector 过度授权和 Prompt 注入。

外部写入、删除、发布、付款和敏感导出默认需要人工审批。

## 十二、运行与路由

Skill 可以由用户在对话中显式选择、Agent 根据意图自动选择、数字员工按 Manifest 调用、Workflow 节点调用，或由 Task / Loop 触发。

自动选择 Skill 时必须确认：

- 已安装并启用；
- 运行时兼容；
- 用户和项目有权限；
- 所需 Connector 在线；
- 风险操作可以获得审批；
- Skill 描述与任务匹配。

重要任务应记录选择理由；禁止自动安装后直接执行高风险 Skill。

## 十三、运行记录与度量

每次 Skill 调用生成 Skill Run，至少保存：

- `skill_id`、版本和安装目标；
- `user_id`、`employee_id`、`project_id`；
- 触发方式和路由原因；
- runtime、provider 和 model；
- 输入摘要和输出产物；
- Connector、工具和权限使用；
- 审批过程；
- 状态、token、费用、耗时、错误和重试；
- 用户评价和纠正记录。

SkillHub 可以基于 Run 数据建议更新、合并、回滚或下架，但不能绕过作者和管理员自动发布新版本。

## 十四、数据模型建议

核心表：

- `skills`
- `skill_versions`
- `skill_artifacts`
- `skill_dependencies`
- `skill_permissions`
- `skill_installations`
- `skill_reviews`
- `skill_security_reports`
- `skill_runs`
- `skill_feedback`
- `skill_packs`
- `skill_pack_items`

本地桌面端可以先使用 SQLite；后续企业多用户部署由服务端 Registry 作为权威源，本地保存安装缓存和离线运行数据。

## 十五、OpenRice 当前实现与迁移

当前已有能力：

- `apps/web/app/(chat)/skills/page.tsx`：技能页面；
- `apps/web/components/skills-panel.tsx`：技能卡片、启停和删除；
- `apps/web/app/api/workspace/skills/route.ts`：扫描三个本地技能目录；
- `apps/web/app/api/workspace/skills/upload/route.ts`：本地目录和 ZIP 导入；
- `apps/web/app/api/workspace/skills/toggle/route.ts`：启用/禁用；
- `apps/web/app/api/workspace/skills/metadata/route.ts`：头像等本地元数据；
- 对话输入框已经支持技能选择。

当前实现属于本地技能管理器，尚缺 Registry、版本、安装关系、审核、安全、权限和运行统计。

迁移原则：

1. 保留现有三个技能目录和 `SKILL.md` 兼容能力。
2. 新增 Skill Registry 和安装层，不一次重写运行器。
3. 把 `enabled`、`favorite` 等用户状态迁出 `SKILL.md`，存入安装记录或数据库。
4. 已有本地技能首次扫描时注册为本地私有 Skill。
5. 市场安装后仍落到运行器可读取的本地缓存目录。
6. 通过稳定 Skill ID 和版本校验解决同名覆盖问题。
7. 删除动作优先卸载，不直接删除市场资产。

## 十六、MVP

第一版实现：

1. Skill Registry 与稳定 ID；
2. 市场、已安装、企业专属、我的发布；
3. Skill 详情和分类搜索；
4. 本地、ZIP、Git 和对话创建入口；
5. 个人与数字员工安装关系；
6. 启用、禁用、收藏和卸载；
7. Manifest、版本、更新和回滚；
8. 基础依赖检查、Secret 扫描和权限报告；
9. 草稿、测试、审核、发布和下架；
10. Skill Run 及基础成功率、耗时、错误统计；
11. M5 的“常用技能”页面消费安装层中的 `favorite` 状态。

MVP 暂不做公开交易和付费市场、自由上传后直接全企业发布、自动执行未审核开源代码、复杂推荐算法、自动发布 Skill，以及无界 Skill 链式递归。

## 十七、后续阶段

第二阶段：Skill Pack、企业默认技能集、Git 自动同步、完整安全沙箱、质量评测集、对话式管理和场景推荐。

第三阶段：企业间私有分发、签名与供应链验证、内网 Skill Registry、贡献分析、跨 Agent 导出和从高质量 Run 建议沉淀 Skill。

## 十八、协作与验收

- 所有 SkillHub 开发必须关联 Linear issue。
- 开工前阅读本文、《数字员工开发框架》和《OpenRice 开发协作方式》。
- M5 与 lindong 是同级实现者，只负责独立分支开发、验证和提交 PR。
- Codex 负责架构边界、PR 检查、最终合并 `main`、版本、发布和部署。
- Skill 数据结构调整先更新 Manifest 契约。
- 权限变化必须提供允许和拒绝测试。
- 发布链路必须有失败状态、回滚方案和审计记录。
- UI 改动提供截图；运行时改动提供真实 Skill Run。
- 不把客户、项目、凭证或模型写死在通用 Skill 中。
- 不修改 OpenLoomi 内部兼容标识，除非存在独立迁移 issue。

## 十九、官方参考

- [飞书 Aily SkillHub 使用指南](https://www.feishu.cn/content/article/7646699294103292898)
- [飞书 Aily Agent 技能](https://www.feishu.cn/content/51zo70vs)
- [飞书 Aily Workflow 技能](https://www.feishu.cn/content/8u02e8ub)
- [飞书 Aily 应用场景与混合调度](https://www.feishu.cn/content/0vi1z25i1)
- [飞书 Aily 应用发布](https://www.feishu.cn/content/kjtmg83u)

## 二十、最终定义

> SkillHub 管能力资产；常用技能管个人快捷入口；数字员工管岗位；任务中心管工作；资源库管数据；Memory 管经验；审计中心管责任。

> OpenRice SkillHub 的目标不是堆积技能数量，而是让可信能力能够被发现、安装、组合、运行、度量和持续治理。
