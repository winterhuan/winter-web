// 阅读时长估算 —— 构建期计算，纯本地，无任何用户追踪
// 中文 ~400 字/分钟，英文 ~200 词/分钟。这里用「去空白字符数」作为近似，
// 对中英混排足够准；最快阅读速度下限为 1 分钟。
const CJK_CHARS_PER_MIN = 400;
const EN_WORDS_PER_MIN = 200;

/**
 * 根据原始 Markdown 正文估算阅读时长（分钟）
 */
export function readingTime(body: string): number {
  // 去掉代码块、图片、链接标记，保留可读文本
  const cleaned = body
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/`[^`]*`/g, ' ')        // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')  // 链接，保留锚文本
    .replace(/[#>*_~\-]/g, ' ');      // Markdown 符号

  // 中文字符（含中日韩）
  const cjk = (cleaned.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  // 英文词数（连续拉丁字母）
  const enWords = (cleaned.match(/[A-Za-z]+/g) || []).length;

  const minutes = cjk / CJK_CHARS_PER_MIN + enWords / EN_WORDS_PER_MIN;
  return Math.max(1, Math.round(minutes));
}

/** 格式化为「约 N 分钟」 */
export function readingTimeLabel(body: string): string {
  return `约 ${readingTime(body)} 分钟`;
}
