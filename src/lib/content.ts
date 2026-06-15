// 内容查询辅助 —— 统一处理「过滤草稿 + 按日期倒序」逻辑
// 所有列表页和首页都通过这里取数据
import { getCollection, type CollectionEntry } from 'astro:content';

type CollectionName = 'blog' | 'tools' | 'products';

/**
 * 标签归一化：去首尾空白；纯英文/数字标签首字母大写；其余原样
 * 这样 "markdown" / "Markdown" / " Markdown " 会被合并为同一个 "Markdown"
 */
export function normalizeTag(raw: string): string {
  const trimmed = raw.trim();
  // 纯 ASCII 字母+数字 且含字母 → 首字母大写（如 markdown → Markdown）
  if (/^[A-Za-z0-9]+$/.test(trimmed) && /[A-Za-z]/.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

/** 对一个条目的 tags 做归一化 + 去重 */
export function normalizeTags(tags?: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTag(t);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

/** 获取某集合已发布的条目（排除草稿），按日期倒序 */
export async function getPublished<K extends CollectionName>(
  name: K
): Promise<CollectionEntry<K>[]> {
  const entries = await getCollection(name, ({ data }) => import.meta.env.PROD ? data.draft !== true : true);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 取最新 N 条 */
export async function getLatest<K extends CollectionName>(name: K, n: number) {
  const all = await getPublished(name);
  return all.slice(0, n);
}

/** 获取某集合的全部标签（归一化后），按出现次数倒序，次数相同按字母序 */
export async function getAllTags(name: CollectionName): Promise<{ tag: string; count: number }[]> {
  const entries = await getPublished(name);
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of normalizeTags(entry.data.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 按标签过滤某集合的条目（标签经归一化匹配） */
export async function getByTag(name: CollectionName, tag: string) {
  const target = normalizeTag(tag);
  const entries = await getPublished(name);
  return entries.filter((e) => normalizeTags(e.data.tags).includes(target));
}

/** 跨所有集合获取标签统计，按总出现次数倒序 */
export async function getAllTagsGlobal(): Promise<{
  tag: string;
  count: number;
  collections: { name: CollectionName; count: number }[];
}[]> {
  const names: CollectionName[] = ['blog', 'tools', 'products'];
  const perCollection = await Promise.all(names.map((n) => getAllTags(n)));

  const merged = new Map<string, { tag: string; count: number; collections: { name: CollectionName; count: number }[] }>();
  names.forEach((name, i) => {
    for (const { tag, count } of perCollection[i]) {
      const existing = merged.get(tag);
      if (existing) {
        existing.count += count;
        existing.collections.push({ name, count });
      } else {
        merged.set(tag, { tag, count, collections: [{ name, count }] });
      }
    }
  });
  return [...merged.values()].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag)
  );
}
