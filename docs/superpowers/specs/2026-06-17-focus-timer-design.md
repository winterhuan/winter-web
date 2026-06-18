# Focus 专注计时器 —— 设计文档

> 将 `/products/focus-timer` 从纯文案介绍页升级为站内真实可用的番茄钟应用。
> 本文档是 Inkwell 之外的独立子系统，二者各自独立设计与实现。

## 1. 目标与背景

当前 Focus 产品只有 Markdown 介绍页，按钮指向 `https://example.com/focus` 占位地址，
没有真实功能。目标是把它做成站内可用的番茄工作法计时器：专注/休息循环、本地统计、
声音提示与环境音、任务清单关联。全部纯前端，数据存 localStorage。

## 2. 架构定位

- 产品仍属 `products` 内容集合，**新增** `app: true`。
- **新增**交互路由 `src/pages/products/[slug]/app.astro`（与 `tools/[slug]/app.astro` 同构）。
- **扩展** `Card.astro` 的 `isApp` 逻辑：让 products 集合也支持 `app`，跳转到
  `/products/<slug>/app`。
- **新增**核心组件 `src/components/products/FocusTimer.astro`。
- 复用 `app.astro` 的 `container-wide` 全屏布局与紧凑头部。
- 移除 focus-timer.md 中假的 `url: https://example.com/focus`（设 `app:true` 后卡片走交互页，
  保留 url 反而会让 Card 优先跳外链）。占位 `repo` 链接一并删除，待有真实仓库再补。

## 3. 功能模块

### 3.1 计时与循环（核心）
- 状态机：`idle → focus(25m) → short-break(5m) → focus → ...`；每 `longBreakInterval`
  （默认 4）个 focus 后进入 `long-break(15m)`。
- 时长可在设置面板调节（默认 25/5/15）。
- 大号倒计时显示 + 开始 / 暂停 / 跳过 / 重置。
- 标签页标题同步剩余时间（`25:00 · Focus`），后台可见。
- 计时用「结束时间戳」计算，而非每秒累加，避免后台节流漂移。

### 3.2 本地统计
- localStorage 存今日完成番茄数、今日专注总时长、按天聚合的历史（最近 7 天）。
- 概览「今日 N 个番茄 · 累计 X 小时」+ 最近 7 天柱状图（纯 CSS/div，无图表库）。

### 3.3 声音提示 / 环境音
- 计时结束：短促提示音，Web Audio API 合成（无音频文件）。
- 环境音可选 `none / white / rain`：程序生成（噪声节点 + 滤波/包络），不引入音频资源。

### 3.4 任务清单关联
- 简单待办：输入任务名 → 选为「当前任务」→ 完成的番茄钟记到该任务下。
- 任务与番茄数存 localStorage。

## 4. 数据结构（4 个独立 localStorage key）

```ts
// 'focus-settings' —— 用户设置
interface Settings {
  focusMin: number;           // 默认 25
  shortBreakMin: number;      // 默认 5
  longBreakMin: number;       // 默认 15
  longBreakInterval: number;  // 默认 4
  soundOn: boolean;           // 默认 true
  ambient: 'none' | 'white' | 'rain';  // 默认 'none'
}

// 'focus-timer' —— 运行态（时间戳防漂移）
interface TimerState {
  phase: 'idle' | 'focus' | 'short-break' | 'long-break';
  endTime: number | null;        // 运行中：结束时间戳 ms
  pausedRemaining: number | null; // 暂停时剩余 ms
  completedFocus: number;        // 已完成 focus 数（决定是否长休息）
  currentTaskId: string | null;
}

// 'focus-tasks' —— 任务清单
interface Task {
  id: string;
  title: string;
  pomodoros: number;
  done: boolean;
  createdAt: number;
}

// 'focus-stats' —— 按天聚合统计
interface Stats {
  history: Record<string, { pomodoros: number; focusMs: number }>;
  // key 为 'YYYY-MM-DD'
}
```

运行态用 `endTime` 时间戳而非「剩余秒数每秒减一」——标签页后台被节流不漂移，刷新可恢复。

## 5. 模块拆分（逻辑与副作用分离）

```
src/lib/
  timer-engine.ts   ← 纯函数状态机：phase 转换、时长计算、完成判定（无 DOM、无副作用）
  audio.ts          ← Web Audio 封装：playChime()、ambient start/stop（隔离音频细节）
src/components/products/
  FocusTimer.astro  ← UI 入口：渲染 + 事件绑定，组合 engine + audio + localStorage
```

**拆分理由：**
- `timer-engine.ts` 是纯逻辑（输入当前 phase + completedFocus → 输出下一 phase），
  可脱离浏览器单测；番茄工作法核心规则集中一处。
- `audio.ts` 隔离 Web Audio 的 AudioContext/噪声节点/滤波/包络等细节，UI 只调 `playChime()`。
- `FocusTimer.astro` 只管「状态怎么画、点击怎么响应」，不掺杂数学/音频细节。

### timer-engine.ts 关键纯函数（示意）
```ts
export type Phase = 'idle' | 'focus' | 'short-break' | 'long-break';

// 给定当前状态，算出本次 phase 应持续的 ms（依据 settings）
export function phaseDurationMs(phase: Phase, s: Settings): number;

// 当前 phase 结束后，下一个 phase 是什么；返回新 phase 与是否递增 completedFocus
export function nextPhase(
  current: Phase,
  completedFocus: number,
  s: Settings
): { phase: Phase; focusCompleted: boolean };
```

### audio.ts 接口（示意）
```ts
export class AudioKit {
  ensureContext(): void;     // 用户手势内首次调用创建 AudioContext
  playChime(): void;         // 计时结束提示音
  setAmbient(mode: Settings['ambient']): void;  // 切换/启停环境音
  dispose(): void;
}
```

## 6. 错误处理与边界

- localStorage 读写全部 try/catch（隐私模式 / 配额满）：降级为「仅当前会话」，不阻断使用。
- AudioContext 需用户手势创建：在「开始」按钮首次点击时延迟创建，避免控制台警告。
- `visibilitychange` 事件：从后台切回时立即重绘，确保时间准确。
- 计时结束的 phase 切换在 RAF tick 内判定（`Date.now() >= endTime`）。

## 7. 复用 vs 新建

- 复用：`app.astro` 路由壳子、`container-wide`、紧凑头部样式。
- 新建：`timer-engine.ts`、`audio.ts`、`FocusTimer.astro`、products 的 `app.astro` 路由。
- 不为 Inkwell 预设共享逻辑（YAGNI）；如后续 Inkwell 需要音频，再从 audio.ts 抽取。

## 8. 不做（范围控制）

- 不做账号系统、云同步、多端。
- 不做通知 API（仅站内标签页标题 + 声音提示）。
- 不引入图表库（柱状图用纯 CSS）。
- 不引入音频文件（全部 Web Audio 合成）。
- 不做番茄钟之外的模式（如自由计时）——保持「只做番茄钟」的产品定位。
