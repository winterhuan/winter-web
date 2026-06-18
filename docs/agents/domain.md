# 领域文档

本仓库使用 single-context 领域文档布局。

工程技能在探索领域相关工作前，应优先读取：

- 仓库根目录的 `CONTEXT.md`，如果存在
- `docs/adr/` 下相关的 ADR，如果存在

如果这些文件不存在，继续执行即可，不需要提示缺失或主动创建。领域文档应由 `/domain-modeling`、`/grill-with-docs` 或 `/improve-codebase-architecture` 等工作流在确有必要时逐步创建。

## single-context 布局

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## 使用领域词汇

当输出 issue 标题、重构建议、假设或测试名时，优先使用 `CONTEXT.md` 中定义的领域术语。不要随意换用同义词。

如果需要的概念还没有出现在领域文档中，说明可能存在命名缺口；在相关工作中记录下来，必要时再通过领域建模流程补充。

## 标出 ADR 冲突

如果建议或实现会违背已有 ADR，应明确指出冲突，而不是静默覆盖既有决策。
