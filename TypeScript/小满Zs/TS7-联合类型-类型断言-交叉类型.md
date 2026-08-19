```js
//联合类型：同时支持两种类型 |
let phone:number | string = '1234567890'

function func1(type:number | boolean):boolean{
    //强转换
    return !!type
}
console.log(func1(0))
console.log(func1(true))

//交叉类型 &符连接

interface People {
    name: string,
    age: number
}
interface Man {
    sex:number
}

const zora = (a:People & Man ):void=>{
    console.log(a)
}

zora({
    name:'Zora',
    age:23,
    sex:1
})

//类型断言 as 不能滥用会导致类型错误
// as any 放弃 ts 类型校验
/**
 *TODO as string
    强制类型转换（只是告诉TS “我确定它就是string”）,
    但也仅仅只是欺骗，并不能做到真实的转换
*/
//写法1
function func2(a:number | string):void {
   console.log((a as string).length) //强制转换类型
};

func2('123') //OK
func2(1); // 不能滥用会导致类型错误

// 这里以（开头会触发 ts 语法歧义,上面那行要加 ; semicolon
// TODO func2('123')(window as any).abc = '123'
// (window as any).abc = '123'
```