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
  { href: 'https://github.com/winterhuan', label: 'GitHub' },
  { href: 'https://x.com/WinterChenHuan', label: 'X' },
  { href: '/rss.xml', label: 'RSS' },
] as const;

// 关于页内容 —— 改成你自己的真实信息
export const ABOUT = {
  email: 'winterchenhuan@gmail.com',
  intro: [
    '我把这个站点当作一个长期更新的工作台：写下正在思考的问题，发布可以直接使用的小工具，也记录那些逐步成形的产品。',
    '我更关心朴素但耐用的东西：清楚的问题定义、少一点噪音的界面、能被反复使用的工作流，以及能真正帮人开始和完成的产品。',
  ],
  // 「现在」：当下在做什么（Now page 概念，只写当前）
  now: '正在打磨一个写作工具，偶尔写点博客，记录想法与学到的技术。',
  currentFocus: [
    '完善 Inkwell，让半成品草稿更容易被整理成可发布的 Markdown。',
    '继续改进 Focus，把番茄钟做成轻量但有边界感的专注教练。',
    '把独立开发、前端工程和产品设计里的经验写成可复用的笔记。',
  ],
  focusAreas: [
    {
      title: '博客',
      description: '记录技术判断、产品取舍和独立开发过程中的复盘。',
      href: '/blog',
    },
    {
      title: '工具',
      description: '做一些打开即用的小工具，解决具体、明确、频繁出现的问题。',
      href: '/tools',
    },
    {
      title: '产品',
      description: '把反复出现的工作流打磨成更完整、更稳定的产品体验。',
      href: '/products',
    },
  ],
  principles: [
    '先把问题说清楚，再决定要不要写代码。',
    '界面应该帮助人进入状态，而不是抢走注意力。',
    '默认从小版本开始，让真实使用反馈推动下一步。',
  ],
  // 感兴趣的领域 / 技术栈（用站点现有的 .tag 样式展示）
  interests: ['独立开发', '前端工程', '产品设计', '设计系统', '开发者工具', '写作工作流'],
  contactNote: '如果你对这里的文章、工具或产品有反馈，欢迎直接发邮件。简短、具体的问题最容易得到回复。',
};
