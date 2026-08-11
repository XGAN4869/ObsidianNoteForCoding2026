```js
//1. ts 接口重名合并  
//5.A继承B  
interface A extends B{  
    name:string  
    //3. 可选age，可以加 ?    age?:number  
    //2. 索引签名任意 key    //key:string - value:any    [propName:string]:any  
    //4. readOnly 只读属性，不让用户随便改定义好的内容  
    readonly cb:()=>boolean  
    readonly id:number  
}  
//5.B被A继承  
interface B{  
    boss:string  
}  
  
let a1:A = {  
    //5. B是老大，A继承了B，那么B也要被使用  
    boss:'Lucien',  
    name:'Zora',  
    age:23,  
    id:1,  
    a:1,  
    b:'12',  
    cb:()=> true  
}  
  
//4. readonly 不允许用户修改 a1 中的值  
a1.cb = ()=> false  
a1.id = 999  
  
//---------------------------------------  
//6. 函数类型写法 interface 名字 { (参数):返回值 }interface Fn {  
    (name:string):number[]  
}  
  
const fn:Fn = function(name:string){  
    return[6]  
}
```