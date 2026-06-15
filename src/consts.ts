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
  { href: '/about', label: '关于' },
] as const;

// 页脚社交链接（留空数组则不显示）
export const SOCIAL_LINKS = [
  { href: 'https://github.com/', label: 'GitHub' },
  { href: 'https://x.com/', label: 'X' },
  { href: '/rss.xml', label: 'RSS' },
] as const;

// 关于页内容 —— 改成你自己的真实信息
export const ABOUT = {
  email: 'hello@winter.example.com',
  // 「现在」：当下在做什么（Now page 概念，只写当前）
  now: '正在打磨一个写作工具，偶尔写点博客，记录想法与学到的技术。',
  // 感兴趣的领域 / 技术栈（用站点现有的 .tag 样式展示）
  interests: ['独立开发', '前端工程', '设计系统', '开发者工具', '写作'],
};
