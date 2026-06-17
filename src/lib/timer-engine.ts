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
