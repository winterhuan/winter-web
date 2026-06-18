# 问题追踪：GitHub

本仓库的问题、需求和 PRD 都记录在 GitHub Issues 中。相关技能应使用 `gh` CLI 进行读写操作。

## 约定

- 创建 issue：`gh issue create --title "..." --body "..."`
- 读取 issue：`gh issue view <number> --comments`
- 列出 issue：`gh issue list --state open --json number,title,body,labels,comments`
- 评论 issue：`gh issue comment <number> --body "..."`
- 添加或移除标签：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- 关闭 issue：`gh issue close <number> --comment "..."`

在仓库目录内运行 `gh` 时，仓库信息由 `git remote -v` 自动推断。

## PR 是否作为 triage 入口

PR 作为请求入口：否。

`triage` 不应把外部 PR 纳入 issue triage 队列。协作者或外部贡献者的 PR 应按普通代码评审流程处理。

## 当技能要求“发布到问题追踪器”

创建一个 GitHub issue。

## 当技能要求“读取相关 ticket”

运行 `gh issue view <number> --comments`。
