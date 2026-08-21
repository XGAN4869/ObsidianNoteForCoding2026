```js
let a1:symbol = Symbol(1) //唯一的
let a2:symbol = Symbol(1) //唯一的

//for Symbol for全局symbol有没有注册过这个key 如果有直接拿来用
console.log(Symbol.for('xiaoman') === Symbol.for('xiaoman'))


//使用场景
//但a1、a2是两个完全独立 Symbol 实例，作为对象 key 互不冲突，可以同时并存，不会覆盖。
let obj = {
    name:'zora',
    [a1]:111,
    [a2]:222
}
console.log(obj)

//读不到
// console.log(Object.keys(obj))
//读不到
// console.log(Object.getOwnPropertyNames(obj))
// console.log(Object.getOwnPropertySymbols(obj))

//拿得到 symbol
console.log(Reflect.ownKeys(obj))
```