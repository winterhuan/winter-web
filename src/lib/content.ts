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
