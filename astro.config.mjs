// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// 站点 URL —— 部署时改为你的正式域名（用于生成 sitemap 和 RSS 的绝对地址）
export default defineConfig({
  site: 'https://winter.example.com',
  integrations: [sitemap()],
});
