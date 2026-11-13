## vite.config.ts
- Node 侧，不是浏览器环境，所以无法自动 import.meta.env, 所以为了前端开发方便需要手动加载环境变量进去
  - 来源：磁盘上 `.env*` 文件
  - src 业务代码：Vite 自动提取 VITE_开头，注入到 `import.meta.env`，不用 loadEnv
  - （Node 环境）：Vite 不会自动注入 → **必须手动 loadEnv 读取** Node 环境下为了读取到 env 【浏览器环境不需要，所以不在 vite.config.ts 文件中在 src 业务源码（浏览器侧）是不需要的，可以直接 import.meta.env】
    - `loadEnv(mode, cwd, 'VITE_')` → 只返回名字以 `VITE_` 开头的变量
    - `loadEnv(mode, cwd, '')` → **全部变量都读出来，不管前缀是什么**
    - 👉 `NODE_ENV` 偏向给 Node 生态（webpack、很多 npm 包）识别；`MODE` 是 Vite 自己设计，用来区分**一套打包命令加载哪一套 .env 文件**。
    - export default defineConfig (({command, mode})：👉 **它只会加载当前这一个 mode 对应的一组 env 文件，不会一次性把 development /production/staging 全部读进来。**

## 内置标记（MODE/DEV/PROD...）
https://cn.vite.dev/guide/env-and-mode#built-in-constants
- 来源：Vite 根据启动参数自动生成
- 读取位置：src 业务代码 → `import.meta.env.DEV`
- 作用：区分开发 / 生产打包分支，tree-shaking
    ```ts
    // src里直接写，不用自己维护 VITE_IS_DEV
    if (import.meta.env.DEV) {
    // 开发：打印日志、开启mock
    }
    if (import.meta.env.PROD) {
    // 生产：关闭调试、上报错误
    }
    ```
