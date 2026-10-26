# Hugo + Stack 主题：GitHub Actions 编译可行性结论

> 调研日期：2026-10-26　针对方案：Hugo `0.168.0` + Stack 主题 `v4.0.3`
> 目标：部署到 `11os.github.io`（用户站，根路径，无需 base path）

---

## 一句话结论

**可以，而且这是 Hugo 最成熟、官方支持最好的部署路径。** 官方 Hugo 文档就有一份现成的 `hugo.yaml` workflow 可以直接抄。

但有 **3 个必须注意的坑**，其中第 1 个会在你按下「Run workflow」时直接让构建失败。

---

## 三个必须知道的坑

### 坑 1（致命）：必须用 Hugo **extended** 版，或额外装 Dart Sass

Stack 主题编译 SCSS 的代码是（`layouts/_partials/head/style.html`）：

```go-html-template
{{ $sass := resources.Get "scss/style.scss" }}
{{ $style := $sass | toCSS | minify | resources.Fingerprint "sha256" }}
```

注意 `toCSS` **没有传 `transpiler` 参数** → 走 Hugo 默认值 `libsass`。

而 Hugo 官方文档明确写着：

> Transpile Sass to CSS using the LibSass transpiler **included in Hugo's extended and extended/deploy editions**, or install Dart Sass.
> The embedded LibSass transpiler was **deprecated in v0.153.0** and will be removed in a future release.
> （https://gohugo.io/functions/css/sass/）

LibSass **只存在于 extended 版**。所以：

- 用**标准版** Hugo → 主题的 SCSS 编译直接报错，站点样式全废。
- Hugo `0.168.0` 的 release 里确实有独立的 extended 包：`hugo_extended_0.168.0_linux-amd64.tar.gz`（同时也有 `hugo_extended_withdeploy_...`）。

**但还有一个更麻烦的点**：Stack v4.0.3 发布于 2026-05-25，而 LibSass 在 Hugo `v0.153.0` 就被弃用了。Stack 的 v4 release notes 里**完全没有提 Dart Sass / transpiler 迁移**（我逐条核对了 40+ 条 changelog）。也就是说：**Stack 目前仍依赖一个已被弃用的编译路径**。

> 这一点是后续风险：等 Hugo 移除 LibSass，Stack 需要自己改成 `toCSS (dict "transpiler" "dartsass")`。这不影响你现在开工，但要知道主题侧有这笔技术债。

**应对方案（三选一，推荐第 1 个）**：

| 方案 | 做法 | 评价 |
|---|---|---|
| **A. 用 extended 版**（推荐） | 下载 `hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz` | 一个二进制搞定，零额外依赖。官方 workflow 里 `HUGO_VERSION` 那行改个文件名即可 |
| B. 装 Dart Sass | 额外下载 dart-sass 并加进 `GITHUB_PATH` | 官方 workflow 本来就有这一步，但**注意：Stack 的 `toCSS` 没指定 transpiler，装了 Dart Sass 也不一定会被采用**（Hugo 对未指定 transpiler 的调用仍按 libsass 走） |
| C. 提交 `resources/` 目录 | 预先在本地编译好 CSS 提交入库 | 官方文档提到的例外方案，能跳过 CI 编译，但每次改样式都要手动提交，体验差 |

> 关于官方 workflow 里为什么既装了 Dart Sass 又用标准版 Hugo：那是官方通用模板，**对你的 Stack 场景需要改成 extended 版**。

### 坑 2：Stack v4 用的是 Hugo **新模板系统**，配置是 TOML

Stack v4.0.0（2026-04-26）是一次大重构，**breaking changes 很多**：

| 变更 | 详情 |
|---|---|
| **模板路径全面改版** | `layouts/_default/list.html` → `layouts/list.html`；`layouts/partials/...` → `layouts/_partials/...`；`layouts/shortcodes/...` → `layouts/_shortcodes/...` |
| **配置 YAML → TOML** | 主题默认配置在 `config/_default/` 下拆成多文件（`hugo.toml` / `params.toml` / `menu.toml` / `markup.toml` / `languages.toml` / `related.toml`）。你自己仍可用 YAML，Hugo 会透明转换 |
| **Hugo Modules 路径变了** | `github.com/CaiJimmy/hugo-theme-stack/v3` → **`/v4`** |
| **语言代码改名** ⚠️ | `zh-cn` → **`zh`**，`zh-hk` → `zh-hant-hk`，zh-tw` → `zh-hant-tw`（对齐 gohugoio/locales） |
| `hidden: true` 被移除 | 改用 Hugo 原生 `build: list: never` |
| `featuredImageField` 被移除 | 图片统一放 `image` 字段 |
| `sidebar.avatar` 简化 | 嵌套对象 → 字符串路径 `avatar = "img/avatar.png"` |
| favicon 位置变更 | 从 `static/` → `assets/` |
| `imageProcessing.cover` → `imageProcessing.thumbnail` | |
| `defaultImage.*` / `opengraph.local` / `opengraph.src` 被移除 | 需自己写 override |
| Vibrant.js 被移除 | 改用 Hugo 原生图片处理 |

> **对你的站点**：你目前没有 Stack 站点，所以这些「迁移」成本为零——直接按 v4 的新结构建站即可。但**语言代码那条要留意**：Stack v4 用 `zh` 而非 `zh-cn`，配错会导致日期本地化不生效。

**额外收获**：Stack v4 依赖 Hugo 的本地化日期格式（`:date_full`），且官方明确说 `hasCJKLanguage = true` 时 `.Summary` 和 `.WordCount` 才会对中日文正确计数——**这是你中文博客必须开的开关**。

### 坑 3：Hugo Modules 需要 Go，CI 要装

Stack v4 是标准 Hugo Module（`go.mod`：`module github.com/CaiJimmy/hugo-theme-stack/v4`，`go 1.17`，**零依赖**）。

用 Hugo Modules 时，官方 workflow 有一行关键条件：

```yaml
- name: Install Go
  if: hashFiles('go.mod') != ''
  uses: actions/setup-go@v7
```

**有 `go.mod` 但没装 Go → 构建直接失败。** 好在 Stack v4 自身零依赖，不会有额外的 Go module 拉取负担。

**替代方案：git submodule**（不用 Go，也不用 Go 依赖网络）
```bash
git submodule add https://github.com/CaiJimmy/hugo-theme-stack/ themes/hugo-theme-stack
```
CI 侧 `actions/checkout` 加 `submodules: recursive` 即可。**对你这种单人站，submodule 其实更省事**：版本天然锁定、升级只需 `git submodule update --remote`、不引入 Go 工具链。

---

## 可直接使用的 workflow

基于 Hugo 官方 2026-10-10 更新的官方 workflow，**针对 Stack 主题做了三处必要修改**（extended 版 Hugo、语言代码、模块路径）。

```yaml
name: Build and deploy

env:
  HUGO_VERSION: 0.168.0
  GO_VERSION: 1.27.2
  DART_SASS_VERSION: 1.105.1
  TZ: Asia/Shanghai

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
        with:
          submodules: recursive
          fetch-depth: 0
          lfs: false

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v6

      - name: Install Go
        if: hashFiles('go.mod') != ''
        uses: actions/setup-go@v7
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: false

      - name: Install Hugo (extended)
        run: |
          echo "Installing Hugo ${HUGO_VERSION} (extended)..."
          curl -sfL --output-dir "${{ runner.temp }}" -O "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
          mkdir "${HOME}/.local/hugo"
          tar -C "${HOME}/.local/hugo" -xf "${{ runner.temp }}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
          echo "${HOME}/.local/hugo" >> "${GITHUB_PATH}"

      - name: Install Dart Sass
        run: |
          echo "Installing Dart Sass ${DART_SASS_VERSION}..."
          curl -sfL --output-dir "${{ runner.temp }}" -O "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
          tar -C "${HOME}/.local" -xf "${{ runner.temp }}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
          echo "${HOME}/.local/dart-sass" >> "${GITHUB_PATH}"

      - name: Log tool versions
        run: |
          hugo version
          hugo env
          go version 2>/dev/null || echo "Go: not installed"

      - name: Build
        run: |
          hugo build \
            --gc \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/" \
            --cacheDir "${{ runner.temp }}/.cache/hugo"

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          include-hidden-files: false
          path: ./public

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

### 与你现有 CI 的差异

| 现状 | 改为 | 原因 |
|---|---|---|
| `actions/checkout@v2` | `actions/checkout@v7` | v2 运行时（Node 12）已被 GitHub 废弃 |
| `actions/setup-node@v2` | 移除 | Hugo 不需要 Node |
| `cache: "npm"` | 移除 / 改 Hugo cacheDir | 仓库用 `yarn.lock`，缓存键不匹配等于没缓存 |
| `JamesIves/github-pages-deploy-action@4.1.4` | `configure-pages@v6` + `upload-pages-artifact@v5` + `deploy-pages@v5` | 改用 GitHub 官方 Pages 发布链路 |
| 无 | `--baseURL "${{ steps.pages.outputs.base_url }}/"` | 官方自动注入，适配用户站/项目站 |
| 无 | `hugo_extended_` | **关键**：Stack 需要 extended 版编译 SCSS |

---

## 还需要注意的部署细节

### `.nojekyll` 要不要加？

**用上面的官方 `deploy-pages` 链路 → 不需要**（不经 Jekyll）。官方 workflow 里 `upload-pages-artifact` 有 `include-hidden-files: false`，这会自动排除 `.nojekyll` 之类的隐藏文件，正好也意味着 Jekyll 不会介入。

**但如果你改用 `gh-pages` 分支源**（像你现在这样）→ **必须加 `.nojekyll`**。Stack 产物里有 `_` 开头的目录吗？Stack v4 的资源目录是 `assets/` 而非 `_astro/`，风险低于 Astro，但官方文档仍建议：走分支源就加 `.nojekyll`，最省心。

→ **建议**：既然要改，直接切到官方 `deploy-pages` 链路，一步到位且不用记 `.nojekyll`。

### 仓库设置

去 `Settings → Pages → Source` 选 **GitHub Actions**。不改的话 workflow 跑完也不会部署。

### baseURL

你的仓库名是 `11os.github.io` = **用户站**，部署在根路径 `https://11os.github.io/`。
→ `baseURL` 保持 `https://11os.github.io/`，**不需要加子路径**。
→ workflow 里的 `--baseURL "${{ steps.pages.outputs.base_url }}/"` 会自动填对。

---

## 站点配置要点（Stack v4）

### `hugo.toml`（站点根目录）

```toml
baseURL                = "https://11os.github.io/"
title                  = "11os"
defaultContentLanguage = "zh"        # ⚠️ v4 用 zh，不是 zh-cn
hasCJKLanguage         = true        # ⚠️ 中文摘要/字数统计正确性
locale                 = "zh"

[[module.imports]]
    path = "github.com/CaiJimmy/hugo-theme-stack/v4"   # ⚠️ v4 路径

[pagination]
    pagerSize = 10

[permalinks]
    post = "/p/:slug/"
    page = "/:slug/"
```

用 submodule 方式装主题的话，删掉 `[[module.imports]]` 段即可（主题已在 `themes/` 下）。

### `config/_default/params.toml`（关键项）

```toml
mainSections   = ["post"]
rssFullContent = true
favicon        = "img/favicon.png"     # ⚠️ v4 放在 assets/ 下

[footer]
    since = 2026

[sidebar]
    avatar   = "img/avatar.png"       # ⚠️ v4 是字符串，不是嵌套对象
    subtitle = "You don't know study."

[widgets]
    homepage = [
        { type = "search" },
        { type = "archives", params = { limit = 5 } },
        { type = "categories", params = { limit = 10 } },
        { type = "tag-cloud", params = { limit = 10 } },
    ]
    page = [{ type = "toc" }]

[comments]
    enabled  = true
    provider = "giscus"               # 需先在仓库开启 GitHub Discussions
    [comments.giscus]
        repo = "11os/11os.github.io"
        repoID = "<你的 repo id>"
        category = "Announcements"
        categoryID = "<你的 category id>"
```

### 目录结构

```
.
├── .github/workflows/hugo.yaml
├── config/_default/          # 或单文件 hugo.toml
│   ├── hugo.toml
│   ├── params.toml
│   ├── menu.toml
│   └── markup.toml
├── content/
│   ├── posts/                # 文章，mainSections = ["post"]
│   │   └── hello-world.md
│   └── about.md
├── assets/img/               # ⚠️ v4：favicon / avatar 放这里
├── static/                   # 其余静态资源
├── themes/hugo-theme-stack/  # 若用 submodule
├── go.mod / go.sum           # 若用 Hugo Modules
└── .gitignore                # 需忽略 public/ 和 resources/
```

**`.gitignore` 要加**（Hugo 官方要求不提交 `public/`）：
```
public/
resources/
.hugo_build.lock
```

---

## 主题引入方式：Modules vs Submodule

| | Hugo Modules | Git Submodule |
|---|---|---|
| 引入 | `go.mod` 里 `[[module.imports]]` | `git submodule add ... themes/hugo-theme-stack` |
| CI 需要 Go | ✅ 需要（`setup-go`） | ❌ 不需要 |
| 版本锁定 | `go.mod` + `go.sum` | submodule 的 git commit |
| 升级主题 | `hugo mod get -u` | `git submodule update --remote` |
| 离线构建 | 需先 `hugo mod vendor` 提交 `_vendor/` | 天然自包含 |
| 目录污染 | 无（模块缓存在 `cacheDir`） | 有 `themes/` 目录 |

**建议用 submodule**。理由：Stack v4 是**零依赖**的单模块（`go.mod` 里一条 `require` 都没有），Modules 方式带来的唯一收益是「不用 vendor 也能拉主题」，但你为此要付出 CI 装 Go + 每次构建走网络的代价。submodule 更适合单人站：版本天然锁定、不用装 Go、构建不依赖 GitHub 仓库可达性。

---

## 本地开发环境

本机当前 **没有 Hugo、没有 Go**（实测 `hugo version` / `go version` 均 command not found）。

两条路：

| 方案 | 说明 |
|---|---|
| **装 Hugo extended**（推荐） | 从 https://github.com/gohugoio/hugo/releases 下 `hugo_extended_0.168.0_windows-amd64.zip`，解压即用，无需 Go/Node |
| 用 WorkBuddy 内置二进制管理 | 可装到 `.workbuddy-ai/binaries/` 下隔离运行，不污染系统环境 |

⚠️ **Windows 注意**：解压后需要把该目录加进 `PATH` 才能直接用 `hugo` 命令。另外本机没有 yarn，**Hugo 项目完全不需要 Node/yarn**，这反而是 Hugo 相对 VitePress 的一个实打实的便利——不会再有 lockfile 冲突问题。

---

## 执行清单

1. 装 Hugo extended（本地）
2. 建站：初始化 `hugo.toml` + `config/_default/params.toml` + `content/` 目录
3. 引入主题（推荐 submodule，指向 **v4.0.3** tag）
4. 迁移 3 个 md → Stack 的 frontmatter 体系（`date` / `slug` / `image` / `build.list`）
5. 配评论（Giscus，需先开 GitHub Discussions，拿到 repoID / categoryID）
6. 写 `.github/workflows/hugo.yaml`（用上面那份）
7. 仓库 Settings → Pages → Source 选 GitHub Actions
8. 配好 Giscus 后本地 `hugo server` 验证
9. 推送触发首次部署

---

## 来源

- Hugo 官方部署文档（2026-10-10 更新，含完整 workflow）：https://gohugo.io/host-and-deploy/deploy-to-github-pages/
- Hugo `css.Sass` 文档（LibSass 弃用说明、transpiler 默认值）：https://gohugo.io/functions/css/sass/
- Hugo v0.153.0 release（"tpl/css: Deprecate libsass in favor of dartsass"）：https://github.com/gohugoio/hugo/releases/tag/v0.153.0
- Hugo v0.168.0 assets（含 `hugo_extended_*`）：https://github.com/gohugoio/hugo/releases/tag/v0.168.0
- Hugo Modules 文档（vendor、go.mod 要求）：https://gohugo.io/hugo-modules/use-modules/
- Stack v4 release notes（完整 breaking changes）：https://github.com/CaiJimmy/hugo-theme-stack/releases/tag/v4.0.0
- Stack v4 升级指南：https://stack.cai.im/guide/upgrade-to-v4
- Stack 主题仓库（go.mod、theme.toml min_version=0.157.0）：https://github.com/CaiJimmy/hugo-theme-stack
- Stack demo 配置：https://github.com/CaiJimmy/hugo-theme-stack/tree/master/demo
- Stack 主题 SCSS 编译调用（`toCSS` 无 transpiler）：https://github.com/CaiJimmy/hugo-theme-stack/blob/master/layouts/_partials/head/style.html
- GitHub Pages 发布源配置：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
