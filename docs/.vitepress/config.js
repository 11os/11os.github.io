module.exports = {
  base: '/',
  lang: 'zh-CN',
  title: '11os',
  description: "You don't know study",
  themeConfig: {
    repo: '11os/11os.github.io',
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '关于', link: '/about/' }
    ],
    sidebar: [
      {
        text: '文章',
        items: [
          { text: '全部文章', link: '/posts/' }
        ]
      },
      {
        text: '关于',
        items: [
          { text: '关于本站', link: '/about/' }
        ]
      }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 11os'
    }
  }
}
