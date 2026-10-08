# 落地页与脚本面板的风格同源说明

> 结论先说：**落地页的样式不是另写的一套**，而是从 `D-Whaler.user.js` 的真实 CSS 里提取出来的。
> 变量、圆角、玻璃参数、动效时长、背景图，全部逐字对齐。

---

## 一、为什么需要"提取"而不是"手抄"

面板样式在脚本里是**字符串拼接**的（编译产物），源码里长这样：

```js
LAYOUT_CSS_PARTS.push(
  "\n/* ==== v0.4.11 liquid glass ==== */"
  + "\n.main-page{--lg-rim:rgba(255,255,255,.30);--lg-edge:rgba(140,200,255,.22);...}"
);
```

手抄变量必然漂移——脚本改一次，落地页就对不上了。
所以做法是**真求值**：把 `LAYOUT_CSS_PARTS` 的数组字面量与全部 `.push()` 实参交给 Node 拼起来，
得到的 CSS 与浏览器运行时**完全相同**。

```bash
node scripts/extract_panel_css.js          # 打印 token
node scripts/extract_panel_css.js --dump   # 同时写出 _real_panel.css
```

脚本会跳过字符串内的括号与转义，因此数组截取是准确的。

---

## 二、提取结果

拼接产出 **179894 字符**的真实 CSS，包含：

### 变量（落地页 `landing.css` 的 `:root` 逐字采用）

| 变量 | 值| 用途 |
|:--|:--|:--|
| `--hx-cyan` | `#38e2ff` | 主色·强调、状态灯 |
| `--hx-blue` | `#4a8cff` | 辅助蓝 |
| `--hx-violet` | `#9b6bff` | 次强调·渐变末端 |
| `--hx-pink` | `#ff6bc4` | 备用粉 |
| `--hx-ink` | `#e8f4ff` | 主文字|
| `--hx-ink-dim` | `#9fb4d0` | 次要文字 |
| `--hx-line` | `rgba(120,190,255,.18)` | 描边 |
| `--hx-glass` | `rgba(16,28,54,.55)` | 玻璃底 |
| `--hx-glass-2` | `rgba(22,38,70,.42)` | 次级玻璃底 |
| `--lg-rim` | `rgba(255,255,255,.30)` | 玻璃高光边 |
| `--lg-edge` | `rgba(140,200,255,.22)` | 玻璃外缘 |
| `--lg-tint-hi` | `linear-gradient(155deg,...)` | 玻璃斜向着色 |
| `--lg-shadow-hi` | `0 12px 28px ...,0 0 20px rgba(56,226,255,.16),inset...` | 玻璃投影+辉光 |
| `--lg-t` | `background .28s ease,border-color .28s ease,...` | 统一过渡 |

### 圆角（按脚本内实际出现频次）

`20px`×12 · `50%`×9 · `12px`×9 · `8px`×8 · `9px`×7 · `10px`×7 · `2px`×5 · `14px`×4

落地页的卡片用 20px、截图卡 16px、内层块 12px，均落在脚本的常用值上。

### 动效

脚本共 19 个关键帧，落地页复用了其中与背景/状态相关的：

| 脚本关键帧 | 落地页用途 |
|:--|:--|
| `hxBgBreathe` | 页面背景 13s 呼吸（与脚本 `--hx-bg` 层同参数） |
| `hxHeroGlowA` / `hxHeroGlowB` | 双色随相呼吸光团 |
| `hxPulse` | 主标题辉光脉动 |
| `hxDotPulse` | 功能卡前的状态灯 |

---

## 三、背景图：字面同源

脚本里 `--hx-bg` / `--hx-hero` 是两张**内嵌 data URI**。把它们原样解码出来：

| CSS 变量 | 提取产物 | SHA256 前16 位 | 与原有 assets 的关系 |
|:--|:--|:--|:--|
| `--hx-bg` | `assets/panel-bg.jpeg` | `2b7acca2fdb3c32e` | **与 `bg_main.jpg` 完全相同** |
| `--hx-hero` | `assets/panel-hero.jpeg` | `cc7463595766db28` | **与 `bg_hero.jpg` 完全相同** |

也就是说，仓库里原先那两张图本来就是脚本内嵌图的副本；
落地页现在用的是「从脚本里提取出来的原件」，SHA256 与脚本内数据逐字节一致。

---

## 四、维护约定

改动脚本样式后，**必须重跑**：

```bash
node scripts/extract_panel_css.js
# 比对输出与 landing/landing.css 的 :root 是否一致
```

若脚本改了配色或玻璃参数，同步更新 `landing/landing.css` 顶部的`:root` 块，
并在该块注释里标注「同步自脚本 <版本>」。

---

## 五、截图素材的来源与脱敏口径

`assets/shots/*.webp` 共 11 张，全部为**面板本体实机截图**（`650×1030` 左右）。

这批图的好处是**源文件就已经是面板裁剪版**，不含浏览器标签栏、地址栏、
课程列表，因此天然没有学号与校名——不需要从整屏截图二次裁剪。

| 文件 | 对应界面 |
|:--|:--|
| `panel-pet.webp` | 鲸娘页 · 形象与账户余额 |
| `panel-answer.webp` | 章节测验 · 已答 |
| `panel-query.webp` | 章节测验 · 查询中 |
| `panel-config.webp` | 配置页 · AI Key 与好感度进度 |
| `panel-toggles.webp` | 配置页 · 任务与倍速开关 |
| `panel-guide.webp` | 引导页 · 填写 API Key |
| `panel-terms.webp` / `panel-terms2.webp` | 须知页 · 六项声明前后半 |
| `panel-log-boot.webp` / `panel-log-run.webp` | 状态页 · 启动拆解 / 章节推进 |
| `panel-mini.webp` | 最小化态 · 悬浮胶囊 |

压缩策略：PNG → WebP `quality=88, method=6`，5.8 MB → 508 KB（省 91%）。
重新生成用 `python _audit/build_shots.py`（脚本内含文件名→展示名的映射表）。

⚠️ 截图中的**账户余额、累计花费、token 数是真实数据**，经作者确认原样保留。
若后续要改为打码，参考 `_audit/make_shots.py` 里的 `pixelate()`。

---

## 六、构建脚本的删档陷阱（已修，勿回退）

`_build_site.py` 早期版本对 `docs/` 执行 `shutil.rmtree(t)`，
**连带删掉了 `docs/` 下手工维护的 `PANEL_STYLE.md`**，
而 README 正在引用它——若不察觉，推送后 README 会指向一个不存在的文件。

现在的做法：**只清理生成物**（`*.html` / `*.css` / 目录），
`docs/` 根下的 `.md` 等非生成文件一律保留。

⇒ 教训：`docs/` 同时承担「Pages 发布源」与「手工文档」两个职责，
清理时必须按**文件类型**而非**整目录**删除。