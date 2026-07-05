# Scroll Performance Audit

生成时间：2026-07-04  
分支：`fix/bilibili-resolver-412`  
范围：仅检查和优化 V2 工作台滚动性能，不改后端、不改解析接口、不新增平台、不重做整体 UI。

## 结论

本次卡顿的主要风险来自视觉层合成成本，而不是业务状态更新：

- 页面有 fixed canvas 粒子背景，原桌面最多 110 个粒子，并且每帧执行粒子连线计算。
- 页面有 fixed `body::before` 扫描光动画，会持续参与合成。
- 页面背景叠加了网格、多个径向渐变和线性渐变。
- 顶部导航、左侧平台栏和多个大面积面板使用 `backdrop-filter: blur(18px)`。
- 多个面板使用较大半径阴影。

未发现：

- `transition: all`
- scroll 事件监听器或滚动时 React state 更新
- 大量结果列表在初始状态一次性渲染
- 未约束尺寸的首屏大图

## P0 / P1 必须修复

| 级别 | 问题 | 位置 | 处理 |
| --- | --- | --- | --- |
| P0 | 移动端仍运行粒子 canvas | `src/lib/client/particleConfig.ts`, `src/components/ParticleField.tsx` | 移动端粒子数改为 0，canvas 不启动动画循环 |
| P1 | 桌面粒子数量和连线计算偏重 | `src/lib/client/particleConfig.ts` | 桌面粒子上限从 110 降到 58，并把动画帧率限制到约 30fps |
| P1 | fixed 扫描光持续动画 | `src/app/globals.css` | 移除 `body::before` 扫描动画 |
| P1 | 大面积 `backdrop-filter: blur(18px)` | `src/app/globals.css` | 移除导航、平台栏和主面板 blur，改用更不透明 surface |
| P1 | 阴影半径和发光过重 | `src/app/globals.css` | 降低全局阴影、状态点发光和主按钮阴影 |
| P1 | 下方内容区离屏也参与渲染 | `src/app/globals.css` | 对结果区、任务区和说明区加入 `content-visibility: auto` |

## 可选优化

- 后续如果结果轨道数量非常多，可以对轨道列表做折叠或分页。
- 可以在成功态截图和真实解析态再补一次长列表滚动 profile。
- 如果服务器使用低端移动设备访问较多，可以在 1120px 以下也关闭粒子，而不只在 720px 以下关闭。

## 不建议改动

- 不建议删除核心平台栏、解析工作台、授权状态和隐私说明，这些是工具型页面的核心任务信息。
- 不建议把页面改成普通白底样式；当前深色工作台风格可以保留，只需要降低渲染成本。
- 不建议为了滚动性能修改解析接口、下载逻辑或本地合并逻辑。

## 已实施优化

| 文件 | 修改 |
| --- | --- |
| `src/app/globals.css` | 移除大面积 blur、移除 fixed 扫描动画、降低阴影/发光、移动端关闭粒子和网格、为离屏区块添加 `content-visibility` |
| `src/components/ParticleField.tsx` | 无粒子/减少动态效果时不启动 rAF；桌面动画节流到约 30fps；pointermove 监听改为 passive |
| `src/lib/client/particleConfig.ts` | 降低桌面粒子密度；移动端和 reduced-motion 下粒子数为 0 |
| `tests/lib/particleConfig.test.ts` | 更新粒子性能策略覆盖 |

## Scroll Probe

使用本地 Chrome + Playwright，在首页执行 49 步滚动采样。

| Viewport | Horizontal overflow | Average frame | P95 frame | Max frame |
| --- | --- | --- | --- | --- |
| 1440 x 1000 | false | 16.57ms | 17.08ms | 17.25ms |
| 390 x 844 | false | 16.44ms | 16.94ms | 17.07ms |

截图：

- `docs/design-v2/performance-scroll-preview/desktop-before-or-current.png`
- `docs/design-v2/performance-scroll-preview/desktop-after.png`
- `docs/design-v2/performance-scroll-preview/mobile-after.png`

## 风险说明

Playwright 的 rAF 采样能验证页面在本机 Chrome 下的滚动节奏和横向溢出，但不能完全代表所有手机浏览器和低端设备。上线前建议部署到服务器后，再用真实手机浏览器手动滑动一次首页、平台说明区和解析成功结果区。

## Silky Pass - 2026-07-05

线上体感反馈仍然不够丝滑后，本次做了更激进的装饰层降级，优先保证滚动手感：

- 从首页移除 fixed canvas 粒子层，删除 `ParticleField` 和 `particleConfig`。
- 移除桌面端 top nav 的 `position: sticky`。
- 移除桌面端平台侧栏的 `position: sticky`。
- 移除 `content-visibility: auto`，避免第一次滚到下方 section 时触发布局/绘制卡顿。
- 将页面背景改为静态顶部轻量渐变，不再使用全页网格背景或动画背景。
- 将全局大阴影降为 `none`，保留边框和色块层级。
- 移除 hover 的 `transform` 位移，避免交互时额外合成。

Silky pass 后的风险扫描结果：

- 无 `ParticleField`
- 无 `.particle-field`
- 无 `position: fixed`
- 无 `position: sticky`
- 无 `backdrop-filter`
- 无 `content-visibility`
- 无 `transition: all`
- 无 scroll 监听器
- 首页无 `requestAnimationFrame`

Silky pass Chrome 滚动采样：

| Viewport | Horizontal overflow | Average frame | P95 frame | Max frame |
| --- | --- | --- | --- | --- |
| 1440 x 1000 | false | 16.50ms | 16.83ms | 17.15ms |
| 390 x 844 | false | 16.49ms | 16.81ms | 16.85ms |

新增截图：

- `docs/design-v2/performance-scroll-preview/desktop-silky.png`
- `docs/design-v2/performance-scroll-preview/mobile-silky.png`
