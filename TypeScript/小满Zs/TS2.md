## npm i ts-node -g
可以**直接运行 .ts 源码，不需要先 tsc 编译成 js**
## npm init -y 生 package.json
项目说明书，记录：项目名字、版本、你装了哪些依赖包、脚本命令。

没有这个文件，npm 安装本地包会报错。
## npm i '@types/node' -D 控制台 ts-node index.ts 即可运行，不用事先编译
nodejs 的**类型声明文件**
>Node 本身是 JS 写的，没有 TS 类型。ts/ts-node 不知道 node 内置 API（`fs`、`path`、`process`）是什么类型，会报一堆红色类型报错。装这个包，TS 就认识 node 自带 API。

>[!NOTE]
>`-D` 等价于 `--save-dev`：**开发依赖**只在你写代码、编译阶段需要；打包上线运行的时候不需要这个包。
安装完会写到 package.json 的 `devDependencies`。


## 类型
先把你列的梳理修正一遍，你的顺序有点小问题，**TS 类型由宽到窄（从可以装一切 → 什么都装不了）**

> 1. top‑type（顶级类型）：`any`、`unknown` → 能接收几乎所有值
> 
> 2. Object /object
> 
> 3. 包装对象类型：`Number` `String` `Boolean`（大写，JS 构造函数）
> 
> 4. 原始类型：`number` `string` `boolean`（小写，日常用）
> 
> 5. 字面量类型：`1` `"Zora"` `false`（具体某一个值）
> 
> 6. bottom‑type（底类型）：`never`，什么值都装不下

>[!HINT]
>7. `any`：来者不拒，随便瞎操作；
>8. `unknown`：来者不拒，但你要先判断是什么类型才能操作。
>	1. unknown 类型只能赋值自身 or any 类型
>	2. unknown 类型没有办法读取任何属性，包括自身的方法
>9. 综上， unknown 类型比 any 类型更加安全，当你遇到一个变量你不知道它是啥类型，优先用 unknown，其次选 any

## Object包装对象类型 object原始类型模式 {}字面量模式
### ① `Object`（大写 O）

代表**所有可以调用 `Object.prototype` 方法的值**。
### ② `object`（小写 o，TS 专属）

代表**非原始类型**：只能是对象、数组、函数；**不能放 number/string/boolean**

### ③ `{}` 空对象类型 即为 new Object

和大写`Object`行为几乎一样，可以赋值除了 null、undefined 的任意值。
>[!HINT]
>```js
let a:{} = {name:1}
无法对上面的a 进行修改

