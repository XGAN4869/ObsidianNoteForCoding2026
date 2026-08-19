```js
//函数重载reload -- 根据不同的参数决定不同的功能

let user:number[] = [1,2,3]

//定义函数重载功能
function findUser(add:number[]):number[] //传数组，做添加
function findUser(index:number):number[] //传数字，查数字
function findUser():number[] //传空，查全部
//实现函数
// 第一个变量 是 number | number[]
function findUser(params?:number | number[]):number[]{
    if(params && Array.isArray(params)){
        user.push(...params)
        return user
    }
    else if (params && typeof params === 'number'){
        return  user.filter(i=>i===params)
    }
    else{
        return user
    }
}
console.log(findUser())
console.log(findUser(1))
console.log(findUser([4,5]))


```