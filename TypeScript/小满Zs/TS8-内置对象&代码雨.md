![[Pasted image 20260819134934.png]]

```js
let canvas = document.querySelector<HTMLCanvasElement>('canvas')!
let ctx = canvas.getContext('2d')!
canvas.width = screen.availWidth
canvas.height = screen.availHeight

let str: string[] = 'XMZSWZS010101'.split('')
let Arr = Array(Math.ceil(canvas.width / 10)).fill(0)
console.log(Arr);

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

setInterval(rain, 40)
```