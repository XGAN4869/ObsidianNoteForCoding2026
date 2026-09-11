
Chrome
  └── 提交任务：打开窗口、解析网页、执行 JavaScript

操作系统内核
  └── 决定哪个线程现在可以使用 CPU

CPU
  └── 真正执行机器指令
```mermaid
flowchart LR
    CLICK[点击Chrome图标]
    CLICK --> OS[操作系统]
    OS --> PROC[创建Chrome进程]
    PROC --> VM[建立虚拟内存地图]
    VM --> THREAD[创建线程]
    THREAD --> READY[进入就绪队列]
    READY --> CPU[CPU执行Chrome机器指令]

    CPU --> RUNTIME[初始化JS运行时]
    RUNTIME --> V8[V8引擎]
    V8 --> READ[读取JS源码]
    READ --> AST[解析生成AST]
    AST --> BYTECODE[生成字节码]
    BYTECODE --> INT[Ignition解释器]
    INT --> HOT{达到热点阈值？}
    HOT -- 否 --> INT
    HOT -- 是 --> JIT[JIT生成机器码]
    JIT --> CPU
    INT -.解释器本身也是机器码.-> CPU
```

### chrome 多进程
Chrome
├── 浏览器主进程
│   ├── 窗口
│   ├── 地址栏
│   ├── 标签页管理
│   └── 用户操作
│
├── 渲染进程
│   ├── 解析 HTML
│   ├── 计算 CSS
│   ├── 执行 JavaScript
│   └── 生成页面画面
│
├── 网络服务进程
│   ├── DNS
│   ├── HTTP
│   └── TCP / TLS
│
└── GPU 进程
    └── 图层合成和图形相关工作


```mermaid
flowchart TB
    User["用户点击 Chrome 图标"]
    Shell["桌面程序 / 文件管理器"]
    User --> Shell
    Shell -->|"系统调用：请启动程序"| Kernel

    subgraph OS["操作系统（Windows / Linux / macOS）"]
        direction TB

        Kernel["操作系统内核"]

        Process["进程管理<br/>创建 PID、进程、线程"]
        Memory["内存管理<br/>虚拟内存、页表、代码区、动态库、堆、栈"]
        Loader["程序加载器<br/>读取 chrome.exe / 可执行文件"]
        Scheduler["CPU 调度器<br/>决定哪个线程现在运行"]
        Driver["设备驱动与网络栈<br/>硬盘、网卡、显卡"]
        Ready["就绪队列<br/>Chrome、音乐软件、聊天软件等线程"]

        Kernel --> Process
        Kernel --> Memory
        Kernel --> Loader
        Kernel --> Scheduler
        Kernel --> Driver

        Process --> Ready
        Scheduler -->|"从就绪队列挑一个线程"| CPU
    end

    Loader -->|"创建并装入"| BrowserProcess

    subgraph CH["Chrome / Chromium（应用程序）"]
        direction TB

        BrowserProcess["浏览器主进程<br/>窗口、地址栏、标签页管理"]
        Renderer["渲染进程<br/>处理某个网页"]
        Network["网络服务进程<br/>DNS、HTTP、TCP/TLS"]
        GPU["GPU 进程<br/>图层合成、图形处理"]

        Blink["Blink 浏览器引擎<br/>HTML/CSS → DOM、布局、绘制"]
        V8["V8 JavaScript 引擎<br/>执行 JavaScript"]

        BrowserProcess --> Renderer
        BrowserProcess --> Network
        BrowserProcess --> GPU

        Renderer --> Blink
        Renderer --> V8
    end

    BrowserProcess -->|"包含主线程"| BrowserThread["Chrome 主线程"]
    Renderer -->|"包含渲染线程"| RenderThread["渲染线程"]
    Network -->|"包含网络线程"| NetworkThread["网络线程"]
    GPU -->|"包含 GPU 相关线程"| GPUThread["GPU 线程"]

    BrowserThread --> Ready
    RenderThread --> Ready
    NetworkThread --> Ready
    GPUThread --> Ready

    CPU["CPU 核心<br/>真正执行机器指令"]
    CPU -->|"执行被选中的线程"| ChromeCode["Chrome / Blink / V8 的机器指令"]

    Network -->|"请求文件、发送网络数据"| Kernel
    Kernel --> Driver
    Driver --> Internet["网卡 / 互联网 / 服务器"]

    Blink --> Pixels["网页画面"]
    GPU --> Pixels
    Pixels --> Screen["屏幕像素"]

    classDef os fill:#e8f1ff,stroke:#3478c9,color:#111;
    classDef chrome fill:#eaffea,stroke:#2e8b57,color:#111;
    classDef cpu fill:#fff2cc,stroke:#c98a00,color:#111;
    classDef result fill:#fce4ec,stroke:#c2185b,color:#111;

    class Kernel,Process,Memory,Loader,Scheduler,Driver,Ready os;
    class BrowserProcess,Renderer,Network,GPU,Blink,V8,BrowserThread,RenderThread,NetworkThread,GPUThread chrome;
    class CPU,ChromeCode cpu;
    class Pixels,Screen,Internet result;
```

