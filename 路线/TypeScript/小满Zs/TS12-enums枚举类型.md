```js
//TODO !important 这里的 enum 中枚举的都是类型~！！

//1. 数字定义枚举，不写默认递增
enum ColorNumType {
    red = 1,
    green = 4,
    blue = 3,
}
console.log(ColorNumType.red)
console.log(ColorNumType.green)
console.log(ColorNumType.blue)

//2. 字符串定义枚举
enum ColorStrType {
    red = 'red',
    green = 'green',
    blue = 'blue',
}
console.log(ColorStrType.red)
console.log(ColorStrType.green)
console.log(ColorStrType.blue)


//3. 还可以穿插浙 string 和 number 枚举

//4. 接口枚举
enum Color {
    yes,
    no
}

interface A {
    red: Color.yes
}

let obj: A = {
    red: Color.yes
}

//5. 常量枚举, 你可以运行一下 tsc 看看编译后的 js 文件，Type 是对象了
const enum Types {
    success, // 加了 const 是 值 0
    fail    //值1
}

//TODO 不加 const 的 enums Type 是双向映射
/**
 * {
 *     success: 0,
 *     0: "success",
 *     fail: 1,
 *     1: "fail"
 * }
*/
//TODO 加 const 的 enums Type，不能 Type[0] 去调用
/**
 * {
 *     success: 0,
 *     fail: 1,
 * }
*/
// TODO 场景1：Types.success 在【类型位置】（冒号后面）→ 类型
interface Res {
    status: Types.success //类型
}

let code:number = 0;
//TODO 场景2：做比较的时候【也就是运行时】，它根本就不是类型！是值！
if(code === Types.success){
    console.log('success')
}
```