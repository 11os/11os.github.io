# 博客技术栈调研与迁移规划

> 调研日期：2026-10-26　调研范围：2026 年活跃维护的主流博客技术栈
> 目标站点：`11os.github.io`（GitHub Pages 纯静态托管）
> 当前栈：VitePress `0.16.1`（2023 年发布，官方 `latest` 已是 `1.6.4`）

---

## 0. 结论速览

| 路线 | 2026 活跃度 | 迁移工作量 | 长期维护成本 | 建议 |
|---|---|---|---|---|
| **Hugo + Stack 主题** | ✅ 月度发版 | 1–2 天 | 最低（单二进制） | **首选** |
| **Astro + Retypeset 主题** | ✅ 2026-10-15 发 7.4 | 2–3 天 | 中（Node 版本税） | 中文排版优先时选它 |
| **VitePress 1.6.4 原地升级** | ⚠️ 稳定版停在 2025-08 | < 1 小时 | 中低 | 兜底 / 过渡方案 |
| VitePress 2.0.0-alpha | ⚠️ 21 个月 21 个 alpha，未出正式版 | — | — | **不作为目标** |
| Gatsby / Next.js / Zola / fumadocs | — | — | — | 已排除，理由见 §4 |

> **一个必须先澄清的前提**：你的要求是「要 2026 年之后的」。若严格按「2026 年及以后发布且仍在维护」筛选，VitePress 稳定版 `1.6.4`（2025-08-05）**不满足**——它已 14 个月未更新，v2 仍是 alpha。所以真正的决策是 **Hugo vs Astro**，VitePress 只作为「先不动、以后再说」的兜底。

---

## 1. 现状盘点（实测，非推测）

```
docs/
├── .vitepress/config.js    # module.exports（CommonJS）
├── index.md                # layout: home，hero + features
├── about.md                # 占位
└── posts/index.md          # 空列表
.github/workflows/main.yml  # actions/checkout@v2 + setup-node@v2
                            # → JamesIves/github-pages-deploy-action@4.1.4 推 gh-pages
```

- 内容总量：**3 个 Markdown**，且唯一那篇长文已在本次清理中移除。
- 仓库名 `11os.github.io` = 用户站 → GitHub Pages 根路径部署，**无需 base path**，这是选型的有利条件。
- 本机环境：Node `v22.22.2`、npm `10.9.7`、**无 yarn / 无 go / 无 hugo**。
- 构建产物：`docs/.vitepress/dist`（VitePress）→ `dist/`（Astro）→ `public/`（Hugo）。

---

## 2. 候选技术栈：2026 现状

### 2.1 版本与活跃度（数据源：npm registry / GitHub Releases API，均已核实）

| 技术栈 | 最新稳定版 | 发布日期 | 2026 活跃度 | Node 要求 |
|---|---|---|---|---|
| **Astro** | `7.4.2` | 2026-10-15 | 5 个月发了 4 个大版本 | **≥ 22.23.4** |
| **Hugo** | `0.168.0` | 2026-10-13 | 约月度发版 | 免 Node（需 Go ≥1.18 做 Modules） |
| **VitePress** | `1.6.4` | 2025-08-05 | 停更 14 个月 | 22+（文档口径） |
| VitePress v2 | `2.0.0-alpha.21` | 2026-10-25 | 21 个月未出正式版 | 22+ |
| Eleventy | `3.1.7` | 2026-10-15 | 改名 **Build Awesome** | ≥18 |
| Nuxt / Content | `4.6.2` / `3.16.2` | 2026-10 | 活跃 | ≥22.22 |
| SvelteKit | `3.1.0` | 2026-10-14 | 活跃 | ≥22.17 |
| Next.js | `16.4.3` | 2026-10-23 | 活跃 | ≥20.9 |
| Gatsby | `5.16.1` | 2026-02-10 | **近一年周提交近零，实质停更** | — |
| Zola | `0.23.6` | 2026-09-12 | 活跃但主题生态最弱 | 免 Node |

### 2.2 Astro 7.x 关键特性

| 版本 | 日期 | 要点 |
|---|---|---|
| 7.0 | 2026-06-22 | Vite 8（Rolldown）；`.astro` 编译器 **Go → Rust**（Oxc + Lightning CSS）；Markdown 管线换 Sätteri；Advanced Routing；后台 dev server |
| 7.1 | 2026-07-16 | 细粒度 CSP；`paginate()` 可控 URL 形状；`glob()` loader 新增 `deferRender` |
| 7.2 | 2026-08-06 | **实验性增量静态构建**；`session: false`；`astro preview --background` |
| 7.3 | 2026-09-03 | `--ignore-lock`；logger 注入 image service |
| 7.4 | 2026-10-15 | `--timings`；构建期/运行时图片服务分离；**实验性并行预渲染**；`notFound()` 自定义入口 |

**Astro 6 已彻底移除 legacy content collections**：`src/content/config.ts` → `src/content.config.ts`、`loader` 必填、`entry.slug` → `entry.id`、`entry.render()` → 导入的 `render(entry)`。7.0 起 Markdown 默认处理器由 unified → **Sätteri**（仍在 0.10.x 快迭代，MDX + 数学公式有边缘 case 已知 bug）。

### 2.3 中文博客主题生态（本次最关键的调研项）

**Hugo 侧**：

| 主题 | Star | 最近 push | 状态 |
|---|---|---|---|
| **CaiJimmy/hugo-theme-stack** | 6,482 | 2026-05-25 | ✅ **无条件推荐**，多语言 + RTL 开箱，评论系统内置 **14 种** provider |
| alex-shpak/hugo-book | 4,098 | 2026-10-25 | ✅ 活跃，需 Hugo 0.158+ |
| hugo-fixit/FixIt | 1,120 | 2026-10-26 | ✅ 活跃，中文文档完善 |
| olOwOlo/hugo-theme-even | 2,087 | 2024-12-02 | ⚠️ 近两年未更新 |
| hugo-theme-jellyfish / icarry / HugoBlox | — | — | ❌ **仓库已 404**（GitHub 全局搜索也查无此仓，别再考虑） |

**Astro 侧**：

| 主题 | Star | 最近 push | Astro 版本 | 中文排版 |
|---|---|---|---|---|
| **radishzzz/astro-theme-retypeset** | 712 | 2026-04-12 | `^6.1.5` | ⭐ 最强：自动 CJK/英文混排空格与标点、CJK 摘要分档、Noto Sans SC 子集 |
| satnaing/astro-paper | 5,152 | 2026-10-21 | `^7.0.3` | 无专门 CJK 优化 |
| saicaca/fuwari | 5,117 | 2026-03-10 | astro 5 + Tailwind 3 | 已停滞 7 个月 |

**评论系统**（三栈通用，优先级最高）：**Giscus** 最省事——纯配置、零自建服务器、只需仓库开启 GitHub Discussions。Waline / Twikoo 需额外部署服务。Stack 主题已内置 Giscus。

**搜索**：Hugo Stack 用自研 `search.json`（零依赖，但无分词/权重能力）；Astro 系统一用 **Pagefind**；VitePress 1.x 内置 MiniSearch，**用 `Intl.Segmenter` 对中日文连续字符分词，中文搜索开箱可用**。

---

## 3. 三条路线的详细评估

### 路线 A：Hugo + Stack 主题

**怎么做**
1. 装 Hugo 单二进制（`0.168.0`），不需要 Node/Go 即可构建。
2. 引入主题：Stack 是标准 Hugo Module（`go.mod`），CI 需 `actions/setup-go`；或本地 `hugo mod vendor` 生成 `_vendor/` 提交入库，实现**构建期零网络**。
3. 迁移 3 个 md：Stack 用 `date`/`slug`/taxonomy 体系，frontmatter 与 VitePress 不同，需重写。
4. 改 CI：`baseURL` 取 `actions/configure-pages@v6` 的 `steps.pages.outputs.base_url`；产物 `public/`；上传 `./public` 到 `actions/upload-pages-artifact@v5`。

**优势**
- 构建毫秒级，产物纯 HTML + CSS，**零客户端框架运行时**。
- 单二进制 = 供应链面最小、十年后仍能构建。npm 依赖树 = 长期维护风险的主要来源。
- 主题生态 1686 个；Stack 6,482★ 且活跃，中文圈认知度高。
- 评论系统 14 种 provider 全内置，省事程度全场最高。

**代价**
- Go template 模板语言有学习成本（仅改主题参数则感受不到）。
- Hugo Modules 在 CI 依赖 Go 环境（官方 workflow 仅在 `hashFiles('go.mod') != ''` 时装 Go，缺 Go 会直接失败）。

---

### 路线 B：Astro + Retypeset 主题

**怎么做**
1. **升 Node**：本机 `v22.22.2` < Astro 7 要求的 `22.23.4`，Astro CLI 会 `process.exit(1)` 硬失败。
   - 注：Retypeset 锁 `astro ^6.1.5`（要求 `>=22.12.0`），本机版本恰好满足——但等于自愿落后一个大版本。
   - CI 侧安全：`setup-node` 的 `lts/*` 解析到 Node 24.22.1，且 Astro CLI 对 Node 24+ 直接跳过版本检查。
2. 引入 Retypeset（UnoCSS + KaTeX + Mermaid + Partytown）。
3. 迁移到 Content Collections：`src/content/blog/` + `src/content.config.ts`（Zod schema 校验）。
4. 改 CI：Node 24 + `astro build` + Pagefind；产物 `dist/`。
5. 评论：Giscus（需先在仓库开 Discussions）。

**优势**
- **中文排版是全场最优**：自动修 CJK/英文混排空格与标点挤压、摘要按语言分档（CJK 120 字）、Noto Sans SC 子集字体、12 语言 i18n。
- TypeScript + Zod schema 校验，内容字段有类型保障（VitePress 没有）。
- 生态与 DX 现代，图片优化、RSS、sitemap 全套现成。

**代价**
- Node 版本硬门槛：本地要升 Node，CI 要显式锁版本，属长期摩擦。
- 主题只有 712★，**无人做主力维护**，且停在 astro 6（2026-04）落后主流一个大版本。
- 引入 TypeScript 类型检查这一新的构建失败源。
- `sharp` 在 astro 包中是 `optionalDependencies`（pnpm 严格模式需手动装）；MDX 集成有已知 `ERR_MODULE_NOT_FOUND` 依赖声明问题。

---

### 路线 C：VitePress 1.6.4 原地升级（兜底）

**迁移成本实测：约 5 行改动**

| 0.x → 1.x 破坏性变更 | 你的站点 | 要改吗 |
|---|---|---|
| `home: true` → `layout: home` | 已用 `layout: home` | ✅ 不用改 |
| `sidebar.children` → `items` | 已用 `items` | ✅ 不用改 |
| `footer` 移到 `themeConfig.footer` | 已在 `themeConfig.footer` | ✅ 不用改 |
| **`repo` / `repoLabel` / `editLinks` 被移除** | 用了 `themeConfig.repo` | ❌ **必须改** → 换成 `themeConfig.socialLinks: [{ icon: 'github', link: '...' }]` |
| `lastUpdated` 拆分 | 未用 | ✅ 不用改 |

- `module.exports`（CommonJS）**仍然有效**：VitePress 1.6.4 经 Vite 5.4.14 的 `loadConfigFromFile` 加载，package.json 无 `type` 字段即走 CJS 分支。（注：VitePress 自身是 ESM-only，但你的 config 不 import vitepress，安全。）
- `layout: home` 的 hero / features YAML 语法在 1.6.4 **无变化**，`docs/index.md` 可原样保留。
- 额外白拿：内置本地搜索（`search.provider: 'local'`，MiniSearch + `Intl.Segmenter` 中文分词）、sitemap、Shiki 语法高亮、正确的首页渲染。
- 1.1.0 → 1.6.4 期间**无新增破坏性变更**（破坏性变更集中在 2024-03 的 1.0.0 RC 期）。

**但它不满足你的「2026 年之后」要求**：1.6.4 停在 2025-08-05，且 v2 已 21 个月未出正式版。

---

## 4. 已排除的候选及理由

| 候选 | 排除理由 |
|---|---|
| **Gatsby 5.16.1** | 最后正式版 2026-02-10；GitHub Participation API 显示近一年周提交 0–16 次且大部分为 0 → 事实上的维护模式。GraphQL 数据层对博客纯负担。 |
| **Next.js 16.4.3** | `output:'export'` 不支持 ISR / Server Actions / Draft Mode / 依赖 Request 的 Route Handlers / rewrites / 默认 image loader。App Router 概念负担 + React 运行时，纯静态博客过重。 |
| **Zola 0.23.6** | 技术优秀（Rust 单文件），但官方 themes 仓库仅 81★，主题生态最弱，与「好不好做得好看」的核心诉求直接冲突。 |
| **fumadocs 16.17.8** | 定位是文档站（Orama 搜索 + MDX），做个人博客杀鸡用牛刀，且强绑定 Next 生态。 |
| **VitePress 2.0.0-alpha** | 21 个月发 21 个 alpha 仍未出正式版，破坏性变更已累积 12+ 项（`useData().hash` 移除、`scrollOffset` 移除、`markdown.anchor`/`attrs` 选项重命名、Vite 6→7→8 三连跳）。现在押注 = 押 alpha。 |
| **Eleventy / Build Awesome 3.1.7** | 技术上完全够用，但 2026-03 官方改名导致 `11ty.dev` 与 `build.awesome.me` 文档分裂，v4 alpha 停滞 3+ 个月。改名期是选型的坏时机。 |
| **Nuxt 4 + Content 3** | Content v3 确是全表最强内容层，但整体最重、需 Vue 生态。个人博客用它是杀鸡用牛刀。 |

---

## 5. 决策矩阵

评分 1–5，分高者为优（长期维护风险一列 = 风险越低分越高）。

| 维度 | Hugo + Stack | Astro + Retypeset | VitePress 1.6.4 |
|---|---|---|---|
| **上手成本** | 3 | 2 | ⭐ **5** |
| **中文友好度** | 4（i18n/RTL，中文文档；无自动混排优化） | ⭐ **5**（自动标点空格、CJK 摘要分档、Noto SC 子集） | 4（`Intl.Segmenter` 中文分词内置；无混排优化） |
| **性能**（构建 + 产物） | ⭐ **5**（单二进制毫秒级，零运行时） | 4（产物同为静态，构建慢 1–2 个数量级） | 4（Vite 5，产物略重于 Hugo） |
| **主题颜值** | 4（卡片式，中文圈认知度高） | ⭐ **5**（「重新编排」纸质书排版，中文博客审美标杆） | 3（默认文档主题，个人博客观感偏文档站） |
| **长期维护风险** | ⭐ **5**（单二进制、无供应链面、主题活跃） | 3（Node 门槛频变、主题仅 712★ 且落后大版本） | 4（1.x 破坏性变更已收敛，但 1.x 已停更） |
| **与当前代码连续性** | 1（md/frontmatter/CI 全重写） | 1（全重写） | ⭐ **5**（md 零改动，改动约 5 行） |
| **满足「2026 年之后」** | ✅ | ✅ | ❌（1.6.4 停在 2025-08） |

---

## 6. 推荐

### 首选：Hugo + Stack 主题

理由按权重：

1. **约束匹配度最高**。你的真实场景是「中文个人博客 + 纯静态 + GitHub Pages + 内容少」。Hugo 在这个场景下几乎没有短板，且完全满足「2026 年之后」——`0.168.0` 刚在 13 天前发布。
2. **长期维护成本最低**。单二进制意味着没有 npm 依赖树、没有 Node 版本门槛、没有 `yarn.lock` / `package-lock.json` 冲突（本项目已经在这上面踩过坑）。十年后这个仓库还能构建。
3. **Stack 主题是全场唯一「无条件推荐」项**：6,482★、2026-05 仍有 push、多语言 + RTL 开箱、评论系统 14 种 provider 全内置。
4. 你的内容仅 3 个 md 且刚清空，**现在换栈的边际成本最低**——以后文章多了再换，成本会线性上升。

### 次选：Astro + Retypeset 主题（当且仅当「中文排版质感」是首要诉求）

唯一压倒 Hugo 的理由是中文排版：自动 CJK/英文混排空格与标点、CJK 摘要分档、Noto Sans SC 子集。中文博客的排版细节（首行缩进、标点挤压、字间距）确实是长期痛点，而 Retypeset 是目前唯一把这件事做进工具链的方案。

代价要认：本地需升 Node 到 ≥22.23.4、CI 需显式锁 Node 24、主题仅 712★ 且停在 astro 6、引入 TS 类型检查作为新的失败源。**为排版单独承担 Astro 的 Node 版本税，需要你自己权衡。**

### 兜底：VitePress 1.6.4 原地升级

如果你现在不想动结构、或想等 Astro/Hugo 主题再成熟一版，升级到 1.6.4 只需约 5 行改动、1 小时内完成、md 零改动，白拿中文搜索 + sitemap + Shiki + 正确首页渲染。

但请注意：这**不满足你「2026 年之后」的要求**，v2 押注风险高（21 个月 21 个 alpha）。把它当**过渡方案**而非终局。

---

## 7. 无论选哪条都该做的事（框架无关）

现有 CI 全部过时，且存在一个真实 bug：

| 现状 | 问题 | 应改为 |
|---|---|---|
| `actions/checkout@v2` | Node 12 运行时，GitHub 已废弃 | `actions/checkout@v4` |
| `actions/setup-node@v2` | Node 12 运行时，已废弃 | `actions/setup-node@v4` |
| `cache: "npm"` | 仓库用 `yarn.lock`，**缓存键不匹配，等于没缓存** | `cache: 'yarn'`（或统一改用 npm + 提交 package-lock） |
| `JamesIves/github-pages-deploy-action@4.1.4` | 外部 action 推分支，产物需带 `.nojekyll` | 官方 `actions/configure-pages@v6` + `upload-pages-artifact@v5` + `deploy-pages@v4` |
| 无 `.nojekyll` | 若走 `gh-pages` 分支源且产物有 `_` 开头目录（如 Astro 的 `_astro/`），会被 Jekyll 过滤导致**全站 404** | 显式加 `.nojekyll` |

> 补充：迁到 Astro 时产物目录是 `dist/`（VitePress 是 `docs/.vitepress/dist`），迁到 Hugo 是 `public/`。当前 VitePress 产物用 `assets/` 而非 `_assets/`，所以暂时没踩 Jekyll 坑——**但换栈后一定要加 `.nojekyll`**。

---

## 8. 建议的执行顺序（待你确认后开工）

1. **决策**：在 Hugo / Astro / VitePress 三条路线中拍板。→ 需要你的输入
2. **搭脚手架**：新目录结构 + 依赖声明，**内容保持占位**，先让构建跑通
3. **迁内容**：3 个 md 的 frontmatter 映射到新 schema
4. **改 CI**：按 §7 升级 action 版本、修缓存键、加 `.nojekyll`、切部署方式
5. **上主题**：套用选定主题，站点信息填入
6. **验证**：本地构建 + 本地 preview，比对 URL 结构与移动端表现
7. **保留回滚**：`backup/before-clean` 标签已在，迁移前再打一个新标签

**工作量估算**（我的推断，非查证）：Hugo 路线 1–2 天；Astro 路线 2–3 天；VitePress 路线 < 1 小时。

---

## 附：来源

- Astro 博客 7.0–7.4：https://astro.build/blog/astro-7/ · /astro-710/ · /astro-720/ · /astro-730/ · /astro-740/
- Astro v6 / v7 升级指南：https://docs.astro.build/en/guides/upgrade-to/v6/ · /v7/
- Astro 内容集合：https://docs.astro.build/en/guides/content-collections/
- Astro GitHub Pages 部署：https://docs.astro.build/en/guides/deploy/github/
- VitePress CHANGELOG：https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md
- VitePress 0.x → 1.0 迁移指南：https://github.com/vuejs/vitepress/blob/main/docs/en/guide/migration-from-vitepress-0.md
- Hugo Releases：https://github.com/gohugoio/hugo/releases
- Hugo 部署 GitHub Pages：https://gohugo.io/host-and-deploy/deploy-to-github-pages/
- Hugo Modules：https://gohugo.io/hugo-modules/use-modules/
- Stack 主题：https://github.com/CaiJimmy/hugo-theme-stack （中文站 https://stack.cai.im/zh/）
- Retypeset 主题：https://github.com/radishzzz/astro-theme-retypeset （指南 https://retypeset.radishzz.cc/）
- AstroPaper：https://github.com/satnaing/astro-paper ｜ Fuwari：https://github.com/saicaca/fuwari
- Eleventy 改名：https://www.11ty.dev/ ｜ https://build.awesome.me/blog/
- Next.js 静态导出限制：https://nextjs.org/docs/app/guides/static-exports
- Gatsby 维护状态：https://api.github.com/repos/gatsbyjs/gatsby/stats/participation
- GitHub Pages 发布源与 `.nojekyll`：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- npm registry 实测：vitepress 1.6.4（2025-08-05）· astro 7.4.2（2026-10-15，`engines.node >= 22.23.4`）
