# 第 06 课：CSS 与静态资源

## 本课目标

会导入普通 CSS 和图片，理解 `src` 资源与 `public` 资源的区别，知道开发地址正常但构建后资源可能出错的原因。

## 普通 CSS 最简单

在 `src/style.css` 写样式，然后在入口 JavaScript 中导入：

```js
import './style.css'
```

开发时，Vite 会让导入的 CSS 生效，并支持 HMR。
P.S. Vite 会让导入的 CSS 生效，并支持 HMR -- 在不刷新整个页面的情况下，只替换、更新修改过的模块,Vue 也同理，比如前端这边临时要调什么字段，vue 也会热更新

不要误以为 `import` 只能导入 JavaScript。项目结构写成模块关系
```plaintText
你的项目入口 (main.js)
    ↓ import
App.vue
    ↓ import
DeptManage.vue
    ↓ import
dept-manage.css  ← 样式成了模块依赖树的一部分
```

这样 Vite 才能：
- 追踪样式变化 → 触发 **HMR**
    
- 分析依赖 → 打包时自动处理
    
- Tree Shaking → 移除未使用的样式


以 `.module.css` 结尾的文件会被当作 CSS Modules。它通常返回类名映射对象，例如：

```css
/* src/card.module.css */
.title {
  color: royalblue;
}
```

```js
import styles from './card.module.css'

document.querySelector('h1').className = styles.title
```

普通 CSS 与 CSS Modules 用途不同。初学时不要把所有文件都改成 `.module.css`，先根据框架和项目约定选择。

## 推荐：从 src 导入图片

把 `logo.png` 放在 `src/assets`，然后写：

```js
import logoUrl from './assets/logo.png'

document.querySelector('#logo').src = logoUrl
```

导入得到的是 Vite 处理后的 URL。构建时，文件名可能带哈希，便于缓存；小资源是否内联由构建配置和资源大小决定。HTML 中引用 `src` 内资源也会被处理，例如 `/src/assets/logo.png`，但在 JavaScript 或组件中使用 `import` 往往更容易让依赖关系清晰。

Vite 还支持明确的查询参数。`?url` 将资源作为 URL 导入，`?raw` 将内容作为字符串导入，`?worker` 用于 Web Worker。它们不是随便加的装饰，应在真正需要对应行为时使用。例如：

```js
import text from './message.txt?raw'
```

## public 目录什么时候用

`public` 中的文件按原样提供，不经过源码转换，并在开发时以根路径访问。若文件是 `public/robots.txt`，代码或浏览器路径应写 `/robots.txt`，不要写 `/public/robots.txt`。适合放必须保持原文件名、不会在源码中通过 import 引用的资源。大多数与组件一起变化的图片更适合放在 `src/assets`。

不要从 JavaScript 中写磁盘绝对路径，如 `C:\images\logo.png`。浏览器和部署服务器无法按你的电脑路径取得它。也不要把 public 当成“所有图片都必须放这里”的目录，否则构建工具无法像处理源码导入那样追踪和改名。

## 预处理器不是自带依赖

Vite 对 `.scss`、`.sass`、`.less`、`.styl`、`.stylus` 有内置接入，但你仍须安装相应预处理器。例如 SCSS 可安装 `sass-embedded` 或 `sass`，Less 需安装 `less`。这句话的意思是“不需要额外的 Vite 专用插件”，不是“完全不需要安装包”。没有使用预处理器，就不要增加依赖。

## 检查点

完成三个小实验：导入普通 CSS 并改变标题颜色；从 `src/assets` 导入一张图片；把一个 `favicon.ico` 或 `robots.txt` 放入 `public` 并用根路径访问。之后执行 `npm run build`，查看 `dist/assets` 中资源名称可能发生的变化，再执行 `npm run preview` 检查页面。不要直接双击 `dist/index.html` 判断构建是否正确，应通过 HTTP 服务预览。

常见故障：图片 404 时先看路径开头和文件大小写；样式不生效时先看 CSS 是否被导入；SCSS 报缺包时安装对应预处理器；开发正常但部署失败时查看第 12 课的 `base`。

官方依据：https://cn.vite.dev/guide/features#css 与 https://cn.vite.dev/guide/assets
