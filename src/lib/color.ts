// 调色板生成算法 —— HSL 色彩空间插值
// 输入一个基础色（hex），生成 50–950 的完整色阶
// 仿 Tailwind 风格：500 是基础色，向 50 渐亮、向 950 渐暗，同时微调饱和度

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

/** Tailwind 风格的色阶档位 */
export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ShadeStep = (typeof SHADE_STEPS)[number];

// ─── 颜色格式转换 ───────────────────────────────────────────

/** hex → RGB，支持 #rgb / #rrggbb */
export function hexToRgb(hex: string): RGB | null {
  const m = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(m)) return null;
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** RGB → hex */
export function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** RGB → HSL（h: 0-360, s/l: 0-100） */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** HSL → RGB */
export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = ((h % 360) + 360) % 360 / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

/** hex → HSL（便捷组合） */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

// ─── 色阶生成 ───────────────────────────────────────────────

/**
 * 每个档位的目标亮度（HSL 的 L），灵感来自 Tailwind 色阶分布
 * 500 档保持基础色自身的亮度
 */
const TARGET_LIGHTNESS: Record<ShadeStep, number> = {
  50: 97, 100: 94, 200: 86, 300: 75, 400: 63,
  500: -1, // -1 表示用基础色自身的亮度（锚点）
  600: 46, 700: 38, 800: 30, 900: 22, 950: 14,
};

/**
 * 从基础色生成完整色阶。
 * 500 = 基础色原样；其余档位在基础色 HSL 基础上调整：
 *  - 亮度 L：按 TARGET_LIGHTNESS 设定
 *  - 饱和度 S：两端略微降低（更亮/更暗时颜色感会减弱，补偿它）
 */
export function generatePalette(baseHex: string): Record<ShadeStep, string> | null {
  const baseHsl = hexToHsl(baseHex);
  if (!baseHsl) return null;

  const result = {} as Record<ShadeStep, string>;
  for (const step of SHADE_STEPS) {
    let { h, s, l } = baseHsl;
    const targetL = TARGET_LIGHTNESS[step];
    if (targetL >= 0) l = targetL;
    // 两端略微降饱和，避免极亮/极暗时颜色发死
    if (step <= 200) s = Math.max(20, s - (500 - step === 500 ? 0 : (5 - step / 100) * 2));
    if (step >= 700) s = Math.max(15, s - (step - 600) * 1.5);
    result[step] = rgbToHex(hslToRgb({ h, s: Math.min(100, s), l }));
  }
  return result;
}

// ─── 导出格式化 ─────────────────────────────────────────────

/** 导出为 CSS 自定义属性 */
export function toCSSVariables(name: string, palette: Record<ShadeStep, string>): string {
  const lines = SHADE_STEPS.map((step) => `  --color-${name}-${step}: ${palette[step]};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

/** 导出为 Tailwind config 对象 */
export function toTailwindConfig(name: string, palette: Record<ShadeStep, string>): string {
  const lines = SHADE_STEPS.map((step) => `        ${step}: '${palette[step]}',`);
  return `${name}: {\n${lines.join('\n')}\n      },`;
}

/** 导出为 JSON 数组 */
export function toJSON(palette: Record<ShadeStep, string>): string {
  return JSON.stringify(
    SHADE_STEPS.map((step) => ({ step, hex: palette[step] })),
    null,
    2
  );
}

/** 随机生成一个悦目的基础色 hex（中等饱和度+亮度） */
export function randomBaseColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 30); // 55-85%
  const l = 45 + Math.floor(Math.random() * 15); // 45-60%
  return rgbToHex(hslToRgb({ h, s, l }));
}
