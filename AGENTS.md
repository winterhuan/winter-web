# AGENTS.md

- 总是用中文回复。

## Agent skills

### 问题追踪

本仓库使用 GitHub Issues 追踪问题和需求；外部 PR 不作为 triage 请求入口。详见 `docs/agents/issue-tracker.md`。

### Triage 标签

使用默认的五个 triage 标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### 领域文档

本仓库使用 single-context 领域文档布局。详见 `docs/agents/domain.md`。

### Wiki Knowledge Base

个人 wiki 根目录：
- 优先使用 `$WIKI_ROOT`。
- 未设置时使用 `~/wiki`。
- 如果两者都不存在，先询问用户再搜索或创建 wiki。

需要沉淀长期项目上下文、决策、操作记录或可复用结论时：
- 先阅读 wiki 的 `index.md`。
- 编辑 wiki 页面前遵循 wiki 的 `SCHEMA.md`。
- 将本项目的持久上下文放在 `projects/website/`。
- 将可复用知识抽取到 `concepts/`、`entities/`、`queries/` 或 `comparisons/`。

### Learn / Teach 课程维护

LLM 学习课程的权威工作区在 wiki：

- `projects/website/learn/llm/`

处理 `$teach llm`、LLM 课程、lesson、reference、learning-records、MISSION、RESOURCES 或 NOTES 相关任务时：

- 先按上面的规则定位 wiki 根目录，再阅读 wiki 的 `index.md` 和 `SCHEMA.md`。
- 再阅读 `projects/website/learn/llm/index.md`、`MISSION.md`、`NOTES.md`、`RESOURCES.md` 和相关 `learning-records/`。
- 课程编号、下一课主题和课程状态以 `projects/website/learn/llm/lessons/` 为准。
- 伴读材料以 `projects/website/learn/llm/reference/` 为准。
- 不要把仓库根目录下的 `lessons/`、`reference/`、`MISSION.md`、`RESOURCES.md`、`NOTES.md` 或 `learning-records/` 当成权威课程状态。
- 除非用户明确要求同步或发布到网站仓库，否则不要在仓库根目录创建或更新 teach 课程文件。
