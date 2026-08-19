# TS6：函数重载

## 开篇速记卡：同一个函数，多种调用方式

> **函数重载就是先写出多种合法的调用方式，再用一个统一的函数实现处理它们。**

本例中的 `findUser` 有三种调用方式：

| 调用方式 | 参数 | 功能 | 返回值 |
|---|---|---|---|
| `findUser()` | 不传参数 | 查询全部 | `number[]` |
| `findUser(1)` | 传入数字 | 查询指定数字 | `number[]` |
| `findUser([4,5])` | 传入数组 | 添加数据 | `number[]` |

## 一、准备用户数据

```js
//函数重载reload -- 根据不同的参数决定不同的功能

let user:number[] = [1,2,3]
```

`user` 是后续查询和添加操作使用的原始数组。

## 二、定义函数重载

### 1. 写出三种调用签名

```js
//定义函数重载功能
function findUser(add:number[]):number[] //传数组，做添加
function findUser(index:number):number[] //传数字，查数字
function findUser():number[] //传空，查全部
```

这三行叫作**重载签名**，它们只负责告诉 TypeScript：这个函数允许怎样调用。

### 2. 重载签名与函数实现的关系

- 上面的重载签名面向函数调用者。
- 下面的实现签名负责统一接收所有可能的参数。
- 实现签名必须能够兼容前面列出的全部重载签名。

## 三、实现函数功能

### 1. 使用联合类型接收不同参数

```js
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
```

### 2. 三个判断分支

**传入数组：**

`Array.isArray(params)` 判断参数是不是数组。如果是，就使用 `user.push(...params)` 将数组中的数据添加到 `user`。

**传入数字：**

`typeof params === 'number'` 判断参数是不是数字。如果是，就使用 `filter` 查找与该数字相等的元素。

**没有传入参数：**

前两个条件都不满足时，直接返回完整的 `user` 数组。

> [!NOTE]
> `params?` 表示参数可以不传，它的完整类型可以理解为 `number | number[] | undefined`。

## 四、调用函数

```js
console.log(findUser())
console.log(findUser(1))
console.log(findUser([4,5]))
```

执行顺序如下：

1. `findUser()` 返回当前全部数据。
2. `findUser(1)` 返回数组中等于 `1` 的数据。
3. `findUser([4,5])` 把 `4`、`5` 添加到原数组，然后返回更新后的数组。

## 五、函数重载的书写顺序

```text
重载签名 1
重载签名 2
重载签名 3
统一的实现签名与函数体
```

> [!TIP]
> 记忆口诀：**先列调用方式，再写统一实现，最后在函数内部判断参数类型。**

## 一句话总结

> 函数重载用于描述“同一个函数可以怎样被调用”，联合类型和类型判断则用于完成函数内部的统一实现。
