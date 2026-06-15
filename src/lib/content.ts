// 内容查询辅助 —— 统一处理「过滤草稿 + 按日期倒序」逻辑
// 所有列表页和首页都通过这里取数据
import { getCollection, type CollectionEntry } from 'astro:content';

type CollectionName = 'blog' | 'tools' | 'products';

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

/** 获取某集合的全部标签，按出现次数倒序 */
export async function getAllTags(name: CollectionName): Promise<{ tag: string; count: number }[]> {
  const entries = await getPublished(name);
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 按标签过滤某集合的条目 */
export async function getByTag(name: CollectionName, tag: string) {
  const entries = await getPublished(name);
  return entries.filter((e) => e.data.tags?.includes(tag));
}
