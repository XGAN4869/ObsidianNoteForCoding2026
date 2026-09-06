# React 全知识点教学：按知识点拆分

> 下面是按知识点拆分后的 React 教材文件列表。建议从 `00_总览.md` 开始，再按 01 到 32 顺序学习。  
> 教材主线：函数组件 + Hooks + Vite + React Router + Redux Toolkit/Zustand + TypeScript + 综合项目。

## 文件列表

- [0. 总览](00_总览.md)
- [1. 学习路线与前置知识](01_学习路线与前置知识.md)
- [2. React 是什么：核心思想与版本选择](02_React是什么_核心思想与版本选择.md)
- [3. 创建项目与开发环境](03_创建项目与开发环境.md)
- [4. JSX 语法](04_JSX语法.md)
- [5. 应用入口 createRoot](05_应用入口_createRoot.md)
- [6. 组件基础与拆分](06_组件基础与拆分.md)
- [7. Props：父组件向子组件传数据](07_Props_父传子.md)
- [8. State：useState](08_State_useState.md)
- [9. 事件处理](09_事件处理.md)
- [10. 条件渲染](10_条件渲染.md)
- [11. 列表渲染与 key](11_列表渲染与key.md)
- [12. 表单与受控组件](12_表单与受控组件.md)
- [13. 样式处理：className、style、CSS Modules](13_样式处理_className_style_CSSModules.md)
-[14. useEffect：副作用与清理](14_useEffect_副作用与清理⭐.md))
- [15. useRef：DOM 引用与可变值](15_useRef_DOM引用与可变值.md)
- [16. useMemo 与 useCallback](16_useMemo_useCallback.md)
- [17. React.memo 与性能优化基础](17_Reactmemo_性能优化基础.md)
- [18. Context：跨层传递数据](18_Context_跨层传递数据.md)
- [19. useReducer](19_useReducer.md)
- [20. 自定义 Hooks](20_自定义Hooks.md)
- [21. 组件组合、children 与插槽思想](21_组件组合_children_插槽思想.md)
- [22. 错误边界、Suspense 与 lazy](22_错误边界_Suspense_lazy.md)
- [23. React 18/19 常见能力与并发基础](23_React18_19常见能力与并发基础.md)
- [24. React Router：路由](24_ReactRouter_路由.md)
- [25. 状态管理：Redux Toolkit 与 Zustand](25_状态管理_ReduxToolkit_Zustand.md)
- [26. 网络请求、加载状态与错误处理](26_网络请求_加载与错误处理.md)
- [27. 表单校验与 CRUD 项目](27_表单校验与CRUD项目.md)
- [28. TypeScript 与 React](28_TypeScript与React.md)
- [29. 工程化、调试、性能、安全、测试与部署](29_工程化_调试_性能_安全_测试_部署.md)
- [30. 项目结构与最佳实践](30_项目结构与最佳实践.md)
- [31. 综合项目：任务管理系统](31_综合项目_任务管理系统.md)
- [32. 综合练习与学习检查表](32_综合练习与学习检查表.md)

## 官方参考资料

本套文档以官方资料的推荐写法为基础。学习时可以对照查看：

- React 官方文档：https://react.dev/
- React 学习文档：https://react.dev/learn
- React API 参考：https://react.dev/reference/react
- React DOM API 参考：https://react.dev/reference/react-dom
- Vite 官方文档：https://vite.dev/guide/
- React Router 官方文档：https://reactrouter.com/
- Redux Toolkit 官方文档：https://redux-toolkit.js.org/
- React Redux 官方文档：https://react-redux.js.org/
- Zustand 官方文档：https://zustand.docs.pmnd.rs/
- TypeScript 官方文档：https://www.typescriptlang.org/docs/

## 学习建议

1. 不要跳着学，先从 00、01、02 开始。
2. 每章代码都手打一遍，不要只复制。
3. 每章至少改一个地方，观察页面变化。
4. 学完 04 到 13 后，先做一个小页面。
5. 学完 14 到 20 后，做一个带请求和表单的小功能。
6. 学完 24 到 26 后，做一个带路由、请求、状态管理的 CRUD 页面。
7. 最后独立完成第 31 章任务管理系统，并按第 32 章检查表自测。

## 学习路线

```text
React 是什么
  ↓
创建项目和 JSX
  ↓
组件、props、state、事件
  ↓
条件渲染、列表、表单、样式
  ↓
Effect、Ref、性能基础
  ↓
Context、Reducer、自定义 Hooks
  ↓
children、Suspense、路由
  ↓
状态管理、网络请求、CRUD
  ↓
TypeScript、工程化、测试、部署
  ↓
综合项目
```

## 最重要的学习方法

请反复做四件事：

```text
看懂一句话解释
手打一遍代码
运行并观察
改一个地方再运行
```

能独立写出第 31 章的任务管理系统，就说明你已经真正入门 React。
