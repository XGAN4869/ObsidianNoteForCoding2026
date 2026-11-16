# TypeScript

## Omit<T, K>

`Omit<T, K>` = **从类型 `T` 里删掉 `K` 列出的字段，返回一个新类型**。

```ts
interface User {
  id: number
  name: string
  age: number
}

type UserWithoutAge = Omit<User, 'age'>
// 等价于 { id: number; name: string }
```

- `K` 可以是联合：`Omit<T, 'a' | 'b'>` 一次删多个。
- 只删**第一层**字段，不会递归进嵌套对象；要改嵌套类型得单独处理。
- 原类型不变，`Omit` 只是算出一个新类型。

## 常见用法：删掉再重新声明

后端 VO 的字段和前端要用的类型经常只差几个（比如 long 型 ID 需要转成 `string`），
用 `Omit` 先删掉，再用 `&` 把新声明合回去：

```ts
export interface NoteDetail extends Omit<NoteDetailVO, 'noteId' | 'videoSize' | 'author'> {
  noteId: string
  videoSize: string
  author: Omit<NoteDetailVO['author'], 'userId'> & { userId: string }
}
```

读法：

1. `Omit<NoteDetailVO, 'noteId' | 'videoSize' | 'author'>`：原 VO 除了这三个字段，其余字段全部保留。
2. 花括号里重新声明 `noteId: string`、`videoSize: string`，覆盖掉被删掉的字段。
3. 嵌套的 `author` 用同样的套路：先 `Omit<..., 'userId'>` 去掉 `userId`，再 `& { userId: string }` 合回来。

`&` 是交叉类型，把两个类型的字段并在一起。注意它**不会覆盖**同名字段：如果两边都有 `noteId` 且类型不同，结果会变成 `never`。所以顺序必须是「先用 `Omit` 删干净，再用 `&` 加回来」。

## 相关工具类型

| 工具类型 | 作用 |
| --- | --- |
| `Omit<T, K>` | 删掉 K 列出的字段 |
| `Pick<T, K>` | 只保留 K 列出的字段 |
| `Partial<T>` | 所有字段变可选 |
| `Required<T>` | 所有字段变必填 |
| `Readonly<T>` | 所有字段变只读 |
