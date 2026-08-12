## 代码部分，未看完
```js
//1. 定义函数参数  
function add1(a:number,b:number):number{  
    return a + b;  
}  
console.log(add1(1,2));  
  
//2. 定义箭头函数  
const add2 = (a:number,b:number):number => a+b  
  
//3. 函数的默认值 | 函数的可选参数 ?function add3(a?:number,b:number = 20):number{  
    return a + b  
}  
console.log(add3(2,3));  
  
//4. 传递一个对象  
interface User {  
    name: string,  
    age: number  
}  
  
function add4(user:User){  
    return user  
}  
  
console.log(add4({name:'Zora',age:23}));  
  
//5.函数的增强  
interface Obj {  
    user: number[]  
    //调用 add 时，函数内部的 this 必须被当成 Obj 类型。  
    add: (this: Obj, num: number) => void  
}  
let obj:Obj = {  
    user:[1,2,3],  
    //这个 this:Obj 忽略即可，规定 this 是 Obj类型的对象  
    add(this:Obj, num: number){  
        this.user.push(num)  
    }  
}  
obj.add(4)
```