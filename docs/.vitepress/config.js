import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '二维码生成器',
  description: '一个简单易用的 Chrome 扩展，可以快速为当前页面 URL、选中文本或链接生成二维码',
  lang: 'zh-CN',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'keywords', content: 'Chrome扩展,二维码生成器,QR Code,浏览器插件' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '功能特性', link: '/guide/features' },
      { text: '使用指南', link: '/guide/usage' },
      { text: '更新日志', link: '/guide/changelog' },
      { text: '技术文档', link: '/guide/technical' },
      { text: '常见问题', link: '/guide/faq' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '功能特性', link: '/guide/features' },
            { text: '使用指南', link: '/guide/usage' },
          ]
        },
        {
          text: '进阶文档',
          items: [
            { text: '技术文档', link: '/guide/technical' },
            { text: '常见问题', link: '/guide/faq' },
            { text: '更新日志', link: '/guide/changelog' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://gitee.com/mdsfe/qrcode-extension' }
    ],

    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2025 mdsfe'
    },

    search: {
      provider: 'local'
    }
  },

  markdown: {
    lineNumbers: true,
  },

  base: '/',
  outDir: '../dist-docs',
})

