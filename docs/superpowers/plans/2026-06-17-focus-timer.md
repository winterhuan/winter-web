# Focus 专注计时器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/products/focus-timer` 从纯文案页升级为站内真实可用的番茄钟应用（计时循环 + 本地统计 + 声音/环境音 + 任务清单）。

**Architecture:** 产品加 `app:true`，新增 `products/[slug]/app.astro` 交互路由（与 tools 同构），扩展 `Card.astro` 让 products 也支持 app。核心逻辑拆成纯函数状态机 `timer-engine.ts` + 音频隔离 `audio.ts` + UI 组件 `FocusTimer.astro`。数据存 localStorage，运行态用结束时间戳防漂移。

**Tech Stack:** Astro 5（静态站点）、TypeScript（strict）、原生 Web Audio API、localStorage、vitest（仅给纯逻辑单测，本计划引入）。

**参考文档：** `docs/superpowers/specs/2026-06-17-focus-timer-design.md`

---

## 文件结构总览

**新建：**
- `src/lib/timer-engine.ts` — 纯函数番茄钟状态机（phase 转换、时长、完成判定）。无 DOM/副作用。
- `src/lib/audio.ts` — Web Audio 封装（提示音 + 环境音白噪音/雨声）。
- `src/components/products/FocusTimer.astro` — UI 入口，组合 engine + audio + localStorage。
- `src/pages/products/[slug]/app.astro` — 交互路由（仿 `tools/[slug]/app.astro`）。
- `src/lib/__tests__/timer-engine.test.ts` — timer-engine 的单测。
- `vitest.config.ts` — vitest 配置。

**修改：**
- `src/components/Card.astro:37` — `isApp` 支持 products 集合。
- `src/content/products/focus-timer.md` — 加 `app: true`，删假的 `url`/`repo`。
- `package.json` — 加 vitest 依赖。

---

## Task 1: 引入 vitest 测试基建

**Files:**
- Modify: `package.json`（加 devDependency）
- Create: `vitest.config.ts`

- [ ] **Step 1: 安装 vitest**

Run:
```bash
pnpm add -D vitest
```
Expected: `package.json` 的 devDependencies 出现 `vitest`。

- [ ] **Step 2: 创建 vitest 配置**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: 加 test 脚本**

Modify `package.json` 的 `scripts`，加入：
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 验证 vitest 可运行（无测试时应通过）**

Run: `pnpm test`
Expected: 输出 `No test files found` 且退出码为 0（vitest 允许 0 测试时 pass，若报错则加 `passWithNoTests: true` 到 test 配置）。

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest for unit testing"
```

---

## Task 2: timer-engine.ts 类型与默认设置

**Files:**
- Create: `src/lib/timer-engine.ts`

本任务先建立类型与常量，不含逻辑（逻辑与测试在 Task 3）。

- [ ] **Step 1: 创建 timer-engine.ts 的类型与默认值**

Create `src/lib/timer-engine.ts`:
```ts
// 番茄钟状态机 —— 纯函数，无 DOM、无副作用
// 负责所有「下一阶段是什么、该持续多久」的规则判定

export type Phase = 'idle' | 'focus' | 'short-break' | 'long-break';

export interface Settings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakInterval: number; // 每完成几个 focus 进入长休息
  soundOn: boolean;
  ambient: 'none' | 'white' | 'rain';
}

export interface TimerState {
  phase: Phase;
  endTime: number | null;         // 运行中：结束时间戳 ms
  pausedRemaining: number | null; // 暂停时剩余 ms
  completedFocus: number;         // 已完成 focus 数
  currentTaskId: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakInterval: 4,
  soundOn: true,
  ambient: 'none',
};

export function defaultTimerState(): TimerState {
  return {
    phase: 'idle',
    endTime: null,
    pausedRemaining: null,
    completedFocus: 0,
    currentTaskId: null,
  };
}
```

- [ ] **Step 2: 验证类型编译**

Run: `npx tsc --noEmit`
Expected: 无报错（若有 astro 类型解析报错，可忽略 `.astro` 相关，只关注 `src/lib` 的 ts 文件）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/timer-engine.ts
git commit -m "feat(timer): add types and defaults for focus timer engine"
```

---

## Task 3: timer-engine.ts 纯逻辑 + 单测（TDD）

**Files:**
- Modify: `src/lib/timer-engine.ts`
- Test: `src/lib/__tests__/timer-engine.test.ts`

实现两个纯函数：`phaseDurationMs` 与 `nextPhase`。先写测试。

- [ ] **Step 1: 写失败测试**

Create `src/lib/__tests__/timer-engine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS,
  phaseDurationMs,
  nextPhase,
} from '../timer-engine';

describe('phaseDurationMs', () => {
  it('focus 阶段用 focusMin', () => {
    expect(phaseDurationMs('focus', DEFAULT_SETTINGS)).toBe(25 * 60_000);
  });
  it('short-break 用 shortBreakMin', () => {
    expect(phaseDurationMs('short-break', DEFAULT_SETTINGS)).toBe(5 * 60_000);
  });
  it('long-break 用 longBreakMin', () => {
    expect(phaseDurationMs('long-break', DEFAULT_SETTINGS)).toBe(15 * 60_000);
  });
  it('idle 持续 0', () => {
    expect(phaseDurationMs('idle', DEFAULT_SETTINGS)).toBe(0);
  });
});

describe('nextPhase', () => {
  it('从 focus 完成且未到间隔 → short-break，不递增', () => {
    const r = nextPhase('focus', 1, DEFAULT_SETTINGS); // 完成 1 个，间隔 4
    expect(r.phase).toBe('short-break');
    expect(r.focusCompleted).toBe(false);
  });
  it('从 focus 完成且达到间隔 → long-break，不递增（递增在进入时算）', () => {
    // completedFocus=3 表示这是第 4 个（0-indexed 完成数），完成后达 4
    const r = nextPhase('focus', 3, DEFAULT_SETTINGS);
    expect(r.phase).toBe('long-break');
    expect(r.focusCompleted).toBe(true);
  });
  it('从任意 break 完成 → 回到 focus', () => {
    expect(nextPhase('short-break', 1, DEFAULT_SETTINGS).phase).toBe('focus');
    expect(nextPhase('long-break', 4, DEFAULT_SETTINGS).phase).toBe('focus');
  });
  it('long-break 后 completedFocus 已达间隔，回到 focus', () => {
    const r = nextPhase('long-break', 4, DEFAULT_SETTINGS);
    expect(r.phase).toBe('focus');
    expect(r.focusCompleted).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL — `phaseDurationMs` / `nextPhase` 未定义（import 报错或 not a function）。

- [ ] **Step 3: 实现纯函数**

在 `src/lib/timer-engine.ts` 末尾追加：
```ts

// ─── 阶段时长 ───────────────────────────────────────────────

/** 给定阶段与设置，返回该阶段应持续的毫秒数 */
export function phaseDurationMs(phase: Phase, s: Settings): number {
  switch (phase) {
    case 'focus': return s.focusMin * 60_000;
    case 'short-break': return s.shortBreakMin * 60_000;
    case 'long-break': return s.longBreakMin * 60_000;
    default: return 0; // idle
  }
}

// ─── 阶段流转 ───────────────────────────────────────────────

/**
 * 计算当前阶段结束后的下一步。
 * @param current   当前阶段
 * @param completedFocus 已完成 focus 数（即将结束的 focus 计入前）
 * @param s         设置
 * @returns 下一个 phase；focusCompleted 表示「刚结束的是否是一个 focus」
 *          调用方据此把 completedFocus +1
 */
export function nextPhase(
  current: Phase,
  completedFocus: number,
  s: Settings,
): { phase: Phase; focusCompleted: boolean } {
  if (current === 'focus') {
    const willBeCompleted = completedFocus + 1;
    const isLongBreak = willBeCompleted % s.longBreakInterval === 0;
    return { phase: isLongBreak ? 'long-break' : 'short-break', focusCompleted: true };
  }
  // 任意 break 结束 → 回到 focus
  return { phase: 'focus', focusCompleted: false };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS — 全部用例通过。

- [ ] **Step 5: Commit**

```bash
git add src/lib/timer-engine.ts src/lib/__tests__/timer-engine.test.ts
git commit -m "feat(timer): implement phase duration and transition logic with tests"
```

---

## Task 4: 扩展 Card.astro 让 products 支持 app

**Files:**
- Modify: `src/components/Card.astro:37`

当前 `isApp` 仅对 tools 生效，products 需同样支持，且 app 跳 `/products/<slug>/app`。

- [ ] **Step 1: 修改 isApp 与 href 逻辑**

Modify `src/components/Card.astro`。找到第 35-42 行附近：
```ts
// app 工具 → 跳交互页；有外部 url → 跳外链；否则跳详情页
const isExternal = Boolean(data.url);
const isApp = collection === 'tools' && data.app === true;
const href = isApp
  ? `/tools/${slug}/app`
  : isExternal
  ? data.url!
  : `/${collection === 'blog' ? 'blog' : collection}/${slug}`;
```
替换为：
```ts
// app 工具/产品 → 跳交互页；有外部 url → 跳外链；否则跳详情页
const isExternal = Boolean(data.url);
const isApp = (collection === 'tools' || collection === 'products') && data.app === true;
const href = isApp
  ? `/${collection}/${slug}/app`
  : isExternal
  ? data.url!
  : `/${collection === 'blog' ? 'blog' : collection}/${slug}`;
```
（`/${collection}/...` 对 tools/products 都正确；blog 不会进 isApp 分支。）

- [ ] **Step 2: 验证构建**

Run: `node node_modules\astro\astro.js build`
Expected: 构建成功，无类型/模板报错。

- [ ] **Step 3: Commit**

```bash
git add src/components/Card.astro
git commit -m "feat(card): support app interactive pages for products collection"
```

---

## Task 5: 新增 products/[slug]/app.astro 路由

**Files:**
- Create: `src/pages/products/[slug]/app.astro`

与 `tools/[slug]/app.astro` 同构，但渲染 `products/` 下的组件，TOOL_COMPONENTS 映射用 slug。

- [ ] **Step 1: 创建路由文件**

Create `src/pages/products/[slug]/app.astro`:
```astro
---
// 产品交互页 —— /products/<slug>/app
// 仅对 app: true 的产品生效，渲染对应的交互组件
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import FormattedDate from '../../../components/FormattedDate.astro';

export async function getStaticPaths() {
  const entries = await getCollection('products', ({ data }) => data.draft !== true && data.app === true);
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { data } = entry;

// 根据 slug 决定渲染哪个交互组件
const COMPONENT_MAP: Record<string, string> = {
  'focus-timer': 'FocusTimer',
};
const component = COMPONENT_MAP[entry.slug];
if (!component) {
  return Astro.redirect(`/products/${entry.slug}`);
}

const Interactive = (await import(`../../../components/products/${component}.astro`)).default;
---

<Base title={`${data.title} — 产品`} description={data.description}>
  <div class="container container-wide">
    <header class="tool-app-header">
      <a href="/products" class="link-underline muted">← 返回产品</a>
      <h1>{data.title}</h1>
      {data.description && <p class="lead">{data.description}</p>}
      <div class="tool-meta">
        <FormattedDate date={data.date} />
        {data.tags && data.tags.length > 0 && (
          data.tags.map((t: string) => <span class="tag">{t}</span>)
        )}
      </div>
    </header>

    <main class="tool-app-body">
      <Interactive />
    </main>
  </div>
</Base>

<style>
  .tool-app-header {
    padding-block: var(--space-6) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-6);
  }
  .tool-app-header h1 {
    margin-top: var(--space-2);
    font-size: var(--font-size-xl);
  }
  .tool-app-header .lead {
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);
  }
  .tool-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-3);
    font-size: var(--font-size-xs);
    font-family: var(--font-mono);
    color: var(--color-text-mute);
  }
  .tool-app-body {
    padding-bottom: var(--space-12);
  }
</style>
```

- [ ] **Step 2: 构建验证（此时 FocusTimer 还不存在，会因 import 失败而报错——属于预期，下一步创建组件）**

Run: `node node_modules\astro\astro.js build`
Expected: 报错 `Cannot find module .../FocusTimer.astro` —— 预期，Task 6 创建组件后即解决。若报的是路由本身语法错误则需修正。

- [ ] **Step 3: 暂不单独提交**（与 Task 6 组件一起提交，避免中间态不可构建）

---

## Task 6: audio.ts —— Web Audio 封装

**Files:**
- Create: `src/lib/audio.ts`

隔离所有 Web Audio 细节。UI 只调高层方法。

- [ ] **Step 1: 创建 audio.ts**

Create `src/lib/audio.ts`:
```ts
// Web Audio 封装 —— 提示音 + 环境音（白噪音/雨声近似）
// 全部程序生成，不引入音频文件。AudioContext 延迟到用户手势内首次创建。

export type AmbientMode = 'none' | 'white' | 'rain';

export class AudioKit {
  private ctx: AudioContext | null = null;
  private ambientNodes: { source: AudioNode; gain: GainNode } | null = null;

  /** 在用户手势（如点击开始）内调用，创建 AudioContext */
  ensureContext(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
  }

  /** 计时结束提示音：两个短促升调 */
  playChime(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  /** 切换环境音；none 时停止 */
  setAmbient(mode: AmbientMode): void {
    if (!this.ctx) return;
    this.stopAmbient();
    if (mode === 'none') return;

    const ctx = this.ctx;
    // 白噪音缓冲：2 秒随机数据
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = mode === 'rain' ? 0.12 : 0.06;

    // 雨声：白噪音过低通滤波 + 略高频段，近似雨的质感
    let node: AudioNode = source;
    if (mode === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      node.connect(filter);
      node = filter;
    }

    node.connect(gain).connect(ctx.destination);
    source.start();
    this.ambientNodes = { source, gain };
  }

  private stopAmbient(): void {
    if (!this.ambientNodes) return;
    try {
      (this.ambientNodes.source as AudioBufferSourceNode).stop();
    } catch (e) {}
    this.ambientNodes = null;
  }

  dispose(): void {
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
```

- [ ] **Step 2: 验证类型编译**

Run: `npx tsc --noEmit`
Expected: 无 `src/lib/audio.ts` 相关报错。

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio.ts
git commit -m "feat(audio): add Web Audio kit for chime and ambient sounds"
```

---

## Task 7: FocusTimer.astro —— UI 组件（计时 + 控制）

**Files:**
- Create: `src/components/products/FocusTimer.astro`

本任务先做计时与控制（核心），统计/任务/声音在后续任务叠加。这是最大的一块，先建立可运行骨架。

- [ ] **Step 1: 创建 FocusTimer.astro 计时骨架**

Create `src/components/products/FocusTimer.astro`:
```astro
---
// Focus 专注计时器 —— 番茄工作法
// 计时循环 + 本地统计 + 声音/环境音 + 任务清单
---
<div class="focus-tool">
  <!-- 倒计时显示 -->
  <div class="focus-display">
    <div class="phase-label" data-phase-label">准备开始</div>
    <div class="time" data-time>25:00</div>
  </div>

  <!-- 控制按钮 -->
  <div class="focus-controls">
    <button class="btn primary" data-action="start">开始</button>
    <button class="btn" data-action="pause" hidden>暂停</button>
    <button class="btn ghost" data-action="skip">跳过</button>
    <button class="btn ghost" data-action="reset">重置</button>
  </div>

  <!-- 统计概览（占位，Task 8 填充） -->
  <div class="focus-stats" data-stats hidden></div>
</div>

<style>
  .focus-tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-8) 0;
  }
  .focus-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }
  .phase-label {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-mute);
  }
  .time {
    font-family: var(--font-mono);
    font-size: 6rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .focus-controls {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    justify-content: center;
  }
  .btn {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-base);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition: opacity var(--transition), background var(--transition);
  }
  .btn:hover { opacity: 0.85; }
  .btn.primary {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    border-color: var(--color-accent);
  }
  .btn.ghost { opacity: 0.7; }
  .btn[hidden] { display: none; }
</style>

<script>
  import {
    DEFAULT_SETTINGS, defaultTimerState, phaseDurationMs, nextPhase,
    type TimerState, type Settings, type Phase,
  } from '../../lib/timer-engine';

  const PHASE_LABELS: Record<Phase, string> = {
    'idle': '准备开始',
    'focus': '专注中',
    'short-break': '短休息',
    'long-break': '长休息',
  };

  const SETTINGS_KEY = 'focus-settings';
  const STATE_KEY = 'focus-timer';

  function loadSettings(): Settings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  }

  function loadState(): TimerState {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) return { ...defaultTimerState(), ...JSON.parse(raw) };
    } catch (e) {}
    return defaultTimerState();
  }

  function saveState(s: TimerState) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  const timeEl = document.querySelector('[data-time]') as HTMLElement;
  const phaseLabelEl = document.querySelector('[data-phase-label]') as HTMLElement;
  const startBtn = document.querySelector('[data-action="start"]') as HTMLButtonElement;
  const pauseBtn = document.querySelector('[data-action="pause"]') as HTMLButtonElement;
  const skipBtn = document.querySelector('[data-action="skip"]') as HTMLButtonElement;
  const resetBtn = document.querySelector('[data-action="reset"]') as HTMLButtonElement;

  const settings = loadSettings();
  let state = loadState();
  let rafId: number | null = null;

  // ─── 时间格式化 ───────────────────────────────────────────
  function formatMs(ms: number): string {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ─── 剩余时间 ─────────────────────────────────────────────
  function remainingMs(): number {
    if (state.endTime != null) return Math.max(0, state.endTime - Date.now());
    if (state.pausedRemaining != null) return state.pausedRemaining;
    return phaseDurationMs('focus', settings); // idle 初始
  }

  // ─── 渲染 ─────────────────────────────────────────────────
  function render() {
    const rem = remainingMs();
    timeEl.textContent = formatMs(rem);
    phaseLabelEl.textContent = PHASE_LABELS[state.phase];
    const running = state.endTime != null;
    startBtn.hidden = running;
    pauseBtn.hidden = !running;
    document.title = `${formatMs(rem)} · Focus`;
  }

  // ─── 开始 ─────────────────────────────────────────────────
  function start() {
    if (state.phase === 'idle') state.phase = 'focus';
    const rem = remainingMs();
    state.endTime = Date.now() + rem;
    state.pausedRemaining = null;
    saveState(state);
    render();
    loop();
  }

  // ─── 暂停 ─────────────────────────────────────────────────
  function pause() {
    if (state.endTime == null) return;
    state.pausedRemaining = state.endTime - Date.now();
    state.endTime = null;
    saveState(state);
    render();
    stopLoop();
  }

  // ─── 完成当前阶段，进入下一阶段 ───────────────────────────
  function completePhase() {
    stopLoop();
    const wasFocus = state.phase === 'focus';
    if (wasFocus) {
      state.completedFocus += 1;
      recordFocusComplete(); // Task 8 实现
    }
    const { phase } = nextPhase(state.phase, wasFocus ? state.completedFocus - 1 : state.completedFocus, settings);
    state.phase = phase;
    state.endTime = Date.now() + phaseDurationMs(phase, settings);
    state.pausedRemaining = null;
    saveState(state);
    playChimeIfOn(); // Task 9 接入
    render();
    if (state.phase !== 'idle') loop();
  }

  // ─── 跳过 ─────────────────────────────────────────────────
  function skip() {
    if (state.phase === 'idle') return;
    completePhase();
  }

  // ─── 重置 ─────────────────────────────────────────────────
  function reset() {
    stopLoop();
    state = defaultTimerState();
    saveState(state);
    render();
  }

  // ─── RAF 循环 ─────────────────────────────────────────────
  function loop() {
    stopLoop();
    const tick = () => {
      if (state.endTime != null && Date.now() >= state.endTime) {
        completePhase();
        return;
      }
      render();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // ─── 后台切回重绘 ─────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.endTime != null) {
      if (Date.now() >= state.endTime) completePhase();
      else render();
    }
  });

  // 占位：Task 8/9 替换
  function recordFocusComplete() {}
  function playChimeIfOn() {}

  // 绑定
  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  skipBtn.addEventListener('click', skip);
  resetBtn.addEventListener('click', reset);

  render();
</script>
```

注意：第 4 行模板里 `data-phase-label"` 多了一个 `"`，应写为 `data-phase-label`。创建时务必写成 `<div class="phase-label" data-phase-label>准备开始</div>`。

- [ ] **Step 2: 构建验证**

Run: `node node_modules\astro\astro.js build`
Expected: 构建成功（Task 5 的 app.astro 现在能找到 FocusTimer 组件）。

- [ ] **Step 3: 更新 focus-timer.md 加 app:true（否则路由不生成）**

Modify `src/content/products/focus-timer.md`，frontmatter 改为：
```yaml
---
title: 'Focus —— 专注计时器'
description: '一个基于番茄工作法的极简专注计时器，帮你对抗分心。'
date: 2026-05-20
tags: ['生产力']
status: 'live'
app: true
---
```
（删除原 `url: 'https://example.com/focus'` 与 `repo: 'https://github.com/'`。）

- [ ] **Step 4: 构建验证路由生成**

Run: `node node_modules\astro\astro.js build`
Expected: 输出包含 `/products/focus-timer/app/index.html`。

- [ ] **Step 5: Commit（Task 5 的路由 + Task 7 的组件 + 内容一起）**

```bash
git add src/pages/products/[slug]/app.astro src/components/products/FocusTimer.astro src/content/products/focus-timer.md
git commit -m "feat(focus): add timer UI, product app route, enable app on focus-timer"
```

---

## Task 8: 本地统计（概览 + 7 天柱状图）

**Files:**
- Modify: `src/components/products/FocusTimer.astro`

接 Task 7 的 `recordFocusComplete()` 占位，加统计渲染。

- [ ] **Step 1: 在 FocusTimer.astro 模板补充统计区**

把 Task 7 的占位统计 div 替换为完整结构。找到：
```astro
  <!-- 统计概览（占位，Task 8 填充） -->
  <div class="focus-stats" data-stats hidden></div>
```
替换为：
```astro
  <!-- 统计概览 -->
  <div class="focus-stats">
    <div class="stats-summary">
      <div class="stat"><span class="stat-num" data-stat-today>0</span><span class="stat-label">今日番茄</span></div>
      <div class="stat"><span class="stat-num" data-stat-week>0</span><span class="stat-label">最近7天</span></div>
      <div class="stat"><span class="stat-num" data-stat-total>0h</span><span class="stat-label">累计专注</span></div>
    </div>
    <div class="stats-chart" data-stats-chart></div>
  </div>
```

- [ ] **Step 2: 补充统计样式**

在 `<style>` 内 `.btn[hidden]` 规则后追加：
```css
  .focus-stats {
    width: 100%;
    max-width: 600px;
    margin-top: var(--space-6);
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-border);
  }
  .stats-summary {
    display: flex;
    justify-content: space-around;
    text-align: center;
    margin-bottom: var(--space-6);
  }
  .stat { display: flex; flex-direction: column; gap: var(--space-1); }
  .stat-num { font-size: var(--font-size-2xl); font-weight: 700; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: var(--font-size-xs); color: var(--color-text-mute); }
  .stats-chart {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    height: 80px;
  }
  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }
  .chart-bar-fill {
    width: 100%;
    background: var(--color-accent);
    border-radius: var(--radius) var(--radius) 0 0;
    min-height: 2px;
  }
  .chart-bar-label {
    font-size: 0.65rem;
    color: var(--color-text-mute);
    font-family: var(--font-mono);
  }
```

- [ ] **Step 3: 实现 stats 逻辑，替换占位**

在 `<script>` 内，替换占位函数 `function recordFocusComplete() {}` 为完整的统计读写 + 渲染：
```ts
  // ─── 统计（按天聚合）───────────────────────────────────────
  const STATS_KEY = 'focus-stats';
  interface DayStat { pomodoros: number; focusMs: number; }
  type Stats = Record<string, DayStat>; // key: YYYY-MM-DD

  function loadStats(): Stats {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }
  function saveStats(s: Stats) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function recordFocusComplete() {
    const stats = loadStats();
    const key = todayKey();
    const day = stats[key] || { pomodoros: 0, focusMs: 0 };
    day.pomodoros += 1;
    day.focusMs += settings.focusMin * 60_000;
    stats[key] = day;
    saveStats(stats);
    renderStats();
  }

  function renderStats() {
    const stats = loadStats();
    const today = stats[todayKey()]?.pomodoros || 0;

    // 最近 7 天
    const days: { key: string; label: string; pomodoros: number }[] = [];
    let weekTotal = 0;
    let grandTotalMs = 0;
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const p = stats[key]?.pomodoros || 0;
      days.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, pomodoros: p });
      weekTotal += p;
    }
    Object.values(stats).forEach((d) => { grandTotalMs += d.focusMs; });

    const setNum = (sel: string, val: string) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    setNum('[data-stat-today]', String(today));
    setNum('[data-stat-week]', String(weekTotal));
    setNum('[data-stat-total]', `${(grandTotalMs / 3_600_000).toFixed(1)}h`);

    const chartEl = document.querySelector('[data-stats-chart]');
    if (chartEl) {
      const max = Math.max(1, ...days.map((d) => d.pomodoros));
      chartEl.innerHTML = days.map((d) => {
        const h = Math.round((d.pomodoros / max) * 70);
        return `<div class="chart-bar">
          <div class="chart-bar-fill" style="height:${h}px"></div>
          <div class="chart-bar-label">${d.label}</div>
        </div>`;
      }).join('');
    }
  }

  renderStats(); // 初始渲染
```

- [ ] **Step 4: 构建验证**

Run: `node node_modules\astro\astro.js build`
Expected: 构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/components/products/FocusTimer.astro
git commit -m "feat(focus): add local stats with 7-day bar chart"
```

---

## Task 9: 声音提示 + 环境音控制

**Files:**
- Modify: `src/components/products/FocusTimer.astro`

接 Task 7 的 `playChimeIfOn()` 占位，接入 audio.ts，并加环境音切换 UI。

- [ ] **Step 1: 模板加环境音切换与设置入口**

在 `<!-- 统计概览 -->` 之前插入：
```astro
  <!-- 声音控制 -->
  <div class="focus-audio">
    <label class="ambient-toggle">
      <span>环境音</span>
      <select data-ambient>
        <option value="none">关闭</option>
        <option value="white">白噪音</option>
        <option value="rain">雨声</option>
      </select>
    </label>
  </div>
```

- [ ] **Step 2: 补充音频区样式**

在 `.chart-bar-label` 规则后追加：
```css
  .focus-audio { margin-top: var(--space-4); }
  .ambient-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-mute);
  }
  .ambient-toggle select {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
  }
```

- [ ] **Step 3: 接入 AudioKit，替换占位**

在 `<script>` 顶部 import 区追加：
```ts
  import { AudioKit } from '../../lib/audio';
```

替换占位 `function playChimeIfOn() {}` 为：
```ts
  const audio = new AudioKit();
  function playChimeIfOn() {
    if (settings.soundOn) audio.playChime();
  }
```

修改 `start()` 函数，在函数体最开头加（确保 AudioContext 在用户手势内创建）：
```ts
  function start() {
    audio.ensureContext();
    if (state.phase === 'idle') state.phase = 'focus';
    // …其余不变
```

在 `<script>` 末尾（`render()` 之前）绑定环境音下拉：
```ts
  // ─── 环境音切换 ───────────────────────────────────────────
  const ambientSelect = document.querySelector('[data-ambient]') as HTMLSelectElement;
  if (ambientSelect) {
    ambientSelect.value = settings.ambient;
    ambientSelect.addEventListener('change', () => {
      audio.ensureContext();
      const mode = ambientSelect.value as 'none' | 'white' | 'rain';
      settings.ambient = mode;
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
      audio.setAmbient(mode);
    });
  }
```

- [ ] **Step 4: 构建验证**

Run: `node node_modules\astro\astro.js build`
Expected: 构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/components/products/FocusTimer.astro
git commit -m "feat(focus): add chime on completion and ambient sound toggle"
```

---

## Task 10: 任务清单关联

**Files:**
- Modify: `src/components/products/FocusTimer.astro`

待办列表：输入任务 → 选为当前任务 → 完成的番茄记到该任务下。

- [ ] **Step 1: 模板加任务区**

在 `<!-- 声音控制 -->` 之前插入：
```astro
  <!-- 任务清单 -->
  <div class="focus-tasks">
    <form class="task-form" data-task-form>
      <input class="task-input" data-task-input placeholder="当前要专注的任务…" />
      <button class="btn primary" type="submit">添加</button>
    </form>
    <ul class="task-list" data-task-list></ul>
  </div>
```

- [ ] **Step 2: 补充任务区样式**

在 `.ambient-toggle select` 规则后追加：
```css
  .focus-tasks {
    width: 100%;
    max-width: 500px;
    margin-top: var(--space-4);
  }
  .task-form {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .task-input {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    outline: none;
  }
  .task-input:focus { border-color: var(--color-border-strong); }
  .task-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
  .task-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    cursor: pointer;
  }
  .task-item.active { border-color: var(--color-accent); }
  .task-item.done .task-title { text-decoration: line-through; opacity: 0.5; }
  .task-title { flex: 1; font-size: var(--font-size-sm); }
  .task-pomos { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-mute); }
```

- [ ] **Step 3: 实现任务逻辑**

在 `<script>` 内（`renderStats()` 调用之前）加任务管理：
```ts
  // ─── 任务清单 ─────────────────────────────────────────────
  const TASKS_KEY = 'focus-tasks';
  interface Task { id: string; title: string; pomodoros: number; done: boolean; createdAt: number; }
  function loadTasks(): Task[] {
    try { const raw = localStorage.getItem(TASKS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  }
  function saveTasks(tasks: Task[]) {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch (e) {}
  }

  const taskListEl = document.querySelector('[data-task-list]') as HTMLElement;
  const taskForm = document.querySelector('[data-task-form]') as HTMLFormElement;
  const taskInput = document.querySelector('[data-task-input]') as HTMLInputElement;

  function renderTasks() {
    const tasks = loadTasks();
    taskListEl.innerHTML = tasks.map((t) => `
      <li class="task-item ${t.id === state.currentTaskId ? 'active' : ''} ${t.done ? 'done' : ''}" data-task-id="${t.id}">
        <input type="checkbox" data-task-toggle="${t.id}" ${t.done ? 'checked' : ''} />
        <span class="task-title">${escapeHtml(t.title)}</span>
        <span class="task-pomos">🍅 ${t.pomodoros}</span>
        <button class="btn ghost" data-task-delete="${t.id}">✕</button>
      </li>
    `).join('');
  }
  function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    const tasks = loadTasks();
    tasks.push({ id: crypto.randomUUID(), title, pomodoros: 0, done: false, createdAt: Date.now() });
    saveTasks(tasks);
    taskInput.value = '';
    renderTasks();
  });

  taskListEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const toggle = target.closest('[data-task-toggle]') as HTMLInputElement | null;
    const del = target.closest('[data-task-delete]');
    const item = target.closest('[data-task-id]') as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.taskId!;
    const tasks = loadTasks();

    if (del) {
      const filtered = tasks.filter((t) => t.id !== id);
      saveTasks(filtered);
      if (state.currentTaskId === id) { state.currentTaskId = null; saveState(state); }
      renderTasks();
      return;
    }
    if (toggle) {
      const t = tasks.find((x) => x.id === id);
      if (t) t.done = toggle.checked;
      saveTasks(tasks);
      renderTasks();
      return;
    }
    // 点击行 = 选为当前任务
    state.currentTaskId = state.currentTaskId === id ? null : id;
    saveState(state);
    renderTasks();
  });

  // 完成专注时给当前任务 +1 番茄
  const _origRecord = recordFocusComplete;
  function recordFocusForTask() {
    if (state.currentTaskId) {
      const tasks = loadTasks();
      const t = tasks.find((x) => x.id === state.currentTaskId);
      if (t) { t.pomodoros += 1; saveTasks(tasks); renderTasks(); }
    }
  }
  renderTasks();
```

并在 `completePhase()` 中，`recordFocusComplete()` 调用后追加一行：
```ts
      recordFocusComplete();
      recordFocusForTask();   // ← 新增
```

- [ ] **Step 4: 构建验证**

Run: `node node_modules\astro\astro.js build`
Expected: 构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/components/products/FocusTimer.astro
git commit -m "feat(focus): add task list with pomodoro association"
```

---

## Task 11: 全量构建 + 冒烟验证

**Files:** 无新建，仅验证

- [ ] **Step 1: 运行单测**

Run: `pnpm test`
Expected: timer-engine 全部通过。

- [ ] **Step 2: 运行完整构建**

Run: `node node_modules\astro\astro.js build`
Expected: 成功，输出包含 `/products/focus-timer/app/index.html`，无报错。

- [ ] **Step 3: 手动冒烟（描述给执行者）**

`pnpm dev` 打开 `/products/focus-timer/app`，验证：
- 倒计时从 25:00 开始递减，标签页标题同步
- 点开始→暂停→继续，时间连续不跳变
- 跳过会切到「短休息」，标签变
- 第 4 个 focus 完成后进「长休息」
- 统计区今日番茄数 +1，7 天图出现柱
- 添加任务、点选为当前任务、完成 focus 后任务 🍅 +1
- 切环境音为「雨声」能听到（需先点过开始，触发 ensureContext）

- [ ] **Step 4: （无需提交，除非验证中发现问题需修复）**

---

## Self-Review 结果

**Spec 覆盖：**
- 3.1 计时与循环 → Task 3（逻辑）+ Task 7（UI/RAF/标题同步/防漂移）✓
- 3.2 本地统计 → Task 8 ✓
- 3.3 声音/环境音 → Task 6（audio.ts）+ Task 9（接入）✓
- 3.4 任务清单 → Task 10 ✓
- 架构（app 路由/Card 扩展/content 改）→ Task 4/5/7 ✓
- 错误处理（try/catch、ensureContext、visibilitychange）→ Task 7/8/9 ✓

**类型一致性：** `Phase`、`Settings`、`TimerState` 在 Task 2 定义，Task 3/7/8/9/10 使用一致；`nextPhase` 签名（current, completedFocus, s）在 Task 3 定义，Task 7 调用时传 `wasFocus ? completedFocus - 1 : completedFocus` 与「即将结束的 focus 计入前」语义一致 ✓。

**注意事项已标注：** Task 7 Step 1 模板里 `data-phase-label` 的引号陷阱（已在文中显式提醒）。
