// 站点级常量 —— 集中管理，方便你替换成真实信息
// 替换这里的值即可，全站会自动应用。

export const SITE_TITLE = 'Winter';
export const SITE_DESCRIPTION = '思考、工具与作品 —— Winter 的个人网站';

// 你的身份与一句话简介（首页 Hero 区使用）
export const AUTHOR = {
  name: 'Winter',
  tagline: '独立开发者 · 写点代码，做点产品。',
  bio: '这里记录我的博客文章、做的小工具，以及正在做的产品。欢迎随便看看。',
};

// 顶部导航
export const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/blog', label: '博客' },
  { href: '/tools', label: '工具' },
  { href: '/products', label: '产品' },
] as const;

// 页脚社交链接（留空数组则不显示）
export const SOCIAL_LINKS = [
  { href: 'https://github.com/', label: 'GitHub' },
  { href: 'https://x.com/', label: 'X' },
  { href: '/rss.xml', label: 'RSS' },
] as const;
