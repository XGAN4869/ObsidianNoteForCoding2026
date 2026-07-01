## 这个文件是干嘛的

`PermissionView` 是一个“权限显示组件”。

它的核心作用是：

- 有权限时，显示默认插槽里的内容。
- 没权限时，默认隐藏内容。
- 如果设置成 `mode="mask"`，没权限时不隐藏，而是显示遮罩内容。

最常见用法：

```vue
<!-- 判断普通按钮权限，默认 scope 是 rule -->
<PermissionView code="xxx:create" >
  <button>新增</button>
</PermissionView>

<!-- 判断菜单权限，需要显式写 scope="menu" -->
<PermissionView code="order_audit_center:list" scope="menu" >
  <view>我的单据</view>
</PermissionView>
```

## 它接收什么数据

组件 props 有 5 个：

```js
props: {
  code: {
    type: String,
    default: '',
  },
  codes: {
    type: Array,
    default: () => [],
  },
  mode: {
    type: String,
    default: PERMISSION_VIEW_MODE.HIDE,
  },
  maskText: {
    type: String,
    default: '***',
  },
  scope: {
    type: String,
    default: 'rule',
  },
}
```

含义：

- `code`：单个权限码，例如 `order_audit_center:list`。
- `codes`：多个权限码数组，只要命中其中一个就显示。
- `mode`：无权限时的展示模式，默认隐藏。
- `maskText`：遮罩模式下的默认文案。
- `scope`：判断哪一类权限，支持 `rule`、`menu`、`dialog`。

## 它返回什么结果

它不是普通函数，而是 Vue 组件。

最终模板结果只有两种：

```vue
<view v-if="canShow" >
  <slot />
</view >

<view v-else-if="isMaskMode" >
  <slot name="mask" >
    <text >{{ maskText }}</text >
  </slot >
</view >
```

意思是：

1. `canShow` 为 `true`：显示你包在里面的内容。
2. `canShow` 为 `false` 且是 mask 模式：显示遮罩插槽或默认 `***`。
3. `canShow` 为 `false` 且是 hide 模式：什么都不显示。

## 它中间做了哪几步

### 1. 先定义权限显示模式

```js
export const PERMISSION_VIEW_MODE = {
  HIDE: 'hide',
  MASK: 'mask',
};
```

这一步是把固定字符串抽成常量。

好处是：

- 避免到处手写 `'hide'` 和 `'mask'`。
- 后面如果要改模式名称，只需要改一个地方。

### 2. 整理传进来的权限码

```js
function normalizeCodeList(code, codes) {
  const mergedCodes = [];

  if (code) {
    mergedCodes.push(code);
  }

  if (Array.isArray(codes)) {
    mergedCodes.push(...codes);
  }

  return mergedCodes
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}
```

这个函数做的是“把单个 code 和多个 codes 合并成一个干净数组”。

例如：

```js
normalizeCodeList('a:list', ['b:list', ''])
```

会得到：

```js
['a:list', 'b:list']
```

它做了三件小事：

1. 如果有 `code`，先放进去。
2. 如果 `codes` 是数组，再把数组展开进去。
3. 最后把空字符串、空格、`null` 这种脏值过滤掉。

### 3. 判断有没有权限

```js
export function canShowByPermission({ code = '', codes = [], ruleNames = [] } = {}) {
  const permissionCodes = normalizeCodeList(code, codes);

  if (!permissionCodes.length) {
    return false;
  }

  if (Array.isArray(ruleNames)) {
    return permissionCodes.some((permissionCode) => ruleNames.includes(permissionCode));
  }

  if (ruleNames && typeof ruleNames === 'object') {
    return permissionCodes.some((permissionCode) => Object.prototype.hasOwnProperty.call(ruleNames, permissionCode));
  }

  return false;
}
```

这个函数是整个组件最核心的判断函数。

它的规则是：

- 传入的权限码为空，直接返回 `false`。
- 当前权限集合是数组，就用 `includes` 判断。
- 当前权限集合是对象，就判断对象里有没有这个 key。
- 多个权限码只要命中一个，就返回 `true`。

重点是这一句：

```js
permissionCodes.some((permissionCode) => ruleNames.includes(permissionCode))
```

`some` 的意思是“只要有一个符合条件就算通过”。

所以：

```vue
<PermissionView :codes="['a:list', 'b:list']" >
```

不是要求两个权限都有，而是有任意一个就显示。

### 4. 规范化显示模式

```js
export function normalizePermissionMode(mode) {
  return mode === PERMISSION_VIEW_MODE.MASK ? PERMISSION_VIEW_MODE.MASK : PERMISSION_VIEW_MODE.HIDE;
}
```

这个函数做的是“模式兜底”。

如果传的是：

```js
'mask'
```

就使用遮罩模式。

否则统一按：

```js
'hide'
```

处理。

这样可以避免外面乱传字符串导致页面出现奇怪状态。

### 5. 根据 scope 选择权限集合

```js
export function getPermissionNamesByScope(scope = 'rule', permissionStore) {
  const currentPermissionStore = permissionStore || usePermissionStore();

  if (scope === 'dialog') {
    return Array.isArray(currentPermissionStore.dialogNames) ? currentPermissionStore.dialogNames : [];
  }

  if (scope === 'menu') {
    return Array.isArray(currentPermissionStore.menuCodes) ? currentPermissionStore.menuCodes : [];
  }

  return Array.isArray(currentPermissionStore.ruleNames) ? currentPermissionStore.ruleNames : [];
}
```

这个函数决定“到底拿哪一份权限来判断”。

当前项目有三类权限：

- `ruleNames`：页面按钮 / 页面内权限。
- `menuCodes`：菜单权限。
- `dialogNames`：弹窗权限。

所以：

```vue
<PermissionView code="order_audit_center:list" scope="menu" >
```

判断的是：

```js
permissionStore.menuCodes
```

而不是：

```js
permissionStore.ruleNames
```

这也是调试权限问题时最容易弄错的地方。

### 6. 提供脚本里可调用的权限执行函数

```js
export function executeByPermission({
  code = '',
  codes = [],
  scope = 'rule',
  onSuccess,
  onFail,
  permissionStore,
} = {}) {
  const permissionNames = getPermissionNamesByScope(scope, permissionStore);

  const hasPermission = canShowByPermission({
    code,
    codes,
    ruleNames: permissionNames,
  });

  const callbackPayload = {
    hasPermission,
    code: String(code || '').trim(),
    codes: normalizeCodeList(code, codes),
    scope,
    permissionNames,
  };

  if (hasPermission) {
    if (typeof onSuccess === 'function') {
      return onSuccess(callbackPayload);
    }

    return true;
  }

  if (typeof onFail === 'function') {
    return onFail(callbackPayload);
  }

  return false;
}
```

这个函数适合在 JS 点击事件里使用。

比如有些按钮不是想直接隐藏，而是点击时判断：

- 有权限：继续执行。
- 没权限：弹提示。

这个时候就可以用 `executeByPermission`。

固定流程是：

1. 先根据 `scope` 拿权限集合。
2. 再调用 `canShowByPermission` 判断是否有权限。
3. 整理一个回调参数 `callbackPayload`。
4. 有权限就执行 `onSuccess`。
5. 没权限就执行 `onFail`。

### 7. 组件内部用 computed 自动计算

```js
setup(props) {
  const permissionStore = usePermissionStore();

  const normalizedMode = computed(() => normalizePermissionMode(props.mode));

  const permissionNames = computed(() =>
    getPermissionNamesByScope(props.scope, permissionStore)
  );

  const canShow = computed(() =>
    canShowByPermission({
      code: props.code,
      codes: props.codes,
      ruleNames: permissionNames.value,
    }),
  );

  const isMaskMode = computed(() => normalizedMode.value === PERMISSION_VIEW_MODE.MASK);

  return {
    canShow,
    isMaskMode,
  };
}
```

这里用了多个 `computed`。

原因是这些值都是“由已有数据计算出来的”：

- `normalizedMode` 由 `props.mode` 算出来。
- `permissionNames` 由 `props.scope` 和 `permissionStore` 算出来。
- `canShow` 由 `props.code`、`props.codes`、`permissionNames` 算出来。
- `isMaskMode` 由 `normalizedMode` 算出来。

这样写的好处是：

- 权限 store 变化时，页面会自动重新计算。
- props 变化时，显示状态也会自动更新。
- 不需要手动写 watch。

## 小白应该怎么模仿

写这种组件时，可以按这个顺序：

1. 先确定组件接收哪些 props。
2. 再把固定字符串抽成常量。
3. 再写一个小函数清洗传入参数。
4. 再写一个核心判断函数。
5. 再用 computed 把判断结果接到模板。
6. 最后模板里只做简单的 `v-if` / `v-else-if`。

## 示例代码

示例代码仅供参考，需要你手动复制到项目中。

```js
// 1. 把固定模式抽成常量，避免到处写字符串
const VIEW_MODE = {
  HIDE: 'hide',
  MASK: 'mask',
};

// 2. 统一整理外部传进来的权限码，避免空值和空格影响判断
function normalizeCodes(code, codes) {
  const list = [];

  // 单个权限码存在时，先加入数组
  if (code) {
    list.push(code);
  }

  // 多个权限码必须是数组，防止字符串被当成数组错误处理
  if (Array.isArray(codes)) {
    list.push(...codes);
  }

  // 统一转字符串、去空格、过滤空值
  return list.map((item) => String(item || '').trim()).filter(Boolean);
}

// 3. 核心判断函数，只负责回答“有没有权限”
function hasPermission(code, codes, permissionList) {
  const targetCodes = normalizeCodes(code, codes);

  // 没传权限码时，默认不显示，避免误放开权限
  if (!targetCodes.length) {
    return false;
  }

  // 只要命中一个权限码，就认为可以显示
  return targetCodes.some((targetCode) => permissionList.includes(targetCode));
}
```

## 举一反三

以后看到类似工具函数，可以按这个套路理解：

- `normalizeXXX`：一般是整理参数，把脏数据变干净。
- `canXXX` / `hasXXX`：一般是返回布尔值，用来判断能不能做某件事。
- `getXXXByScope`：一般是根据类型选择不同数据源。
- `executeXXX`：一般是判断后执行成功或失败回调。
- `computed`：适合处理“由已有数据推导出来”的显示状态。

## 一句话总结

`PermissionView` 的核心套路就是：先按 `scope` 选权限集合，再把 `code/codes` 整理成数组，最后判断权限集合里有没有命中的 code，有就显示，没有就隐藏或显示遮罩。
