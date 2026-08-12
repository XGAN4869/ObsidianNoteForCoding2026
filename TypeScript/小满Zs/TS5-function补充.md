# TypeScript 中的 `Obj`、对象方法与 `this`

## 一、原始代码

```ts
interface Obj {
  user: number[]

  // 调用 add 时，函数内部的 this 按 Obj 类型检查
  add: (this: Obj, num: number) => void
}

const obj: Obj = {
  user: [1, 2, 3],

  add(this: Obj, num: number) {
    this.user.push(num)
  },
}

obj.add(4)
```

调用后：

```ts
console.log(obj.user) // [1, 2, 3, 4]
```

---

## 二、老师为什么要把 `add` 写两遍？

因为它们不是同一个作用。

### 1. `interface Obj`：规定格式

```ts
interface Obj {
  user: number[]
  add: (this: Obj, num: number) => void
}
```

这只是告诉 TypeScript：

> 一个符合 `Obj` 类型的对象，必须有 `user` 和 `add`。

`interface` 只做类型检查，不会创建真正的对象，也不会自动生成 `add` 方法。

### 2. `const obj`：创建真实对象

```ts
const obj: Obj = {
  user: [1, 2, 3],
  add(this: Obj, num: number) {
    this.user.push(num)
  },
}
```

这里才是真正创建一个可以运行的对象，所以必须把 `add` 的具体实现写出来。

可以把它理解成：

> `interface` 负责“规定应该有什么”，对象字面量负责“真正提供这些东西”。

---

## 三、`obj: Obj` 到底表示什么？

```ts
const obj: Obj = { ... }
```

意思是：

> 变量 `obj` 里的对象，必须符合 `Obj` 的结构。

对应关系如下：

| `Obj` 中的规定 | `obj` 中的实际内容 |
|---|---|
| `user: number[]` | `user: [1, 2, 3]` |
| `add: (...) => void` | `add(num) { ... }` |

不是说 `add` 和 `user` 的类型要一样，而是对象中的每个属性，都要符合接口中同名属性的规定。

例如，下面会报错：

```ts
const obj: Obj = {
  user: ['a', 'b'], // 错误：不是 number[]
}
```

因为缺少 `add`，而且 `user` 也不是 `number[]`。

---

## 四、重点：`this: Obj` 是什么？

代码中的：

```ts
add: (this: Obj, num: number) => void
```

以及：

```ts
add(this: Obj, num: number) {
  this.user.push(num)
}
```

这里的 `this: Obj` 是 TypeScript 的“显式 `this` 参数”。

它是在告诉 TypeScript：

> 这个方法运行时的 `this`，应该按照 `Obj` 类型来检查。

### 注意：`this` 不是普通参数

调用时不需要手动传入 `this`：

```ts
obj.add(4)
```

这里的 `4` 对应的是 `num`，不是 `this`。

```ts
this: Obj // 给 TypeScript 检查用
num: number // 真正由调用者传入的参数
```

`this: Obj` 在编译成 JavaScript 后会被删除，它不会成为真正的函数参数。

---

## 五、调用时 `this` 指向谁？

当这样调用：

```ts
obj.add(4)
```

因为是“对象.方法()”的调用形式，所以 `add` 内部的 `this` 指向 `obj`。

因此：

```ts
this.user.push(num)
```

可以帮助理解成：

```ts
obj.user.push(4)
```

最终数组变成：

```ts
[1, 2, 3, 4]
```

“`this` 是一个指针”可以作为入门阶段的比喻，但更准确地说：

> `this` 是函数运行时根据调用方式确定的当前对象。

例如：

```ts
const obj1 = {
  user: [1, 2, 3],
  add(num: number) {
    this.user.push(num)
  },
}

const obj2 = {
  user: [10, 20],
  add(num: number) {
    this.user.push(num)
  },
}

obj1.add(4) // this 指向 obj1
obj2.add(5) // this 指向 obj2
```

同样的逻辑，哪个对象调用方法，`this` 就代表哪个对象。

---

## 六、为什么方法里要用 `this.user`？

方法需要访问“当前对象自己的 `user`”：

```ts
add(num: number) {
  this.user.push(num)
}
```

如果直接写：

```ts
obj.user.push(num)
```

方法就和变量名 `obj` 绑定死了，换成另一个对象时不够灵活。

使用 `this.user` 后，方法可以被不同对象复用：

```ts
obj1.add(4) // 修改 obj1.user
obj2.add(5) // 修改 obj2.user
```

---

## 七、这和 Vue 2、Vue 3 有什么关系？

这段代码本身不是 Vue 代码，而是普通 TypeScript 对象的例子。

### Vue 2 或 Vue 3 Options API

在 Options API 中，经常通过组件实例使用 `this`：

```ts
export default {
  data() {
    return {
      count: 0,
    }
  },

  methods: {
    add() {
      this.count++
    },
  },
}
```

### Vue 3 Composition API / `<script setup>`

你平时使用的可能是这种写法：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const user = ref<number[]>([1, 2, 3])

function add(num: number) {
  user.value.push(num)
}
</script>
```

这里直接使用 `user`，所以通常不需要 `this.user`。

结论：

> 截图里的 `this` 不是 Vue 2 专属写法，而是 JavaScript/TypeScript 对象方法中的 `this`。Vue 3 `<script setup>` 只是通常不依赖组件实例 `this`。

---

## 八、可以先这样简化理解

```ts
interface Obj {
  user: number[]
  add(num: number): void
}

const obj: Obj = {
  user: [1, 2, 3],

  add(num) {
    this.user.push(num)
  },
}
```

学习顺序建议：

1. 先理解 `interface` 是“规定对象结构”。
2. 再理解 `obj: Obj` 是“要求这个对象符合该结构”。
3. 再理解 `this.user` 是“访问当前调用方法的对象的 `user`”。
4. 最后再理解 `this: Obj` 是 TypeScript 给这个 `this` 添加的类型说明。

## 一句话总结

> `interface Obj` 只负责规定对象应该有什么，`obj` 才是真正创建对象；`this: Obj` 告诉 TypeScript 方法里的 `this` 按 `Obj` 类型检查，而 `obj.add(4)` 调用时，`this` 就指向 `obj`。

