## 数组 --  变量: 声明类型[]
## 对象 --   变量：声明类型
```
## Q：几维数组有点难想象，和数学矩阵有关
```js
//1. 数组的普通类型定义  
//方式一  
// number[] 数字类型的数组  
// string[] 字符串类型的数组  
let arr:number[] = [1,2,3,4]  
let arr1:string[] = ['Zora','fanny']  
  
//方式二: 泛型  
//Array<boolean>  
let arr11:Array<number> = [1,2,3,4]  
  
//2. 定义对象数组使用 interfaceinterface X {  
    name:string  
    age:number  
}  
let arr3:X[] = [{name:'Zora',age:23},{name:'Zayne',age:27}]  
  
//3. 二维数组：表格数据、矩阵、棋盘（象棋、扫雷）  
let arrDouble:number[][] =[  
    [10, 20],   // 索引 0 → 第0行  
    [30, 40],   // 索引 1 → 第1行  
    [50, 60]    // 索引 2 → 第2行  
]  
//arrDouble[1][1] // 结果是 40//三维数组：很少手写，一般是图像像素、三维坐标数据，业务代码极少写 3 维往上  
let arrTri:number[][][] = [[[1]],[[2]]]  
  
//大杂烩数组  
function a(...args:any[]){  
    console.log(args);  
    //arguments 是伪数组，可以用 IArguments 定义  
    let a:IArguments = arguments  
}  
a(1,2,3)  
  
//IArguments 原理  
interface IA {  
    callee:Function  
    length:number  
    //索引  
    [index:number]:any  
}
```