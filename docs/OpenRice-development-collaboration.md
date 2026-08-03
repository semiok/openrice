# OpenRice 开发协作方式

> 最近核对：2026-08-03 EDT（America/New_York）
> 权威来源：Linear 的 OpenRice 项目、MET-29、MET-30、MET-31，以及 GitHub `semiok/openrice` 的 `main`、PR 和分支。
> 使用原则：每次开工先读对应 Linear issue 的正文和最新评论，再核对 GitHub `origin/main`。本文用于说明长期协作方式，不覆盖用户最新指令。

## 项目身份与当前基线

- 产品名：OpenRice。
- GitHub：`https://github.com/semiok/openrice`。
- Linear 项目：`openrice`。
- Web：`https://rice.traditionow.ai`。
- 本文建立时的 `main`：`a4951b4`。
- 本地维护仓库：`/Users/a123/.claude/projects/openrice`。
- 所有功能通过独立分支和 PR 进入 `main`；实现者不直接合并或部署。

## 三个开发角色

### Codex：维护者与集成负责人

Codex 负责 OpenRice 的总体维护和最终交付：

- 将需求拆成清晰、可并行的 Linear issue 和代码边界。
- 负责架构判断、跨模块契约、兼容性和风险控制。
- 负责 OpenLoomi 上游同步与 OpenRice branding overlay。
- review M5 与 lindong 的 PR，检查功能、冲突、测试和回滚方式。
- 负责 squash merge、版本、构建、签名、Web/桌面发布和部署。
- 更新 Linear 的进度、交接、PR 和部署记录。
- 发现其他角色的改动时先理解并协作，不覆盖或回退未知改动。

Codex 的分支使用：`codex/MET-xx-short-scope`。

### M5：高性能 Codex 实现者

M5 适合承担边界明确、需要较强 CPU 或大量构建验证的独立任务：

- 实现 Linear 明确分配的独立功能。
- 执行耗时构建、批量检查、测试和性能验证。
- 当前任务是 MET-30 的“常用技能”菜单。
- 只修改 issue 约定的模块，不处理 OpenLoomi 上游同步和品牌层。
- 完成后推送功能分支并创建 PR，不自行合并、release 或部署。

M5 与维护者共用 GitHub 账号 `semiok`。GitHub 无法仅靠账号区分操作者，因此：

- 分支使用：`m5/MET-xx-short-scope`。
- Linear 留言、commit 和 PR 标题标记 `[M5]`。
- PR 描述注明“实现者：M5（使用 semiok 账号）”。

### lindong：模块开发与体验实现者

lindong 负责 Linear 指定的独立模块和体验优化：

- 开发分配给自己的功能模块和 Bug 修复。
- 处理明确的 UI、交互、安装和功能验证任务。
- 开工前读取 issue 最新正文、评论和当前 `main`，不沿用旧 session 的任务假设。
- 不修改任务范围外模块，不覆盖 Codex 或 M5 的工作。
- 完成本地验证后创建 PR，说明范围、测试、截图、风险和回滚方式。
- 不自行合并 `main`，不发布或部署。

lindong 的分支使用：`lindong/MET-xx-short-scope`；协作留言和 PR 可标记 `[lindong]`。

## 当前分工

最后核对日期：2026-08-03。

- Codex：OpenLoomi 上游同步、品牌覆盖层、架构与兼容边界、review、合并、构建和部署；维护 MET-29、MET-30 的上游同步部分和 MET-31。
- M5：MET-30 的“常用技能”菜单，分支 `m5/MET-30-favorite-skills`。
- lindong：依据 MET-29 与后续 issue，处理独立模块、品牌边角审计、功能验证或明确 Bug。

当前分工会变化。实际开工前必须以 Linear 最新记录为准。

## 共同开发流程

1. 在 Linear 确认任务负责人、范围、不做事项、验收标准和代码基线。
2. 每个角色使用独立 clone 或 Git worktree，禁止两个 agent 同时操作同一 working tree。
3. 从最新 `origin/main` 创建带角色前缀的功能分支。
4. 在 Linear 留言说明操作者、分支、预计修改文件和验证方式。
5. 小步提交，只解决当前 issue 的一个清晰范围。
6. 推送前重新 fetch，确认 `origin/main` 和其他角色分支是否发生变化。
7. 创建 PR，并在 Linear 回填 PR、测试、风险和下一步负责人。
8. Codex review 后 squash merge；只有 Codex 执行版本、发布和部署。

标准开工命令：

```bash
git fetch origin --prune
git status --short --branch
git switch -c <role>/MET-xx-short-scope origin/main
```

## 并行协作规则

- 一个代码范围同一时间只有一个实现者。
- 一个分支只处理一个明确范围，不混入上游同步、品牌调整或无关重构。
- 工作区不干净时，先确认改动来源；禁止使用破坏性命令清除他人改动。
- 发现任务边界重叠时，暂停冲突文件并在 Linear 协调，不靠最后合并时硬解。
- GitHub `main` 是唯一代码集成基线，Linear 是任务和交接记录。
- 最新用户指令优先于本文；新指令改变分工后，应同步更新 Linear 和本文。

## OpenRice 特殊保护边界

### 品牌层

用户可见品牌由以下文件管理：

- `branding/openrice.json`
- `scripts/openrice-branding.mjs`
- `docs/openrice-upstream-sync.md`

品牌相关改动必须运行：

```bash
pnpm brand:check
```

### 内部兼容层

没有独立迁移 issue 时，不修改或全局替换：

- `~/.openloomi`
- `@openloomi/*`
- `OPENLOOMI_*`
- `openloomi:` 内部事件
- `openloomi-ctl` 等 CLI executable
- 现有协议名、数据库结构和本地会话路径

这些属于内部兼容标识，不是需要清除的用户可见品牌。

### 上游同步

只有 Codex 负责将 OpenLoomi 更新同步到 OpenRice。M5 和 lindong 的功能分支不得自行 merge `upstream/main`。

## 最低验证要求

所有 PR 至少运行：

```bash
pnpm brand:check
pnpm tsc
```

根据影响范围补充相关单元测试、页面测试、`pnpm build` 或 Tauri build。UI 改动需要桌面端截图，并验证空状态、错误状态和重启后的持久化状态。

若测试失败，必须区分：

- 本次改动引入的失败：由实现者修复后再交接。
- `main` 已存在的基线失败：提供复现命令和证据，不顺手修改无关文件。

## PR 要求

PR 必须包含：

- 实际实现者和使用的 agent。
- 对应 Linear issue 和分支。
- 改动范围与明确未改范围。
- 关键文件与数据结构变化。
- 测试命令和结果。
- UI 截图或行为证据。
- 风险、兼容影响和回滚方式。

推荐标题：

```text
[M5][MET-30] Add favorite Skills menu
[lindong][MET-xx] Fix connector onboarding state
[Codex][MET-xx] Sync and integrate upstream release
```

## Linear 交接模板

```markdown
## [角色] 交接

- Issue：MET-xx
- 分支：role/MET-xx-scope
- 基线：main@<sha>
- 已完成：
- 修改文件：
- 测试结果：
- 未完成/风险：
- PR：
- 下一步负责人：
```

## 最终原则

- 没有 issue 边界，不开始大范围修改。
- 没有 review 的代码不进入 `main`。
- 没有验证的 `main` 不发布。
- 对未知改动先理解、再协作，绝不默认回退。
- 分工、代码和部署状态必须同时沉淀到 Linear，不能只留在某个 Codex session 中。
