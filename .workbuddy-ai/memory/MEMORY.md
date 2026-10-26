# 项目长期记忆 — 11os.github.io

## 项目性质

Hugo 个人站点，托管在 GitHub Pages（仓库 `11os/11os.github.io`）。

- 框架：Hugo `0.168.0` **extended**（必须 extended 版，Stack 主题编译 SCSS 依赖 libsass）
- 主题：Stack `v4.0.3`，以 **vendor 方式**提交在 `themes/hugo-theme-stack/`（不用 submodule —— 代理环境 git clone 会 502）
- 站点配置：`config/_default/`（hugo.toml / params.toml / markup.toml）
- 构建产物：`public/`（已 gitignore）
- 部署：`.github/workflows/hugo.yaml`，**只保留官方 `deploy-pages` 链路**（`build` + `deploy` 两个 job），推 master 即发布
- Pages 发布源：**GitHub Actions**（`build_type=workflow`，2026-10-26 用 API 从 legacy/gh-pages 切换过来），远端 `gh-pages` 分支已删除；`github-pages` 环境的分支策略放行 `master`
- **坑（已踩过）**：Pages 源若是「分支（gh-pages）」，`actions/deploy-pages` 必然报 `400 ... Deployments are only allowed from gh-pages`；用 `continue-on-error` 盖住只会让站点静默停更。两条链路只能留一条，改源和改 workflow 要配套

## 内容结构约定

- `content/posts/` — 文章，frontmatter 用 `date`/`slug`/`categories`/`tags`
- `content/about.md`、`content/search.md`、`content/archives.md` — 特殊页面（后两个是 Stack 要求的 layout）
- `assets/img/` — 头像、图标（Stack v4 从 assets 而非 static 读取 favicon/avatar）

## 环境注意

- 本机 Hugo 装在 `C:\Users\1\.workbuddy-ai\binaries\hugo\hugo.exe`，**不在 PATH**，调用要用完整路径。
- **网络坑**：`github.com:443` 被拦截（git push 间歇 502），但 `api.github.com`/`codeload`/`raw.githubusercontent.com` 通。下载资源用 codeload/raw，不要 git clone。
- Hugo 构建毫秒级，无需 Node/yarn/npm。

## Stack v4 必记

- 主题用 `toCSS`（libsass），libsass 在 Hugo 0.153+ 已弃用 —— 需 extended 版 Hugo
- 语言码用 `zh` 而非 `zh-cn`；`hasCJKLanguage = true` 必须开（中文摘要/字数统计正确性）
- favicon/avatar 放 `assets/img/`，路径在 params.toml 里写 `img/favicon.svg`
- 菜单写在 `config/_default/hugo.toml` 的 `[menu]` 段，读 `.Site.Menus.main`
