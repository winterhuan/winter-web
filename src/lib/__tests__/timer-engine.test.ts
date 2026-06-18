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
