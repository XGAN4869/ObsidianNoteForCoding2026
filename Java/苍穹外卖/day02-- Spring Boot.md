# day02 Spring Boot

## 环境准备

### JDK

安装并切换到适配的 JDK 版本。

### Maven 多模块工程

```xml
<modules>
    <module>sky-common</module>  <!-- 工具类、常量、异常、配置属性 -->
    <module>sky-pojo</module>    <!-- Entity / DTO / VO -->
    <module>sky-server</module>  <!-- Controller / Service / Mapper，启动类在这 -->
</modules>
```

| 模块          | 职责                                         |
| ------------- | -------------------------------------------- |
| `sky-common`  | 工具类、常量、异常、配置属性                 |
| `sky-pojo`    | Entity / DTO / VO                            |
| `sky-server`  | Controller / Service / Mapper，启动类在这   |

### 导入项目步骤

1. 先点 **Reload All Maven Projects**（或 Sync）
2. 检查代码是否编译通过：`compile`（确认 JDK 配置正确）
3. 改了公共模块的其他代码后需要 `install`

> [!note] compile 与 install 的关系
> `compile` 是生命周期里靠前的阶段，`install` 会自动走完 `compile`，也就是 `install` 包含 `compile`。
> 业务模块改完直接启动 SpringBoot 即可，不需要每次 `install`。

## 配置

### 数据库账号密码

在 `dev.yaml` 中修改数据库账号密码。

## 数据库环境搭建

> TODO：待补充

## 断点调试

- 调试图标旁使用 **`Ctrl + Alt + B`** 进入实现类，否则进入的是接口

### SQL 的位置

- 简单的 SQL 用注解
- 复杂的 SQL 配置到 mapper 映射文件中

## login 登录

> TODO：待补充
