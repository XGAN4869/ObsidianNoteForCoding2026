```js
// never 类型在联合类型上会被直接忽略
// 用法：兜底，开发人员能避免错误的发生

type A = '唱' | '跳' | 'rap'
// type A = '唱' | '跳' | 'rap' | '篮球'

function kun (value:A) {
    switch (value) {
        case "唱":
            break
        case "跳":
            break
        case "rap":
            break
        // case "篮球":
        //     break
        default:
            //兜底逻辑
            const error:never = value;
            break
    }
}
```