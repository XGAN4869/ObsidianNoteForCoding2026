下适配的 jdk
⚪Maven：
<modules>
    <module>sky-common</module>  <!-- 工具类、常量、异常、配置属性 -->
    <module>sky-pojo</module>    <!-- Entity / DTO / VO -->
    <module>sky-server</module>  <!-- Controller / Service / Mapper，启动类在这 -->
</modules>
- steps
1. 先点Reload All Maven Projects（或者 Sync） 
2. 代码是否编译通过：compile jdk
3. 改公共模块其他代码有依赖：install -- 【业务模块改完直接启动 SpringBoot 不需要每次 install】
P.S. compile 是生命周期里靠前的阶段，install 会自动走完 compile，install 是包含 compile 的

⚪数据库账号密码在 dev.yaml 修改

⚪数据库环境搭建

⚪断点调试

⚪ctrl+alt+b 否则进入的是接口

⚪简单的 sql 注解，复杂的配置到 mapper 映射文件中
## login登录
