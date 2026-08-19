# TS7：联合类型、类型断言与交叉类型

## 开篇速记卡：`|` 是任选其一，`&` 是同时满足

| 写法           | 名称   | 含义                     |
| ------------ | ---- | ---------------------- |
| `A \| B`     | 联合类型 | 值可以是 A，也可以是 B          |
| `A & B`      | 交叉类型 | 值必须同时满足 A 和 B          |
| `value as T` | 类型断言 | 告诉 TypeScript 按 T 看待该值 |

> [!IMPORTANT]
> 类型断言只影响 TypeScript 的类型检查，不会在运行时真正转换数据。

## 一、联合类型 `|`

### 1. 一个变量支持多种类型

```js
//联合类型：同时支持两种类型 |
let phone:number | string = '1234567890'
```

`phone` 可以保存 `number` 或 `string`，但不能保存联合类型以外的值。

### 2. 函数参数使用联合类型

```js
function func1(type:number | boolean):boolean{
    //强转换
    return !!type
}
console.log(func1(0))
console.log(func1(true))
```

这里的参数可以是 `number` 或 `boolean`。`!!type` 会利用 JavaScript 的真假值规则，将参数转换成布尔值。

## 二、交叉类型 `&`

### 1. 定义两个接口

```js
//交叉类型 &符连接

interface People {
    name: string,
    age: number
}
interface Man {
    sex:number
}
```

### 2. 同时满足两个接口

```js
const zora = (a:People & Man ):void=>{
    console.log(a)
}

zora({
    name:'Zora',
    age:23,
    sex:1
})
```

`People & Man` 表示参数 `a` 必须同时具备：

- `People` 中的 `name`、`age`。
- `Man` 中的 `sex`。

只满足其中一个接口是不够的。

## 三、类型断言 `as`

### 1. 类型断言的作用与风险

```js
//类型断言 as 不能滥用会导致类型错误
// as any 放弃 ts 类型校验
/**
 *TODO as string
    强制类型转换（只是告诉TS “我确定它就是string”）,
    但也仅仅只是欺骗，并不能做到真实的转换
*/
```

类型断言适合“开发者知道的信息比 TypeScript 更多”的情况。它不会修改真实的数据，也不会自动增加某个属性。

### 2. 使用 `as string`

```js
//写法1
function func2(a:number | string):void {
   console.log((a as string).length) //强制转换类型
};

func2('123') //OK
func2(1); // 不能滥用会导致类型错误
```

当传入 `'123'` 时，字符串确实拥有 `length`。当传入 `1` 时，断言只是让类型检查暂时通过，数字本身并没有真的变成字符串。

> [!WARNING]
> `as string` 不是 `String(a)`。前者只改变 TypeScript 对值的判断，后者才会在运行时进行真实转换。

### 3. `as any` 与分号问题

```js
// 这里以（开头会触发 ts 语法歧义,上面那行要加 ; semicolon
// TODO func2('123')(window as any).abc = '123'
// (window as any).abc = '123'
```

`as any` 会跳过大部分类型检查，应尽量缩小使用范围。当前代码被注释掉，用来记录以括号开头的语句可能与上一行产生语法歧义，因此上一条语句需要用分号明确结束。

## 四、三种类型工具对比

### 联合类型

关注“可以是哪一种”：

```ts
type Id = number | string
```

### 交叉类型

关注“必须同时具有什么”：

```ts
type Person = People & Man
```

### 类型断言

关注“开发者告诉编译器怎样看待当前值”：

```ts
const value = someValue as string
```

## 一句话总结

> 联合类型扩大可选范围，交叉类型合并类型要求，类型断言则只改变编译器的判断，不改变运行时的真实数据。
