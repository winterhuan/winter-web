// 内容集合配置 —— 定义博客/工具/产品三类内容的字段与校验规则
// 使用 Astro 5 的 Content Layer API。新增内容只需在对应目录放入 .md 文件。
import { defineCollection, z } from 'astro:content';

// 三类共享的基础字段
const baseSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional().default(false),
});

// 工具/产品共享的扩展字段：外部链接 + 源码仓库 + 站内工具
const projectSchema = baseSchema.extend({
  url: z.string().url().optional(),   // 外部在线试用地址
  repo: z.string().url().optional(),  // 源码仓库
  app: z.boolean().optional(),        // 是否有站内交互工具页（/tools/<slug>/app）
});

const blog = defineCollection({
  type: 'content',
  schema: baseSchema,
});

const tools = defineCollection({
  type: 'content',
  schema: projectSchema,
});

// 产品：在工具基础上增加状态字段（如 beta / live / archived）
const products = defineCollection({
  type: 'content',
  schema: projectSchema.extend({
    status: z.string().optional(),
  }),
});

export const collections = { blog, tools, products };
