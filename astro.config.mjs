// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// 站点 URL —— 用于生成 sitemap 和 RSS 的绝对地址
// 如果绑定了自定义域名，改成你自己的域名即可
export default defineConfig({
  site: 'https://winter-web.pages.dev',
  integrations: [sitemap()],
});
