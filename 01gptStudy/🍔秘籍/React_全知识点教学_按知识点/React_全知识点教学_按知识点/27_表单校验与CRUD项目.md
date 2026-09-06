# 27. 表单校验与 CRUD 项目

## 27.1 本章要解决什么问题

到这一步，你已经会：

- 用 `useState` 保存数据；
- 用 `onChange` 处理输入；
- 用 `onClick` 处理按钮；
- 用 `map` 渲染列表；
- 用 `useEffect` 请求数据。

但真正的业务项目里，最常见的页面往往还是：

- 新增数据；
- 查看数据；
- 修改数据；
- 删除数据；
- 校验输入是否正确。

这四件事合起来，就叫 **CRUD**：

- **C**reate：新增；
- **R**ead：读取/查看；
- **U**pdate：更新；
- **D**elete：删除。

本章用一个最小但完整的例子，带你把这些事情串起来。

---

## 27.2 先理解一个重要原则

表单项目最重要的原则是：

```text
先设计数据，再写界面。
```

也就是说，不要一上来就写 JSX。  
先想清楚你的数据长什么样。

例如一个联系人可以长这样：

```jsx
{
  id: 1,
  name: '小明',
  phone: '13800000000',
  email: 'ming@example.com'
}
```

再想表单要填什么：

- 姓名；
- 手机号；
- 邮箱。

这样界面就很好写了。

---

## 27.3 表单最常见的状态

一个表单页面通常至少有这些状态：

```jsx
const [form, setForm] = useState({
  name: '',
  phone: '',
  email: '',
});

const [errors, setErrors] = useState({});
const [list, setList] = useState([]);
const [editingId, setEditingId] = useState(null);
```

解释：

- `form`：当前输入框内容；
- `errors`：每个字段的错误信息；
- `list`：表格或列表数据；
- `editingId`：当前是否处于编辑状态。

---

## 27.4 受控组件是表单基础

表单输入框推荐写成受控组件。

```jsx
<input
  name="name"
  value={form.name}
  onChange={handleChange}
/>
```

意思是：

- 输入框显示什么，完全由 state 决定；
- 用户输入后，`onChange` 再把值写回 state。

这叫“React 控制输入框”。

---

## 27.5 校验函数怎么写

验证规则最好单独写成函数，不要散落在各个事件里。

```jsx
function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = '姓名不能为空';
  }

  if (!/^\d{11}$/.test(form.phone.trim())) {
    errors.phone = '手机号必须是 11 位数字';
  }

  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = '邮箱格式不正确';
  }

  return errors;
}
```

这个函数做的事很简单：

- 检查姓名；
- 检查手机号；
- 检查邮箱；
- 返回错误对象。

如果没有错误，返回空对象 `{}`。

---

## 27.6 最小 CRUD 示例：联系人管理

下面是一个完整思路。

### 1）初始数据和表单

```jsx
import { useState } from 'react';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
};

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = '姓名不能为空';
  }

  if (!/^\d{11}$/.test(form.phone.trim())) {
    errors.phone = '手机号必须是 11 位数字';
  }

  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = '邮箱格式不正确';
  }

  return errors;
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: '小明',
      phone: '13800000000',
      email: 'ming@example.com',
    },
  ]);
  const [editingId, setEditingId] = useState(null);
```

### 2）输入变化

```jsx
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
```

解释：

- `name` 来自输入框的 `name` 属性；
- `[name]` 表示动态属性名；
- `...prev` 保留其他字段。

---

### 3）提交保存

```jsx
  function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (editingId === null) {
      const newContact = {
        id: Date.now(),
        ...form,
      };

      setContacts((prev) => [newContact, ...prev]);
    } else {
      setContacts((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...form } : item
        )
      );
      setEditingId(null);
    }

    setForm(emptyForm);
    setErrors({});
  }
```

这里分成两种情况：

- `editingId === null`：说明是新增；
- `editingId !== null`：说明是编辑。

这就是 CRUD 里最重要的一步。

---

### 4）点击编辑

```jsx
  function handleEdit(contact) {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    });
    setErrors({});
  }
```

点击编辑时，做三件事：

- 记录正在编辑哪一条；
- 把当前联系人数据放进表单；
- 清空错误信息。

---

### 5）点击删除

```jsx
  function handleDelete(id) {
    const ok = window.confirm('确定要删除这条联系人吗？');
    if (!ok) return;

    setContacts((prev) => prev.filter((item) => item.id !== id));

    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
      setErrors({});
    }
  }
```

删除时最好加确认框，避免误删。

---

### 6）取消编辑

```jsx
  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }
```

编辑到一半不想改了，就可以取消。

---

## 27.7 页面结构

```jsx
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>联系人管理</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            姓名：
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          {errors.name && <p style={{ color: 'red' }}>{errors.name}</p>}
        </div>

        <div>
          <label>
            手机号：
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          {errors.phone && <p style={{ color: 'red' }}>{errors.phone}</p>}
        </div>

        <div>
          <label>
            邮箱：
            <input name="email" value={form.email} onChange={handleChange} />
          </label>
          {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
        </div>

        <div>
          <button type="submit">
            {editingId === null ? '新增联系人' : '保存修改'}
          </button>
          {editingId !== null && (
            <button type="button" onClick={handleCancel}>
              取消
            </button>
          )}
        </div>
      </form>
```

这里注意两点：

- 提交按钮用 `type="submit"`；
- 取消按钮必须写 `type="button"`，不然默认也是提交按钮。

---

## 27.8 列表读取和操作

```jsx
      <hr />

      <ul>
        {contacts.map((contact) => (
          <li key={contact.id} style={{ marginBottom: 12 }}>
            <p>姓名：{contact.name}</p>
            <p>手机号：{contact.phone}</p>
            <p>邮箱：{contact.email || '未填写'}</p>

            <button onClick={() => handleEdit(contact)}>编辑</button>
            <button onClick={() => handleDelete(contact.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

这就是 Read、Update、Delete。

新增在上面的表单提交里已经完成。

---

## 27.9 这个例子里学到了什么

你已经把一个表单 CRUD 项目的主流程跑通了：

1. 用对象 state 保存表单；
2. 用受控组件接收输入；
3. 用 validate 做校验；
4. 用 `preventDefault` 阻止刷新；
5. 用数组 state 保存列表；
6. 用 `map` 显示列表；
7. 用 `filter` 删除；
8. 用 `map` 修改；
9. 用一个 `editingId` 区分新增和编辑。

---

## 27.10 表单项目常见细节

### 1）先 trim 再校验

```jsx
const value = form.name.trim();
```

这样可以避免用户只输入空格。

### 2）提交成功后重置表单

```jsx
setForm(emptyForm);
setErrors({});
setEditingId(null);
```

### 3）字段错误信息分开显示

不要只显示一个总错误。  
应该告诉用户哪个字段错了。

### 4）不要把校验写得太复杂

初学先学会：

- 空值校验；
- 长度校验；
- 格式校验；
- 必填校验。

复杂规则以后再逐步加。

---

## 27.11 常见错误

- 忘记 `e.preventDefault()`，导致表单提交后页面刷新；
- 输入框没有 `value`，变成半受控或失控；
- 校验函数写在 JSX 里，太乱；
- 删除时直接用 `splice` 修改原数组；
- 编辑和新增混在一起，不区分模式；
- 按钮没写 `type="button"`，不小心触发提交；
- 错误信息没有清理，导致旧错误一直显示。

---

## 27.12 小结与练习

本章重点：

- CRUD 是业务项目最常见的骨架；
- 表单项目先设计数据结构，再写页面；
- 受控组件是表单基础；
- 校验最好单独写成函数；
- 新增、编辑、删除都可以用 React state 完成；
- 用 `editingId` 区分新增和编辑，最容易理解。

练习：

1. 把联系人管理改成“学生管理”。
2. 增加“年龄”字段，并校验必须是数字。
3. 给表单加一个“搜索联系人”输入框。
4. 尝试把“编辑”改成弹窗编辑。
5. 想一想：如果数据来自后端，这个项目哪里要改？
