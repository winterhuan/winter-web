// 番茄钟状态机 —— 纯函数，无 DOM、无副作用
// 负责所有「下一阶段是什么、该持续多久」的规则判定

export type Phase = 'idle' | 'focus' | 'short-break' | 'long-break';
export type TimerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'awaiting-review'
  | 'awaiting-next-cycle'
  | 'wrap-up';

export interface Settings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakInterval: number; // 每完成几个 focus 进入长休息
  soundOn: boolean;
  ambient: 'none' | 'white' | 'rain';
  notificationsOn: boolean;
}

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  endTime: number | null;         // 运行中：结束时间戳 ms
  pausedRemaining: number | null; // 暂停时剩余 ms
  pauseStartedAt: number | null;
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
  notificationsOn: false,
};

export const POMODORO_RANGES = {
  focusMin: { min: 15, max: 50 },
  shortBreakMin: { min: 3, max: 10 },
  longBreakMin: { min: 10, max: 30 },
  longBreakInterval: { min: 2, max: 12 },
} as const;

export const LONG_PAUSE_MS = 2 * 60_000;

export function defaultTimerState(): TimerState {
  return {
    phase: 'idle',
    status: 'idle',
    endTime: null,
    pausedRemaining: null,
    pauseStartedAt: null,
    completedFocus: 0,
    currentTaskId: null,
  };
}

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

// ─── 工作流规则 ─────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function normalizeSettings(input: Partial<Settings> = {}): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...input };
  return {
    ...merged,
    focusMin: clamp(Number(merged.focusMin) || DEFAULT_SETTINGS.focusMin, POMODORO_RANGES.focusMin.min, POMODORO_RANGES.focusMin.max),
    shortBreakMin: clamp(Number(merged.shortBreakMin) || DEFAULT_SETTINGS.shortBreakMin, POMODORO_RANGES.shortBreakMin.min, POMODORO_RANGES.shortBreakMin.max),
    longBreakMin: clamp(Number(merged.longBreakMin) || DEFAULT_SETTINGS.longBreakMin, POMODORO_RANGES.longBreakMin.min, POMODORO_RANGES.longBreakMin.max),
    longBreakInterval: clamp(Number(merged.longBreakInterval) || DEFAULT_SETTINGS.longBreakInterval, POMODORO_RANGES.longBreakInterval.min, POMODORO_RANGES.longBreakInterval.max),
    soundOn: Boolean(merged.soundOn),
    notificationsOn: Boolean(merged.notificationsOn),
    ambient: merged.ambient === 'white' || merged.ambient === 'rain' ? merged.ambient : 'none',
  };
}

export function normalizeTimerState(input: Partial<TimerState> = {}): TimerState {
  return { ...defaultTimerState(), ...input };
}

export function canStartPomodoro(state: Pick<TimerState, 'currentTaskId'>): boolean {
  return Boolean(state.currentTaskId);
}

export function startPomodoroCycle(state: TimerState, settings: Settings, now = Date.now()): TimerState | null {
  if (!canStartPomodoro(state)) return null;
  return {
    ...state,
    phase: 'focus',
    status: 'running',
    endTime: now + phaseDurationMs('focus', settings),
    pausedRemaining: null,
    pauseStartedAt: null,
  };
}

export function isActiveFocus(state: Pick<TimerState, 'phase' | 'status' | 'endTime'>): boolean {
  return state.phase === 'focus' && (state.status === 'running' || state.status === 'wrap-up') && state.endTime != null;
}

export function completeRunningPhase(state: TimerState): TimerState {
  if (state.phase === 'focus') {
    return {
      ...state,
      status: 'awaiting-review',
      endTime: null,
      pausedRemaining: null,
      pauseStartedAt: null,
    };
  }

  return {
    ...state,
    status: 'awaiting-next-cycle',
    endTime: null,
    pausedRemaining: null,
    pauseStartedAt: null,
  };
}

export function isLongPause(state: Pick<TimerState, 'pauseStartedAt'>, now = Date.now()): boolean {
  return state.pauseStartedAt != null && now - state.pauseStartedAt >= LONG_PAUSE_MS;
}
