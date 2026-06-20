import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS,
  defaultTimerState,
  canStartPomodoro,
  completeRunningPhase,
  normalizeSettings,
  startPomodoroCycle,
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
  it('从 focus 完成且未到间隔 → short-break，focusCompleted=true', () => {
    // completedFocus 是即将结束的 focus 计入前的值，为 1 表示这是第 2 个
    const r = nextPhase('focus', 1, DEFAULT_SETTINGS); // 完成后 2，间隔 4
    expect(r.phase).toBe('short-break');
    expect(r.focusCompleted).toBe(true);
  });
  it('从 focus 完成且达到间隔 → long-break', () => {
    // completedFocus=3 表示这是第 4 个（0-indexed），完成后达 4
    const r = nextPhase('focus', 3, DEFAULT_SETTINGS);
    expect(r.phase).toBe('long-break');
    expect(r.focusCompleted).toBe(true);
  });
  it('从 short-break 结束 → 回到 focus', () => {
    expect(nextPhase('short-break', 1, DEFAULT_SETTINGS).phase).toBe('focus');
  });
  it('从 long-break 结束 → 回到 focus', () => {
    expect(nextPhase('long-break', 4, DEFAULT_SETTINGS).phase).toBe('focus');
  });
  it('long-break 结束后 focusCompleted=false（不标记focus完成）', () => {
    const r = nextPhase('long-break', 4, DEFAULT_SETTINGS);
    expect(r.phase).toBe('focus');
    expect(r.focusCompleted).toBe(false);
  });
});

describe('Pomodoro workflow', () => {
  it('requires a Focus Task before a Pomodoro Cycle can start', () => {
    expect(canStartPomodoro(defaultTimerState())).toBe(false);
    expect(canStartPomodoro({ ...defaultTimerState(), currentTaskId: 'task-1' })).toBe(true);
  });

  it('starts a Pomodoro Cycle with a full focus duration', () => {
    const now = 1000;
    const next = startPomodoroCycle({ ...defaultTimerState(), currentTaskId: 'task-1' }, DEFAULT_SETTINGS, now);

    expect(next?.phase).toBe('focus');
    expect(next?.status).toBe('running');
    expect(next?.endTime).toBe(now + 25 * 60_000);
  });

  it('focus completion waits for Completion Review instead of auto-starting a break', () => {
    const state = {
      ...defaultTimerState(),
      phase: 'focus' as const,
      status: 'running' as const,
      currentTaskId: 'task-1',
      endTime: 1000,
    };

    const next = completeRunningPhase(state);

    expect(next.status).toBe('awaiting-review');
    expect(next.phase).toBe('focus');
    expect(next.endTime).toBeNull();
  });

  it('break completion waits for Phase Confirmation before the next cycle', () => {
    const state = {
      ...defaultTimerState(),
      phase: 'short-break' as const,
      status: 'running' as const,
      currentTaskId: 'task-1',
      endTime: 1000,
    };

    const next = completeRunningPhase(state);

    expect(next.status).toBe('awaiting-next-cycle');
    expect(next.phase).toBe('short-break');
    expect(next.endTime).toBeNull();
  });
});

describe('normalizeSettings', () => {
  it('keeps Pomodoro Rhythm settings inside bounded ranges', () => {
    const s = normalizeSettings({
      focusMin: 1,
      shortBreakMin: 99,
      longBreakMin: 1,
      longBreakInterval: 99,
    });

    expect(s.focusMin).toBe(15);
    expect(s.shortBreakMin).toBe(10);
    expect(s.longBreakMin).toBe(10);
    expect(s.longBreakInterval).toBe(12);
  });
});
