# 第 05 课：理解 HTML 入口与 ES 模块

## 本课目标

理解 Vite 为什么把 `index.html` 放在项目根目录，能够用 `import` 和 `export` 拆分两个 JavaScript 文件，并知道模块路径最常见的写法。

## index.html 是入口

在 Vite 项目中，根目录的 `index.html` 属于源码和模块图的一部分，不是构建结束后才复制的摆设。最关键的一行通常是：

```html
<script type="module" src="/src/main.js"></script>
```

`type="module"` 告诉浏览器这是 ES 模块。`src="/src/main.js"` 中开头的 `/` 以 Vite 项目根目录为基础。Vite 会解析这个入口，再追踪 `main.js` 导入的其他模块、CSS 和资源。开发服务器默认访问根地址时返回 `index.html`，构建时也从入口分析依赖。

## 做一个两文件练习

新建 `src/math.js`：

```js
export function add(a, b) {
  return a + b
}
```

在 `src/main.js` 中导入：

```js
import { add } from './math.js'

const result = add(2, 3)
document.querySelector('#app').textContent = `2 + 3 = ${result}`
```

这里的 `./` 表示“从当前文件所在目录开始找”。因为 `main.js` 和 `math.js` 都在 `src`，所以是 `./math.js`。`{ add }` 对应具名导出 `export function add`，名字必须一致。如果写成默认导出，导入语法会不同，不要混用。

## 相对路径、根路径和裸导入

`./math.js` 是相对路径；`/src/main.js` 是以项目根目录为基础的路径；`import lodash from 'lodash'` 中的 `lodash` 是裸模块导入，通常指向 npm 依赖。浏览器原生模块不能直接理解这种包名，Vite 会处理依赖解析和预构建，并把导入转换为浏览器可请求的 URL。前提是对应依赖已经记录并安装，例如先执行 `npm install lodash`。

不要用层层 `../../../` 作为长期方案。项目变大后可以用第 09 课的 `resolve.alias`，但小项目先把相对路径写对。Windows 文件名不区分大小写的情况较常见，而 Linux 部署通常区分，所以 `import './User.js'` 与实际文件 `user.js` 的大小写必须保持完全一致，避免本机正常、上线失败。

## 多页面不是多路由

Vite 也能让根目录中的其他 HTML 作为入口，例如 `about.html` 在开发时可通过 `/about.html` 访问。子目录中的 `blog/index.html` 可通过相应路径访问。但这叫多页面应用入口，不等于 Vue Router 或 React Router 的客户端路由。初学阶段先掌握单个 `index.html`。

## 检查点与排错

启动开发服务器，完成 `math.js` 练习，页面应显示 `2 + 3 = 5`。把文件名故意改错一次，观察终端或浏览器覆盖层中的“无法解析导入”提示，然后恢复。若 `document.querySelector('#app')` 得到 `null`，检查 `index.html` 是否真的存在 `id="app"` 的元素。若模块代码完全不运行，检查 `script` 是否有 `type="module"`，路径是否指向正确文件。

请记住：Vite 处理模块关系，但不会猜测你写错的文件名；浏览器加载的是服务器提供的 URL，不是随意的磁盘路径；入口、导入路径和真实文件三者必须相互对应。

官方依据：https://cn.vite.dev/guide/#index-html-and-project-root 与 https://cn.vite.dev/guide/features#npm-dependency-resolving-and-pre-bundling
