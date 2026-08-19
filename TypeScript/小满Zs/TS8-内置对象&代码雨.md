# TS8：内置对象与 Canvas 代码雨

## 开篇速记卡：用浏览器内置对象绘制动画

本例把 TypeScript 与浏览器提供的对象结合起来：

1. 使用 `document` 获取 `<canvas>`。
2. 使用 `HTMLCanvasElement` 和 `CanvasRenderingContext2D` 相关能力设置画布。
3. 使用数组保存每一列数字雨的纵坐标。
4. 使用定时器反复调用 `rain`，形成动画。

## 一、效果预览

![[Pasted image 20260819134934.png]]

## 二、获取 Canvas 与绘图上下文

### 1. 获取画布元素

```js
let canvas = document.querySelector<HTMLCanvasElement>('canvas')!
let ctx = canvas.getContext('2d')!
```

`document.querySelector` 用来查询页面元素。尖括号中的 `HTMLCanvasElement` 是类型参数，表示查询结果按 Canvas 元素理解。

末尾的 `!` 是非空断言，表示这里假设查询结果不会是 `null`。如果页面中没有对应元素，运行时仍然可能出错，所以 HTML 中需要准备 `<canvas>`。

### 2. 设置画布尺寸

```js
canvas.width = screen.availWidth
canvas.height = screen.availHeight
```

画布宽度和高度分别取可用屏幕宽高，使代码雨尽量铺满屏幕。

## 三、准备数字雨数据

### 1. 准备字符池

```js
let str: string[] = 'XMZSWZS010101'.split('')
```

字符串通过 `split('')` 被拆成字符数组，后面绘制每个字符时会从这个数组中随机取值。

### 2. 为每一列准备纵坐标

```js
let Arr = Array(Math.ceil(canvas.width / 10)).fill(0)
console.log(Arr);
```

每一列数字雨之间大约相隔 `10` 像素，因此用 `canvas.width / 10` 估算列数。`fill(0)` 让每一列都从纵坐标 `0` 开始。

## 四、编写下落动画函数

### 1. 声明每帧执行的函数

```js
//下落动画函数，每一帧执行一次，绘制一屏数字雨
const rain = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.05)' //拖尾效果核心
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0f0'
    Arr.forEach((item, index) => {
        ctx.fillText(str[Math.floor(Math.random() * str.length)], index * 10, item + 10)
        Arr[index] = item > canvas.height || item > 10000 * Math.random() ? 0 : item + 10
    })
}
```

### 2. 绘制半透明背景

```js
ctx.fillStyle = 'rgba(0,0,0,0.05)' //拖尾效果核心
ctx.fillRect(0, 0, canvas.width, canvas.height)
```

半透明黑色不会完全覆盖上一帧，因此旧字符会逐渐变淡，形成拖尾效果。

### 3. 设置绿色文字

```js
ctx.fillStyle = '#0f0'
```

`#0f0` 是绿色，用作数字雨文字的填充颜色。

### 4. 遍历每一列并绘制字符

```js
Arr.forEach((item, index) => {
    ctx.fillText(str[Math.floor(Math.random() * str.length)], index * 10, item + 10)
    Arr[index] = item > canvas.height || item > 10000 * Math.random() ? 0 : item + 10
})
```

- `index * 10` 控制字符的横坐标，每一列间隔 `10` 像素。
- `item + 10` 控制字符的纵坐标，让字符逐帧向下移动。
- `Math.random()` 与 `Math.floor()` 共同生成字符数组的随机下标。

### 5. 决定是否从顶部重新开始

```js
Arr[index] = item > canvas.height || item > 10000 * Math.random() ? 0 : item + 10
```

当列已经超过画布底部，或者命中随机重置条件时，将纵坐标设为 `0`；否则纵坐标增加 `10`。

## 五、启动定时动画

```js
setInterval(rain, 40)
```

`setInterval` 每隔 `40` 毫秒调用一次 `rain`，大约每秒执行 `25` 帧，于是连续画面看起来就像数字在下落。

## 六、代码执行流程

```text
获取 canvas
  ↓
设置画布大小
  ↓
准备字符数组与列坐标数组
  ↓
rain 清理半透明背景
  ↓
逐列绘制随机字符
  ↓
更新每列纵坐标
  ↓
定时器重复执行
```

## 一句话总结

> Canvas 代码雨的核心是“半透明覆盖制造拖尾 + 数组记录每列位置 + 定时器重复绘制”。
