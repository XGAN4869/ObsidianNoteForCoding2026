# ** 一、es6数组中方法**

##### 1.array.forEach()

> 循环遍历数组中的每一项

```
item每一项，index 下标
要遍历的名称.forEach((item, index) => {
  console.log(item);
  console.log(index);
})
```

##### 2.array.map()

> map方法和forEach每次执行匿名函数都支持3个参数，参数分别是item（当前每一项）、index（索引值）、arr（原数组），但是map返回一个新数组,原数组不影响

```
map 是return 什么就返回什么
const newArr = arr.map(item => item + '')
console.log(newArr);
列子 2
const arr = [
  {id: 11,name: '张三',price: 100},
  {id: 12,name: '李四',price: 200},
  {id: 13,name: '王五',price: 300},
  {id: 14,name: '赵六',price: 400},
  { id: 15, name: '张二麻子',price: 500}
]
// 给所有数据添加一个性别男, 生成新数组
const newArr = arr.map(item => {
  return {
    ...item, sex: '男'
  }
})

console.log(newArr)
```

##### 3.array.filter

> 筛选数组中符合条件的项，返回一个新数组

```
const arr = [
  {id: 11,name: '张三',price: 100},
  {id: 12,name: '李四',price: 200},
  {id: 13,name: '王五',price: 300},
  {id: 14,name: '赵六',price: 400},
  { id: 15, name: '张二麻子',price: 500}
]
// 把价格大于300, 并且id为奇数的数据删选出来
const newArr = arr.filter(item => item.price > 300 && item.id % 2 != 0)
```



##### 4.array.some()

> 类似于some()方法用于检测数组中的元素是否有满足条件的，若满足返回true,否则返回false
>
> 注意：1、不会对空数组检测
>
> 2、不会改变原始数组

```
 const arr = [
      { name: '李总', price: 1000 },
      { name: '高总', price: 1200 },
      { name: '程总', price: 1300 }
    ]
// 判断数组中的价格是有没有是500的?满足返回true 否则为false
const res = arr.some(item => {
  return item.price == 500
})

console.log(res)
```



##### 5.array.every()

> 类似于与用于检测数组中所有元素是否都满足条件，若满足返回true,否则返回false

```
    const arr = [10, 20, 30]
    const fl = arr.every(item => item >= 20)
    const a = arr.every(item => item <= 10)
    const s = arr.every(item => item > 2)
```



##### 6.array.find()

> find（）方法只会找到第一个符合的，找到之后就会直接返回，就算下面还有符合要求的，也不会再找下去

```
 const arr = [
      { name: '李总', price: 1000 },
      { name: '高总', price: 1200 },
      { name: '程总', price: 1300 }
    ]
    const mi = arr.find(item => item.name === '李总')
    
    console.log(mi);
```



##### 7.array.reduce() 

> 数组累计求和

```
  const arr = [
      { name: '李总', price: 1000 },
      { name: '高总', price: 1200 },
      { name: '程总', price: 1300 }
    ]
      const aa = arr.reduce((prev, item) => {
      prev + item.price
    }, 0)
     console.log(aa);
```

##### 8.split () 把字符串转换成数组

> 把字符串转换为数组 

```
   const str = 'pink,red'
    const arr = str.split(',')
    ['pink', 'blue']
    console.log(arr);
    const str1 = '2022-7-22'
    console.log(str1.split(''));
```

##### 9.toFixed() 

> 保留几位小数 

```
  const num = 10.234
  const a = num.toFixed(2)
  console.log(a);
```

##### 10.substring ()字符串截取

> 字符串的截取   substring(开始的索引号，结束的索引号) 

```
  let ar = '我是一个数组'
  substring(开始的索引号，结束的索引号)
  let a = ar.substring(4, 6)
  console.log(a);
```

##### 11.Array.from() 

> 伪数组转换成真数组
>
> 1. ```
>    <body>
>      <ul>
>        <li></li>
>        <li></li>
>        <li></li>
>      </ul>
>      <script>
>        const lis = document.querySelectorAll('li')
>        const l = Array.from(lis)
>        console.log(l);
>      </script>
>    </body>
>    ```

##### 12.展开运算符

```
    const obj = { name: '张三', age: 20 }
    const obj2 = { sex: '男', price: 1000 }
    const obj3 = { ...obj, ...obj2 }
    console.log(obj3);
    
    const arr = [1, 2, 3]
    const arr1 = [4, 5, 6]
    console.log(...arr);
    console.log([arr, ...arr1]);
```

##### 13.截取数组

```
let arr = [1,2,3,4,5]
 const newArr= arr.slice(0,3) 下标开始计算位置 
```

#####  14.伪数组转换成真数组

```
<ul>
    <li></li>
    <li></li>
    <li></li>
  </ul>
  <script>
    const lis = document.querySelectorAll('li')
    const l = Array.from(lis)
    console.log(l);
  </script>
```

##### 15.字符串拼接

```
  <script>
    const spac = { size: '40cm*40cm', color: '黑色', backgroundColor: 'red' }
    //找到对象中的属性 并且给属性进行字符串拼接
    // const ar = Object.values(spac).join('/')
    // console.log(ar);
    const str = Object.values(spac).join('/')
    console.log(str);

    const doop = Object.values(spac).join('/')
  </script>
```

#####      16、数组除重

直接给一个新的[数组](https://so.csdn.net/so/search?q=%E6%95%B0%E7%BB%84&spm=1001.2101.3001.7020)里面，利用es6的延展运算符 

```
var arr = [1,9,8,8,7,2,5,3,3,3,2,3,1,4,5,444,55,22];

  console.log(arr);   

  function noRepeat(arr){

    var newArr = [...new Set(arr)]; //利用了Set结构不能接收重复数据的特点
     
    return newArr

  }

  var arr2 = noRepeat(arr)

  console.log(arr2);



```

​       利用 filter() 去重

```
var arr = ['apple','apps','pear','apple','orange','apps'];
 
console.log(arr)    
  var newArr = arr.filter(function(item,index){
     return arr.indexOf(item) === index;  // 因为indexOf 只能查找到第一个  
  });
 
console.log(newArr); 
```

​     利用双重for循环

```
var arr = [1,9,8,8,7,2,5,3,3,3,2,3,1,4,5,444,55,22];
console.log(arr);    
function noRepeat(arr){
   for (var i = 0; i < arr.length; i++) {
       for (var j = 0; j < arr.length; j++) {
           if (arr[i] == arr[j] && i != j) { //将后面重复的数删掉
              arr.splice(j, 1);
            }
       }
    }
    return arr;
}
var arr2  = noRepeat(arr);
console.log(arr2);   
```

##### 16.数组合并的方法

一.关于Apply 

```
var array = ["a", "b"];
var elements = [0, 1, 2];
array.push.apply(array, elements);
console.log(array); // ["a", "b", 0, 1, 2]
```

二.关于concat 

```
var array = ["a", "b"];
var elements = [0, 1, 2];
 
var newArray = array.concat(elements);
console.log(array); //['a', 'b']
console.log(newArray);// ["a", "b", 0, 1, 2]
```

三.关于ES6的拓展运算符 

```
var newArray = [...array,...elements]
console.log(newArray); // ["a", "b", 0, 1, 2]
```

##### 17.indexOf

```
indexOf() 方法可返回数组中某个指定的元素位置。

该方法将从头到尾地检索数组，看它是否含有对应的元素。开始检索的位置在数组 start 处或数组的开头（没有指定 start 参数时）。如果找到一个 item，则返回 item 的第一次出现的位置。开始位置的索引为 0。

如果在数组中没找到指定元素则返回 -1。
```

18.增删改查

```
//在数组指定位置插入 var fruits = ["Banana", "Orange", "Apple", "Mango"]; fruits.splice(2, 0, "Lemon", "Kiwi"); //输出结果 //Banana, Orange, Lemon, Kiwi, Apple, Mango 
```



### 二、节流防抖

> 防抖（Debounce）和节流（Throttle）都是用来控制某个函数在一定时间内触发次数，两者都是为了减少触发频率，以便提高性能 避免资源浪费。

> 所谓防抖，就是指触发事件后在 n 秒内函数只能执行一次，如果在 n 秒内又触发了事件，则会重新计算函数执行时间

```
<body>
  <div class="box"></div>
  <input type="text">
  <script>
    防抖
    let i = 1
    防抖核心代码
    let itemId = null
    box.addEventListener('click', function () {
    //   //清除上一次定时器
    //   clearTimeout(itemId)
    //   itemId = clearTimeout(function () {
    //     //TODD。。。
    //     i++
    //     box.innerHTML = 1
    //   }, 200)
    // })
  </script>
</body>
```

> 所谓节流，就是指连续触发事件但是在 n 秒中只执行一次函数。两种方式可以实现，分别是时间戳版和定时器版。

```
<body>
  <div class="box"></div>
  <input type="text">
  <script>
    //节流
    // const box = document.querySelector('.box')
    // let i = 1
    // let flag = true  //互斥锁
    // box.addEventListener('mousemove', function () {
    //   if (flag) {
    //     flag = false
    //     i++
    //     box.innerHTML = i
    //     setTimeout(function () {
    //       flag = true
    //     }, 500)
    //   }
    // })
  </script>
</body>
```

### 三、闭包

简单理解就是函数套函数, 函数内使用上层作用域的变量

> 特点：

1.函数嵌套函数。

2.函数内部可以引用外部的参数和变量。

3.参数和变量不会被垃圾回收机制回收。

> 使用：

1.读取函数内部的变量；

2.这些变量的值始终保持在内存中，不会在外层函数调用后被自动清除。

> 优点：

1:变量长期驻扎在内存中；

2:避免全局变量的污染；

3:私有成员的存在 ；

> 缺点：会造成内存泄露

### 四、深浅拷贝 

> 深拷贝拷贝多层,每一级别都拷贝,修改拷贝后的对象,原对象不改变

```
// 深拷贝1
const obj = {
  name: 'zs',
  family: {
    father: 'zs',
    mother: 'ls'
  },
  hobby: ['打游戏', '喝奶茶', '熬夜']
}
const newObj = {}
// 深拷贝三种写法
function deepClone(target, old) {
  for (const key in old) {
    if (old[key] instanceof Array) {
      // 判断是否为数组
      // TODO...
      target[key] = []
      deepClone(target[key], old[key])
    } else if (old[key] instanceof Object) {
      // 判断是否为对象
      // TODO...
      target[key] = []
      deepClone(target[key], old[key])
    } else {
      // TODO...
      target[key] = old[key]
    }
  }
}
deepClone(newObj, obj)
// 用来检验是否深拷贝成功
obj.family.father = '王五'
obj.hobby[0] = '睡觉'
console.log(obj);
console.log(newObj);
```

```
// 深拷贝2
const obj = {
  name: 'zs',
  family: {
    father: 'zs',
    mother: 'ls'
  },
  hobby: ['打游戏', '喝奶茶', '熬夜']
}


// TODO...
let newObj = {}
newObj = JSON.parse(JSON.stringify(obj));
// 用来检验是否深拷贝成功
obj.family.father = '王五'
obj.hobby[0] = '睡觉'
console.log(obj);
console.log(newObj);
```

```
// 引入lodash
const _ = require('lodash')

const obj = {
  name: 'zs',
  family: {
    father: 'zs',
    mother: 'ls'
  },
  hobby: ['打游戏', '喝奶茶', '熬夜']
}

// TODO...
// 使用lodash
const newObj = _.cloneDeep(obj)

// 下面代码不要动, 用来检验是否深拷贝成功
obj.family.father = '王五'
obj.hobby[0] = '睡觉'
console.log(obj);
console.log(newObj);
```



> 浅拷贝只拷贝一层,对象级别只拷贝地址,修改拷贝后的对象,原对象改变

```
const o1 = {
  name: 'zs',
  age: 'ls'
}
let o2 = {
  sex: '男'
}

// 要求, 三种方式, 把o1的内容拷贝到o2内
// 1.  Object.assign(o2, o1)
//2. o2 = { ...o1,...o2}
//3. function deep(...aegs) {
//   aegs.forEach(item => {
//     for (let k in item) {
//       aegs[0][k] = item[k]
//     }
//   })
//   return aegs[0]
// }
// o2 = deep(o1, o2)
// 答案代码
console.log(o1);
console.log(o2);
```

浅拷贝 ：只复制指向某个对象的指针，而不复制对象本身，相当于是新建了一个对象，该对象复制了原对象的指针，新旧对象还是共用一个内存块
深拷贝：是新建一个一模一样的对象，该对象与原对象不共享内存，修改新对象也不会影响原对象

### 五、作用域链

> 作用域链本质上是底层的变量查找机制，在函数被执行时，会优先查找当前函数作用域中查找变量，如果当前作用域查找不到则会依次逐级查找父级作用域直到全局作用域，如下代码所示：





### 六、DOM

> 学习会为 DOM 注册事件，实现简单可交互的网页特交。

##### 事件

事件是编程语言中的术语，它是用来描述程序的行为或状态的，**一旦行为或状态发生改变，便立即调用一个函数。**

例如：用户使用【鼠标点击】网页中的一个按钮、用户使用【鼠标拖拽】网页中的一张图片

##### 事件监听

结合 DOM 使用事件时，需要为 DOM 对象添加事件监听，等待事件发生（触发）时，便立即调用一个函数。

`addEventListener` 是 DOM 对象专门用来添加事件监听的方法，它的两个参数分别为【事件类型】和【事件回调】。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>事件监听</title>
</head>
<body>
  <h3>事件监听</h3>
  <p id="text">为 DOM 元素添加事件监听，等待事件发生，便立即执行一个函数。</p>
  <button id="btn">点击改变文字颜色</button>
  <script>
    // 1. 获取 button 对应的 DOM 对象
    const btn = document.querySelector('#btn')

    // 2. 添加事件监听
    btn.addEventListener('click', function () {
      console.log('等待事件被触发...')
      // 改变 p 标签的文字颜色
      let text = document.getElementById('text')
      text.style.color = 'red'
    })

    // 3. 只要用户点击了按钮，事件便触发了！！！
  </script>
</body>
</html>
```

完成事件监听分成3个步骤：

1. 获取 DOM 元素
2. 通过 `addEventListener` 方法为 DOM 节点添加事件监听
3. 等待事件触发，如用户点击了某个按钮时便会触发 `click` 事件类型
4. 事件触发后，相对应的回调函数会被执行

大白话描述：所谓的事件无非就是找个机会（事件触发）调用一个函数（回调函数）。

##### 事件类型

`click` 译成中文是【点击】的意思，它的含义是监听（等着）用户鼠标的单击操作，除了【单击】还有【双击】`dblclick`

```html
<script>
  // 双击事件类型
  btn.addEventListener('dblclick', function () {
    console.log('等待事件被触发...');
    // 改变 p 标签的文字颜色
    const text = document.querySelector('.text')
    text.style.color = 'red'
  })

  // 只要用户双击击了按钮，事件便触发了！！！
</script>
```

结论：【事件类型】决定了事件被触发的方式，如 `click` 代表鼠标单击，`dblclick` 代表鼠标双击。

##### 事件处理程序

`addEventListener` 的第2个参数是函数，这个函数会在事件被触发时立即被调用，在这个函数中可以编写任意逻辑的代码，如改变 DOM 文本颜色、文本内容等。

```html
<script>
  // 双击事件类型
  btn.addEventListener('dblclick', function () {
    console.log('等待事件被触发...')
    
    const text = document.querySelector('.text')
    // 改变 p 标签的文字颜色
    text.style.color = 'red'
    // 改变 p 标签的文本内容
    text.style.fontSize = '20px'
  })
</script>
```

结论：【事件处理程序】决定了事件触发后应该执行的逻辑。



##### 事件类型

将众多的事件类型分类可分为：鼠标事件、键盘事件、表单事件、焦点事件等，我们逐一展开学习。

##### 鼠标事件

鼠标事件是指跟鼠标操作相关的事件，如单击、双击、移动等。

1. `mouseenter 监听鼠标是否移入 DOM 元素

```html
<body>
  <h3>鼠标事件</h3>
  <p>监听与鼠标相关的操作</p>
  <hr>
  <div class="box"></div>
  <script>
    // 需要事件监听的 DOM 元素
    const box = document.querySelector('.box');

    // 监听鼠标是移入当前 DOM 元素
    box.addEventListener('mouseenter', function () {
      // 修改文本内容
      this.innerText = '鼠标移入了...';
      // 修改光标的风格
      this.style.cursor = 'move';
    })
  </script>
</body>
```

1. `mouseleave 监听鼠标是否移出 DOM 元素

```html
<body>
  <h3>鼠标事件</h3>
  <p>监听与鼠标相关的操作</p>
  <hr>
  <div class="box"></div>
  <script>
    // 需要事件监听的 DOM 元素
    const box = document.querySelector('.box');

    // 监听鼠标是移出当前 DOM 元素
    box.addEventListener('mouseleave', function () {
      // 修改文本内容
      this.innerText = '鼠标移出了...';
    })
  </script>
</body>
```

##### 键盘事件

keydown   键盘按下触发
keyup   键盘抬起触发

##### 焦点事件

focus  获得焦点

blur 失去焦点

##### 文本框输入事件

input  

##### 事件对象

任意事件类型被触发时与事件相关的信息会被以对象的形式记录下来，我们称这个对象为事件对象。

```html
<body>
  <h3>事件对象</h3>
  <p>任意事件类型被触发时与事件相关的信息会被以对象的形式记录下来，我们称这个对象为事件对象。</p>
  <hr>
  <div class="box"></div>
  <script>
    // 获取 .box 元素
    const box = document.querySelector('.box')

    // 添加事件监听
    box.addEventListener('click', function (e) {
      console.log('任意事件类型被触发后，相关信息会以对象形式被记录下来...');

      // 事件回调函数的第1个参数即所谓的事件对象
      console.log(e)
    })
  </script>
</body>
```

事件回调函数的【第1个参数】即所谓的事件对象，通常习惯性的将这个对数命名为 `event`、`ev` 、`ev` 。

接下来简单看一下事件对象中包含了哪些有用的信息：

1. `ev.type` 当前事件的类型
2. `ev.clientX/Y` 光标相对浏览器窗口的位置
3. `ev.offsetX/Y` 光标相于当前 DOM 元素的位置

注：在事件回调函数内部通过 window.event 同样可以获取事件对象。

##### 环境对象

> 能够分析判断函数运行在不同环境中 this 所指代的对象。

环境对象指的是函数内部特殊的变量 `this` ，它代表着当前函数运行时所处的环境。

```html
<script>
  // 声明函数
  function sayHi() {
    // this 是一个变量
    console.log(this);
  }

  // 声明一个对象
  let user = {
    name: '张三',
    sayHi: sayHi // 此处把 sayHi 函数，赋值给 sayHi 属性
  }
  
  let person = {
    name: '李四',
    sayHi: sayHi
  }

  // 直接调用
  sayHi() // window
  window.sayHi() // window

  // 做为对象方法调用
  user.sayHi()// user
	person.sayHi()// person
</script>
```

结论：

1. `this` 本质上是一个变量，数据类型为对象
2. 函数的调用方式不同 `this` 变量的值也不同
3. 【谁调用 `this` 就是谁】是判断 `this` 值的粗略规则
4. 函数直接调用时实际上 `window.sayHi()` 所以 `this` 的值为 `window`

##### 回调函数

如果将函数 A 做为参数传递给函数 B 时，我们称函数 A 为回调函数。

```html
<script>
  // 声明 foo 函数
  function foo(arg) {
    console.log(arg);
  }

  // 普通的值做为参数
  foo(10);
  foo('hello world!');
  foo(['html', 'css', 'javascript']);

  function bar() {
    console.log('函数也能当参数...');
  }
  // 函数也可以做为参数！！！！
  foo(bar);
</script>
```

函数 `bar` 做参数传给了 `foo` 函数，`bar` 就是所谓的回调函数了！！！

我们回顾一下间歇函数 `setInterval` 

```html
<script>
	function fn() {
    console.log('我是回调函数...');
  }
  // 调用定时器
  setInterval(fn, 1000);
</script>
```

`fn` 函数做为参数传给了 `setInterval` ，这便是回调函数的实际应用了，结合刚刚学习的函数表达式上述代码还有另一种更常见写法。

```html
<script>
  // 调用定时器，匿名函数做为参数
  setInterval(function () {
    console.log('我是回调函数...');
  }, 1000);
</script>
```

结论：

1. 回调函数本质还是函数，只不过把它当成参数使用
2. 使用匿名函数做为回调函数比较常见



### 七、html5和css3新特性

> html5

1.自定义属性 data-id
2.语义化更好的内容标签(header,nav,footer ,aside, article, section)
3、音频 ,视频(audio, video)
4.本地离线存储 localStorage 用于长久保存整个网站的数据，保存的数据没有过
期时间，直到手动去删除
5.sessionStorage 该数据对象临时保存同一窗口(或标签页)的数据，在关闭窗口或
标签页之后将会删除这些数据

> css3

1、颜色: 新增 RGBA , HSLA 模式
2、文字阴影(text-shadow)
3、边框: 圆角(border-radius) 边框阴影 : box-shadow
4、盒子模型: box-sizing
5、背景:background-size background-origin background-clip

### 八、什么是跨域? 如何解决?

> 出现跨域问题的原因:

在前后端分离的模式下，前后端的域名是不一致的，此时就会发生跨域访问问题。在请求的过程中我们要想回去数据一般都是post/get请求，所以..跨域问题出现
跨域问题来源于JavaScript的同源策略，即只有 协议+主机名+端口号(如存在)相同，则允许相互访问。也就是说JavaScript只能访问和操作自己域下的资源，不能访问和操作其他域下的资源。
同源策略 是安全策略。所谓的同源，指的是协议，域名，端口相同。浏览器处于安全方面的考虑，只允许本域名下的接口交互，不同源的客户端脚本，在没有明确授权的情况下，不能读写对方的资源。

> 解决跨域的方案：

主流:JSONP跨域解决方案,只支持get请求,不是ajax请求而且必须要求前端和后端配合才行 点控制台JS可以看到,是动态创建和移除<script>标签
jsonp原理：(动态创建script标签，回调函数)
步骤:1 手写一个函数abc
2 准备script标签---->src具有天然的跨域特性, 是Get请求类型. 是用来请求js代码 
3 让script的src属性传递参数 <script src="请求地址/主机名?callback=函数名"></script>
服务器会返回 abc函数的调用, 并携带实参,实参就是服务器准备的数据
cors,是官方给定的解决方案,只需要后端进行配置即可

### 九、如何用setTimeout模拟setInterval

首先来看 setInterval 的缺陷，使用 setInterval()创建的定时器确保了定时器代码规则地插
入队列中。这个问题在于：如果定时器代码在代码再次添加到队列之前还没完成执行，
结果就会导致定时器代码连续运行好几次。而之间没有间隔。不过幸运的是：javascript

引擎足够聪明，能够避免这个问题。当且仅当没有该定时器的如何代码实例时，才会将
定时器代码添加到队列中。这确保了定时器代码加入队列中最小的时间间隔为指定时间。
这种重复定时器的规则有两个问题：1.某些间隔会被跳过 2.多个定时器的代码执行时间
可能会比预期小。

```
function say(){
    setTimeout(say,200); 
};
 
setTimeout(say,200);
 
//或者
 
setTimeout(function(){ 
    setTimeout(arguments.callee,200); 
},200)
```

### 十、序列化和反序列化

> 把数据对象转化为字符串的过程叫做序列化。
> 把字符串转换为数据对象的过程，叫做反序列化。

> 对象转json    json.stringify(对象名称)
> json转js 对象  json.parse（json名称）

> json和js对象的关系
> json是一个对象的字符串表示法



### 十一、向formData中追加文件

```
<script>
    // 1. 创建 FormData 实例
    var fd = new FormData()
    // 2. 调用 append 函数，向 fd 中追加数据
    fd.append('uname', 'zs')
    fd.append('upwd', '123456')

    var xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://www.liulongbin.top:3006/api/formdata')
    xhr.send(fd)

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        console.log(JSON.parse(xhr.responseText))
      }
    }
  </script>
```

### 十二、服务端400类别的错误信息

400：参数传递有误

401：token失效，没有token

402：无权访问 原因：服务器没有权限

404:请求地址url错误

405:请求方法出错，get ，post写错了

### 十三.new关键字执行了哪些操作?

1.创建一个空对象{ }，就是在栈内新建一个obj，实际上就是对应堆内的一个地址。

 2.将新建obj的隐式原型_proto_指向构造函数的原型prototype对象。

 3.改变构造函数的this指向，指向新对象obj，并利用call（）apply()执行构造函数。

 4.返回结果，如果函数返回的是基本数据类型，则实际生成对象，返回this，如果返回的是引用数据类型，则返回该引用数据类型值。 

### 十四、forEach和map的区别是什么?

> forEach 和 map 的相同点 

相同点 都是循环遍历数组中的每一项 

forEach 和 map 方法里每次执行匿名函数都支持 3 个参数，参数分别是 item（当前每一项）， 

index（索引值），arr（原数组） 

不同点

For遍历对象自身的和继承可枚举的属性，也就是说会包括哪些原型链上的属性

Map方法不会对空数组进行检测，map会返回一个新数组，不会对原数组产生影响

### 十五、js怎么清空数组？

1、用“length”清除

```
var arr = [1,2,3];
1
console.log(arr);
arr.length = 0;
console.log(arr);
123

```

2.用“[splice](https://so.csdn.net/so/search?q=splice&spm=1001.2101.3001.7020)”清除

```
var arr = [1,2,3];
console.log(arr);
arr.splice(0);
console.log(arr);
1234

```



3、用“[]”清除

```
var arr = [1 ,2 ,3];
console.log(arr);
arr = []; 
console.log(arr);
1234

```



### 十六、怎么判断一个object是否是数组array？

方法一：instanceof 用于判断一个变量是否某个对象的实例 

方法二：constructor constructor 属性返回对创建此对象的[数组](https://so.csdn.net/so/search?q=%E6%95%B0%E7%BB%84&spm=1001.2101.3001.7020)函数的引用，就是返回对象相对应的构造函数 

方法三：Array.isArray() 用于确定传递的值是否是一个 Array。 obj 需要检测的值，如果对象是 Array，则为true; 否则为false。 

### 十七、js有一些常规的属性，我还想扩展一下属性，应该怎么扩展?

语法格式：
　　类名.prototype.方法名 = function([param1],[param2],…[paramn]) {
　　　　…
　　}
　　[param1],[param2],…[paramn]这些参数都是可选的

```
 String.prototype.quote = function(quotestr) {
      if (!quotestr) {
          quotestr = "\"";
      }
      return quotestr + this + quotestr;
  };

```


### 十八、大概说一下几个路由导航守卫的执行顺序？

执行顺序：
1.导航被触发

2.在失活的组件里调用离开守卫

3.调用全局的beforeEach守卫

4.在重用的组件里调用boforeRouteUpdate守卫

5.在路由配置里调用beforeEnter

6.解析异步路由组件

7.在被激活的组件里调用beforeRouteEnter

8.调用全局的beforeResolve守卫

9.导航被确认

10.调用全局的afterEach钩子

11.触发DOM更新

12用创建好的实例调用 beforeRouteEnter 守卫中传给next的回调函数
### 十九、树形菜单的渲染，递归函数大概逻辑是什么?

答: 循环遍历后台返回的数据, 判断父节点下有没有匹配的子节点, 如果有, 就调用递归函数, 继续判断子节点下有没有他的子节点. 如果有, 就把当前子节点
添加到父节点中. 最终返回创建的数组.

### 二十、冒泡排序

const arr = [1, 2, 8, 5, 7, 3, 0]

for (let i = 0; i < arr.length - 1; i++) {

  for (let j = 0; j < arr.length - 1; j++) {

​    if (arr[j] > arr[j + 1]) {

​      const temp = arr[j + 1]

​      arr[j + 1] = arr[j]

​      arr[j] = temp

​    }

  }

}

console.log(arr)

### 二十一 、介绍 this 各种情况（必会） 

 this 的情况：

 1、以函数形式调用时，this 永远都是 window

 2、以方法的形式调用时，this 是调用方法的对象

 3、以构造函数的形式调用时，this 是新创建的那个对象

 4、使用 call 和 apply 调用时，this 是指定的那个对象

 5、箭头函数：箭头函数的 this 看外层是否有函数 如果有，外层函数的 this 就是内部箭头函数的 this 如果没有，就是 window 

6、特殊情况：通常意义上 this 指针指向为最后调用它的对象。这里需要注意的一点就是 如果返回值是一个对象，那么 this 指向的就是那个返回的对象，如果返回值不是一个对象那么 this 还是指向函数的实例 

### 二十二、原型链

原型链： 当访问一个对象的某个属性时，会先在这个对象本身属性上查找，如果没有找到，则会去 它的__proto__隐式原型上查找，即它的构造函数的 prototype，如果还没有找到就会再在 构造函数的 prototype 的__proto__中查找，这样一层一层向上查找就会形成一个链式结 构，我们称为原型链。 

### 二十三、原型

JavaScript 中所有都是对象，在 JavaScript 中，原型也是一个对象，通过原型可以实现 对象的属性继承，JavaScript 的函数对象中都包含了一个” prototype”内部属性，这个属 性所对应的就是该函数对象的原型 “prototype”作为函数对象的内部属性，是不能被直接访问的。所以为了方便查看一个对 象的原型，Firefox 和 Chrome 内核的 JavaScript 引擎中提供了”proto“这个非标准的访问 器 原型的主要作用就是为了实现继承与扩展对象 

### 二十四、垃圾回收机制

js的垃圾回收机制是为了防止内存泄漏（已经不需要的某一块内存还一直存在着），垃圾回收机制就是不停歇的寻找这些不再使用的变量，并且释放掉它所指向的内存。 

标记清除：大部分浏览器使用这种垃圾回收，当变量进入执行环境(声明变量）的时候，垃圾回收器将该变量进行了标记，当该变量离开环境的时候，将其再度标记，随之进行删除。 

# html,css

### 1、如何最小化重绘(repaint)和回流(reflow)

> 什么是重绘 Repaint 和重排 



重绘:当元素的一部分属性发生改变，如外观、背景、颜色等不会引起布局变化，只需要浏览器 

根据元素的新属性重新绘制，使元素呈现新的外观叫做重绘。 

回流:当 render 树中的一部分或者全部因为大小边距等问题发生改变而需要 DOM 树重 

新计算的过程 

重绘不一定需要重排（比如颜色的改变），重排必然导致重绘（比如改变网页位置） 

方法： 

1、需要要对元素进行复杂的操作时，可以先隐藏(display:"none")，操作完成后再显示 

3、尽量避免用 table 布局（table 元素一旦触发回流就会导致 table 里所有的其它元素回流） 

4、避免使用 css 表达式(expression)，因为每次调用都会重新计算值（包括加载页面） 

5、尽量使用 css 属性简写，如：用 border 代替 border-width, border-style, border-color  

### 2.CSS 优化、提高性能的方法有哪些? 说5个

1，首推的是合并css文件，如果页面加载10个css文件，每个文件1k，那么也要比只加载一个100k的css文件慢。

2，减少css嵌套，最好不要套三层以上。

3，不要在ID选择器前面进行嵌套，ID本来就是唯一的而且人家权值那么大，嵌套完全是浪费性能。

4，建立公共样式类，把相同样式提取出来作为公共类使用，比如我们常用的清除浮动等。

5，巧妙运用css的继承机制，如果父节点定义了，子节点就无需定义。 

### 3.移动端你们一般采用什么布局？移动端设计稿是多大的尺寸？

● 定宽布局

● 一般移动端设计稿是640或者750的尺寸

注：拿到设计稿时，一般将屏幕宽度分15等份 比如750px 750px / 15 = 50px

1、页面元素的rem值 = 页面元素值（px）/ （屏幕宽度 / 划分的份数）

2、屏幕宽度 / 划分的份数 就是 html font-size 的大小

3、或 页面元素的rem值 = 页面元素值（px）/ html font-size 字体大小


### 4.移动端用过那些meta标签？

1.<meta charset="utf-8">    定义语言

2.<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" /> 

3.<meta name=”format-detection” content=”telephone=no” /> 





# vue面试题

### 一、开发时，修改数组或者对象的值，视图没有更新，怎么解决？

数组更新什么时候不会让视图更新：

1.直接通过索引修改数组的值 2.修改数组的长度

解决：

​        1.通过$set(要修改的数组，要修改的下标，要修改的值)

2. this.$forceUpdate()   强制转化



### 二、key的作用

key的好处:可以配合虚拟DOM提高更新的性能

Vue通过虚拟dom+diff算法提高性能

diff算法如何比较新旧虚拟dom?

根元素改变-删除当前DOM树重新建

根元素未变,属性改变-更新属性

根元素未变,子元素/内容改变---根据key来判断

无key-就地更新

有key-按key比较

虚拟DOM

本质就是一个JS对象,保存DOM关键信息,属性和内容,保存在内存中

好处:提高DOM更新的性能,不用频繁操作真实DOM,在内存中找到变化部分,在更新真实DOM(打补丁)

虚拟DOM属性比真实DOM属性少

②:key值的要求是:唯一不重复的字符串或者数值

有id用id,无id用索引



### 三、如果v-for 和 v-if一起使用, 会出现什么问题?  怎么解决?

当 v-if 与 v-for 一起使用时，v-for 具有比 v-if 更高的优先级，这意味着 v-if 将分别重复运行于每个 v-for 循环中，将会影响速度，尤其是当之需要渲染很小一部分的时候，所以不推荐v-if和v-for同时使用

### 四、为什么组件名字是多个单词组成的?

这样做可以避免跟现有的以及未来的 HTML 元素相冲突，因为所有的 HTML 元素名称都是单个单词的。

### 五、为什么 data(){ return { } }这样写? 而不是直接写 data: { }

data:{}：这样会直接挂载在vue实例中，变成全局变量，容易造成污染,再次今日该组件页面，会保留上次的变量值，不会被初始化

data(){return {}} :return包裹后数据中变量只在当前组件中生效，每次刷新页面就相当每次都初始化

### 六、为什么Prop 定义应该尽量详细, 而不使用props: [ ]这种写法?

细致的 prop 定义有两个好处：

它们写明了组件的 API，所以很容易看懂组件的用法；
在开发环境下，如果向一个组件提供格式不正确的 prop，Vue 将会告警，以帮助你捕获潜在的错误来源。

### 七、Vue-router的模式有哪些? 各自特点是什么?

hash模式：
1、url路径会出现 # 字符
2、hash值不包括在 HTTP 请求中，它是交由前端路由处理，所以改变hash值时不会刷新页面，也不会向服务器发送请求
3、hash值的改变会触发hashchange事件

history模式：
1、整个地址重新加载，可以保存历史记录，方便前进后退
2、使用 HTML5 API（旧浏览器不支持）和 HTTP服务端配置，没有后台配置的话，页面刷新时会出现404

### 八、hash模式原理和history原理, 简单阐述下?

hash值变化浏览器不会重新发起请求，但是会触发window.hashChange事件，假如我们在hashChange事件中获取当前的hash值，并根据hash值来修改页面内容，则达到了前端路由的目的。

history模式原理可以这样理解，首先我们要改造我们的超链接，给每个超链接增加onclick方法，阻止默认的超链接跳转，改用history.pushState或history.replaceState来更改浏览器中的url，并修改页面内容。由于通过history的api调整，并不会向后端发起请求，所以也就达到了前端路由的目的。

### 九、$router和$route区别是什么? 分别包含哪些内容?

$ router是用来操作路由的，$ route是用来获取路由信息的。
1.$router是VueRouter的一个实例
他包含了所有的路由，包括路由的跳转方法，钩子函数等，也包含一些子对象（例如history）
2.$ route是一个跳转的路由对象（路由信息对象），每一个路由都会有一个$route对象，是一个局部的对象。

### 十、vuex 和 localStorage 的区别是什么？

1.vuex 存储在内存

2.localstorage 以文件的方式存储在本地

3.localstorage 只能存储字符串类型的数据，储存对象需要JSON的Stringify 和 parse 方法进行处理，读取内存比读取硬盘速度要快

> 应用场景

1.vuex 是一个专为vue.js 应用程序开发的状态管理模式，它采用集中式管理应用的所有组件状态，并以相应的规则保证状态的以一种 可以预测的方式发生变化，vuex 用于组件之间的传值，

2.localstorage 是本地储存，是将数据存储到浏览器的方法，一般在跨页面传递数据时使用。

3.vuex能够做到数据的响应式，localstorage 不能



### 十一、vuex管理数据的属性有哪几个? 作用是什么?

调用模块中的action  使用  store.dispath('模块名称/方法名称'，要传递的数据)

调用模块中的mutations 使用 

`store.commit(``'increment'``)` 







### 十三、vue页面刷新的时候, 有些值会出现闪烁的情况,什么情况造成的?以及解决方案是什么?

为什么刷新会出现闪烁的问题?
因为浏览器是html从上到下执行，
先执行Dom元素
然后执行javaScript元素
当走到javaScript时，Dom元素已经开始走动，所以如果网慢的话，会显示的特别明显

使用 v-cloak 用法
v-cloak指令 和 css规则 [v-cloak] {display:none} 一起用时，这个指令可以隐藏未编译的Mustache标签直到实例准备完毕。

原理：

带有v-clock的的元素设置为display:none，隐藏掉，在等 到vue解析到带有v-clock的节点时候，会把attribute和class同时remove掉，这样就可以实现防止节点的闪烁。



### 十四、axios拦截器有几种? 项目中作用分别是什么?

> 一般分为两种：请求拦截器、响应拦截器。

> 请求拦截器 

在请求发送前进行必要操作处理，例如添加统一cookie、请求体加验证、设置请求头等，相当于是对每个接口里相同操作的一个封装；

> 响应拦截器

 同理，响应拦截器也是如此功能，只是在请求得到响应之后，对响应体的一些处理，通常是数据统一处理等，也常来判断登录失效等。

### 十五、反向代理原理是什么? 如何配置?

原理：

通过伪造请求使得http请求为同源的，然后将同源的请求发送到反向代理服务器上，由反向代理服务器去请求真正的url，这样就绕过直接请求真正的url导致的跨域问题 

```
 // 代理跨域的配置
    proxy: {
      // 当我们的本地的请求 有/api的时候，就会代理我们的请求地址向另外一个服务器发出请求
      '/api': {
        target: 'http://ihrm.itheima.net/', // 跨域请求的地址
        changeOrigin: true // 只有这个值为true的情况下 才表示开启跨域
      }
    }
```

### 十六、项目中token存储在什么位置? 各自优缺点是什么?

token 在客户端一般存放于[localStorage](https://so.csdn.net/so/search?q=localStorage&spm=1001.2101.3001.7020)、cookie、或sessionStorage，vuex中。

1、localStorage
优点: localStorage 生命周期是永久，这意味着除非用户显示在浏览器提供的UI上清除localStorage信息，否则这些信息将永远存在。相同浏览器的不同页面间可以共享相同的localStorage (页面属中相可域名和端口)。

缺点:同一个属性名的数据会被替换，不同浏览器无法共享localStorage或sessionStorage中的信息。

2、sessionStorage
优点: sessionStorage生 命周期为当前窗口或标签页，sessionStorage的数据不会被其他窗口清除，页面及标签页仅指顶级窗口，如果一个标签页包含多个iframe标签且他们属于同源页面，那么他们之间是可以共享sessionStorage的。

缺点:一旦窗口或标签页被永久关闭了，那么所有通过sessionStorage存储的数据也就被清空了。

3、存储在cookie 中

 优点：占用更少的内存，Cookie最强大的一个方面就是持久性。当在客户端的浏览器上设置Cookie时，它可以持续数天，数月甚至数年。这样可以轻松保存用户首选项和访问信息， 

缺点：

1.不安全

Cookie安全性是一个大问题，因为它们是以明文形式存储，可能会造成安全风险，因为任何人都可以打开并篡改cookie。

Cookie容易在客户端被发现意味着它们很容易被黑客入侵和修改。

2.大小有限制，只能储存简单字符串信息*

4.vuex

**优点:** vuex的数据存储在内存中，保密性较高

**缺点:**刷新页面(这里 的刷新页面指的是--> F5刷新,属于清除内存了)时vuex存储的值会丢失

### 十七、vue的生命周期钩子函数

**初始化**

**beforeCreate---无法获取data/methods**

created ---vue实例创建完毕(data和methods等等) 

可以访问this 				

可以访问data中数据 				

可以访问methods里的函数 				

注册一些全局事件, eventBus, window的滚动事件, 定时器 				

在这个函数内发送ajax请求

**挂载**

beforeMount ---无法获取真实DOM元素

mounted ---组件挂载完毕, 可以访问DOM元素

**更新**

beforeUpdate ---挂在以后,data更新,将要更新DOM之前

updated ---获取更新真实DOM  视图更新之后触发

**销毁** **(组件从真实DOM上移除)**

beforeDestroy ---手动清除 定时器/ 计时器/eventBus($off)

destroyed ---已经销毁 组件销毁之后 	注销全局事件, 停止定时器

在mounted阶段，若需要获取的元素或组件有v-if，v-for属性。

v-if的初始化结果为false。v-for遍历的数组初始化阶段无值。（即mounted阶段后，根据获得的后台数据来动态操作dom）这两种情况都会导致mounted阶段获取元素的语句获取不到dom。

### 十八、vuex

vuex是把数据集中存储到本地,组件之间可以数据共享，且数据是响应式的.有5个属性

① state：数据存放地，用于定义共享的数据。

② geeter：从state派生的数据，相当于state的计算属性 例如state里保存了数组,对数组进行过滤,此时我们就可以在geeter里操做

③ mutation：更新数据的方法，唯一 一个可以操作state 中数据的方法，必须是同步的，第一个参数是state，第二个参数是payload要更改的值

④ action：用来做异步操作的，一般用来发请求，在 action 中写入函数，然后在页面中用dispatch调用，然后在 action 中通过commit 去调用 mutation 通过 mutation 去操作state。

⑤ modules：模块化vuex，可以让每一个模块拥有自己的state、mutation、action、getters,使得结构非常清晰，方便管理

### 十九、vue混入

可以在组件中混入，也可以在全局混入，

面试题：1、如果混入对象中钩子函数和组件中的钩子函数冲突，会出现什么情况？

答：两个钩子都会触发，

2.如果是data中的数据，methods中的，出现的冲突，怎么办？

答：以组件中的数据为准

3.mixin中的数据和vuex中的数据有什么区别 ？

vuex中的数据是独一份的，只要在组件中修改vuex数据，那么依赖vuex的其他组件中都会一起改

混入对象中的数据是每一个组件独有的，不共享的

答:当我们的项目越来越大，我们会发现组件之间可能存在很多相似的功能，你在一遍又一遍的复制粘贴相同的代码段（data，method，watch、mounted等），如果我们在每个组件中去重复定义这些属性和方法会使得项目出现代码[冗余](https://so.csdn.net/so/search?q=%E5%86%97%E4%BD%99&spm=1001.2101.3001.7020)并提高了维护难度，针对这种情况官方提供了Mixins特性.

当我们存在多个组件中的数据或者功能很相近时，我们就可以利用mixins将公共部分提取出来，通过 mixins封装的函数，组件调用他们是不会改变函数作用域外部的。

### 二十、nicktick

场景:DOM更新是异步的 ,在函数内操作数据造成视图更新, 此时想拿到更新后的DOM元素,是无法拿到的(DOM异步更新)

解决方案

​	第一种:  在updated() { }钩子函数内可以拿到更新后的DOM元素

​	第二种: 在函数内调用 this.$nextTick(() => {可以获取到更新后的DOM})

$nextTick( )有没有用过，里面能不能获取到data中的数据？

this.$nextTick这个方法作用是，当数据被修改后使用这个方法，会回调获取更新后的dom再渲染出来

### 二十二.vue2中的响应式原理

响应式原理主要就是通过数据劫持，依赖收集，派发更新的方式来实现的

1.数据劫持，vue2是通过Object。defineProperty来将对象的每一个属性转化成set，get。

其中修改对象的属性时   就会触发set，   使用对象的属性时就会触发get

2.依赖收集。就是在渲染视图时  将watcher和具体的属性，通过发布订阅者模式管理，这样数据改变之后就能更精准的更新视图                                 

3.派发更新：它就是通过dep来执行watcher的notify方法

### 二十三.keep-alive

在组件切换过程中将状态保留在内存中，防止重复渲染DOM，减少加载时间及性能消耗，提高用户体验性。

### 二十四。MVC和MVVM区别

MVC是一种[设计模式](https://so.csdn.net/so/search?q=%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F&spm=1001.2101.3001.7020) 

MVC开始是存在于桌面程序中的，M是指业务模型，V是指[用户界面](https://baike.baidu.com/item/%E7%94%A8%E6%88%B7%E7%95%8C%E9%9D%A2?fromModule=lemma_inlink)，C则是控制器，使用MVC的目的是将M和V的实现代码分离，从而使同一个程序可以使用不同的表现形式 

MVVM与MVC的最大区别就是：它实现了View和Model的自动同步，也就是当Model的数据改变时，我们不用再自己手动操作Dom元素，来改变View的显示，而是改变数据后该数据对应View层显示会自动改变。MVVM并不是用VM完全取代了C，ViewModel存在目的在于抽离Controller中展示的业务逻辑，而不是替代Controller，其它视图操作业务等还是应该放在Controller中实现。



### 二十五、组件通信

父 传 子

:动态绑定属性  ----> prop接收  单向数据流

子 传 父

$emit---->@绑定自定义事件

父传子孙provide inject 作用: 依赖注入，父组件定义provide方法return需要分享给子孙组件的属性，子孙组件使用 inject 选项来接收指定的我们想要添加在这个实例上的 属性；

非响应式

vuex : 集中数据管理，数据共享, 数据是响应式的, 其他需要的组件直接获取使用即可

父子、兄弟、跨级 Event Bus 作用: 作为全局事件池，发布订阅事件

1 src/EventBus/index.js - 创建空白VUE对象并导出 main.js中声明并导出

2 在要传递值的组件 import引入eventbus method里写 eventBus.$emit("事件名",值) 

3 在要接收值的组件 import引入eventbus create中里写 eventBus.$on("事件名",函数体) 

ref 作用: 通过 ref 获取子组件的引用(实例)，不是响应式的

$attrs $listeners 作用: 获取父作用域中除了 props 中声明的属性( class 和 style 也不包含在内) 和 事件( .native 除外)

$parent $children 作用: 获取当前组件的父实例和所有子实例(非响应式)

$root 作用: 获取当前组件数的根实例，实际上和 vuex 有相似之处


### 一、谈一谈你项目中token是如何存储的? 为什么这么存?

​      通过vuex获取本地存储进行存储，因为vuex数据刷新页面会丢失，所以这个时候就用到了本地存储，cookie或者localStorage，localStorage生命周期是永久，这样意味着信息将长期存在。

token直接存放在本地存储，拿出来不太方便，要先从本地存储取出，再放到vue实例的data函数中，还有它不是响应式的，也就是本地存储里面的内容发生改变，页面不会发生改变

### 二、公司的项目token过期时间是多久? 如何提高用户体验, 不需要用户重复登录?(具体怎么做)

目前公司token处理:  登录成功后, 后端给你2个token  ①短token(用于发请求注入到请求头的, 时效一般只有2小时)  ②长token(用来刷新短token的, 时效一般是7天或者14天)
①短token失效, 在响应拦截器得知token失效, 判断失效的代码, 一旦判断条件成立
②发送一次刷新token的请求, 拿到最新的token, 存储到vuex内
③再发送一次用户上次失败的axios
④让用户无感知,把失败的请求变成了成功的请求     

### 三、项目中路由跳转(配合token)权限怎么做?(尽量说详细) 

  首先我们需要定义一个白名单，确认那些页面没有token可以被访问。

然后在路由前置导航手守卫进行token权限处理，获取本地存储的token如果token存在的话，是不可以访问登录页面，进行免登录处理。其他的页面则可以正常访问，如果token不存在，用户只能访问白名单内的页面，访问其他页面我们强制给用户跳转到登录页面，必须重新登录、

# js常用数据转换方法

##### 一、将数据转换成树状

```
/** *
 *
 *  将列表型的数据转化成树形数据 => 递归算法 => 自身调用自身 => 一定条件不能一样， 否则就会死循环
 *  遍历树形 有一个重点 要先找一个头儿
 * ***/
export function tranListToTreeData(list, rootValue) {
  var arr = []
  list.forEach(item => {
    if (item.pid === rootValue) {
      // 找到之后 就要去找 item 下面有没有子节点
      const children = tranListToTreeData(list, item.id)
      if (children.length) {
        // 如果children的长度大于0 说明找到了子节点
        item.children = children
      }
      arr.push(item) // 将内容加入到数组中
    }
  })
  return arr
}
```

##### 二、过滤需要的数据

```
const menuRouter = ['settings', 'social_securitys', 'permissions']

// 过滤数组
 const newasyncRoutes = asyncRoutes.filter(item => {
   返回一个只包含 
   return menuRouter.includes(item.name)
 })
 console.log(newasyncRoutes)

```

# sass、less

##### 1.scss中如何定义一个变量?

直接    $变量名：变量值 
使用直接在需要的地方使用$变量名
如果跨文件使用需要引入

##### 2.scss中如何使用混入语法? 写个简单的demo

@mixin singleline-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.text {
    width: 600px;
    @include singleline-ellipsis;
}

.content-text {
    width: 1000px;
    @include singleline-ellipsis;
}
##### 3.scss中的样式怎么写? less中的样式穿透怎么写?什么时候用样式穿透?

sass     ::v-deep 只作用于 sass

less样式穿透 使用 /deep/

当我们引入第三方组件库时(如使用element-ui)，需要在局部组件中修改第三方组件库样式，而又不想去除scoped属性造成组件之间的样式覆盖。这时候我们就需要样式穿透来实现我们想要的效果。

# git常用

git clone 远程仓库地址 https或者SSH都行--->下载远程仓库的代码

vscdoe左下角有分支图形，点击--->创建分支

在当前分支下  git pull--->拉取远程分支代码

git add .----> 把修改的所有文件放到暂存区

git commit -m "对本次提交的描述信息"---> 文件提交到仓库(前提要暂存文件)

git push -u origin 分支名    这个是让本地和远程分支名字一致

git push 推送代码到远程仓库

git解决冲突的方法：首先在项目目录上点击右键，点击双向红箭头的位置；然后选择需要修改冲突的文件，选择merge tool；接着将代码合并；最后再次点击右键选择commit提交代码。 

图标大屏配置

大屏适配: 