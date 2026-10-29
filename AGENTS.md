# AGENTS.md — 11os.github.io

Hugo 个人站点（Stack 主题 vendor 在 `themes/`），推 `master` 即由 GitHub Actions 发布到 Pages。
这里只写「不读就会做错」的，其余走引用。

## 开工前先读（存在才读，不存在就跳过）

- **本机长期记忆**：`.agents/memory/MEMORY.md`（与 AI 工具无关，不进仓库）。当天的坑在同目录 `YYYY-MM-DD.md`，**按日期查，别全量读**。

## 外部大脑（brain）

- 根目录：`C:\workspace\brain`（只读引用，不复制进项目；规则索引：`C:\workspace\brain\INSTALL.md`）。
- 分析前读 `profile.md`；领域命中才读 `domains/`；写决策、追根因才读 `memory/decisions/`；单次 ≤3 文件 / ≤12 KB，末尾给「已加载 / 未加载 + 编号」回执。
- 默认只读；只有用户说「brain 学习 / 反哺」才写，写前脱敏。
- 本项目常见领域：`web-frontend`、`software-development`（未命中不读）。

## 命令

Hugo **不在 PATH**，且扩展版版本必须与 `.github/workflows/hugo.yaml` 的 `HUGO_VERSION` 一致：

```powershell
$hugo = 'C:\Users\1\.workbuddy-ai\binaries\hugo\hugo.exe'   # 0.168.0 +extended
& $hugo server --port 1313 --bind 127.0.0.1 --disableFastRender   # 预览
& $hugo build --gc --minify --noBuildLock                        # 构建（CI 同参数，另加 --baseURL）
```

无 Node / npm / go 依赖，不需要装任何东西。构建时的 libsass 弃用告警是**正常**的，别为它去装 Dart Sass（原因见 `.agents/memory/2026-10-28.md`）。

## 仓库约定

| 位置 | 约定 |
|---|---|
| `content/posts/` | 文件名 `YYYY-MM-DD-标题.md`；frontmatter 用 `date` / `slug` / `categories` / `tags`。**`slug` 决定 URL，改它 = 断链** |
| `content/{about,archives,search}.md` | 固定页；`archives`、`search` 的 `layout` 是 Stack 要求的，别动 |
| `config/_default/` | `hugo.toml` / `params.toml` / `markup.toml` |
| `themes/hugo-theme-stack/` | vendor **且已本地改动**（`menu.ts`、`motion.scss` 等）。升级要人工合并，禁止整体覆盖 |
| `static/img/` | 原样直出，Hugo 不处理（没有 srcset 和宽高） |
| `public/`、`resources/`、`.workbuddy-ai/`、`.agents/` | 已 gitignore，不要提交 |

## 发布

- 只有一条链路：CI `build` → 官方 `deploy-pages`。别再引入 gh-pages 分支发布（会 `400 ... Deployments are only allowed from gh-pages`）。
- `origin` 是 SSH：`git@github.com:11os/11os.github.io.git`（本机 HTTPS 连不上 github.com）。查 CI / 删分支走 `api.github.com`。
- **口令边界**：用户说「改 / 写 / 修」只动本地；说「commit push / 发布」才提交推送。

## 不要做

- 不为了顺手优化去改 `themes/` 的上游文件（本地 diff 已经够多），除非用户点名。
- 不手改 `public/`、不绕开 CI 往线上传文件。
- 不把 `.agents/memory/` 的内容复制进本文档或 README —— 引用即可。
