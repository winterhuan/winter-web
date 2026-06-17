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
