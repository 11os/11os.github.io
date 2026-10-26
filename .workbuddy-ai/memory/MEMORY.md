# 项目长期记忆 — 11os.github.io

## 项目性质

VitePress 个人站点，托管在 GitHub Pages（仓库 `11os/11os.github.io`）。

- 框架：VitePress `^0.16.1`（`docs/` 为 docs 目录，配置在 `docs/.vitepress/config.js`）
- 包管理：yarn（`yarn.lock` 是唯一 lockfile，CI 用 `yarn install`）
- 脚本：`docs:dev` / `docs:build` / `docs:serve`
- 部署：`.github/workflows/main.yml`，master 推送时构建 → 部署到 `gh-pages` 分支
- 构建产物目录：`docs/.vitepress/dist`（临时产物，用完应清理）

## 内容结构约定

- `docs/index.md` — 首页（`layout: home`）
- `docs/posts/` — 文章目录，文件名约定 `YYYY-MM-DD-标题.md`
- `docs/about.md` — 关于页

## 环境注意

- 本机无 yarn，用 npm 安装依赖；装完必须 `git checkout -- yarn.lock` 并删除 `package-lock.json`。
