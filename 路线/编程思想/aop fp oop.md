# 全栈开发视角下的编程设计思想

> 技术主线：Vue 3 + TypeScript + Nest 风格 Node.js + 关系型数据库  
> 示例业务：电商下单与支付

## 1. 编程设计思想是什么

编程范式是组织程序、表达问题和管理复杂度的一套思维方式。它回答：

- 代码如何划分？
- 数据和状态由谁管理？
- 模块之间如何通信？
- 哪些逻辑应该复用？
- 如何限制修改影响？
- 如何让代码易测、易扩展、易维护？

| 范式 | 关注角度 | 典型问题 |
| --- | --- | --- |
| 结构化/命令式 | 执行步骤 | 先做什么，后做什么？ |
| 声明式 | 目标结果 | 最终希望得到什么？ |
| OOP | 对象和职责 | 谁负责什么？ |
| FP | 数据和变换 | 数据如何转换为结果？ |
| AOP | 横切关注点 | 日志、权限如何统一处理？ |
| 事件驱动 | 事件和消息 | 谁发布事件，谁响应？ |
| 响应式 | 数据依赖 | 数据变化后谁自动更新？ |
| 组件化 | 可复用单元 | 页面如何拆成独立组件？ |

真实项目通常是多种思想的组合。好的设计重点是高内聚、低耦合、可测试、可扩展和不过度复杂。

---

## 2. OOP：面向对象编程

OOP（Object-Oriented Programming）把系统看成一组相互协作的对象。对象拥有状态和行为，并通过方法或接口对外提供能力。

### 2.1 封装

封装的重点是限制状态修改入口，让对象自己保证规则，而不是简单地“把代码写进 class”。

~~~ts
class Order {
  private status: 'CREATED' | 'PAID' | 'CANCELLED' = 'CREATED'

  markPaid() {
    if (this.status !== 'CREATED') {
      throw new Error('只有待支付订单才能标记为已支付')
    }
    this.status = 'PAID'
  }

  getStatus() {
    return this.status
  }
}
~~~

### 2.2 抽象与多态

业务层依赖支付能力，而不是某个支付平台的 SDK：

~~~ts
interface PaymentGateway {
  createPayment(input: {
    orderId: string
    amountInCents: number
  }): Promise<{ paymentUrl: string }>
}

class AlipayGateway implements PaymentGateway {
  async createPayment(input) {
    return { paymentUrl: 'https://pay.example.com/' + input.orderId }
  }
}

class MockPaymentGateway implements PaymentGateway {
  async createPayment(input) {
    return { paymentUrl: 'http://test.local/pay/' + input.orderId }
  }
}
~~~

调用方只依赖接口：

~~~ts
async function startPayment(
  gateway: PaymentGateway,
  orderId: string,
  amountInCents: number,
) {
  return gateway.createPayment({ orderId, amountInCents })
}
~~~

### 2.3 组合优于继承

继承适合稳定的“是一种”关系，但复杂继承树容易产生强耦合。折扣可以组合成策略函数：

~~~ts
type DiscountRule = (subtotalInCents: number) => number

const memberDiscount: DiscountRule = subtotal =>
  Math.round(subtotal * 0.95)

const couponDiscount: DiscountRule = subtotal =>
  Math.max(0, subtotal - 1000)
~~~

### 2.4 OOP 在全栈项目中的落点

| 层次 | 典型职责 |
| --- | --- |
| Controller | 将 HTTP 请求转换为应用服务调用 |
| Service | 编排业务用例 |
| Entity/Value Object | 表达订单、金额、地址等领域概念 |
| Repository | 抽象持久化能力 |
| Adapter | 封装支付、短信、对象存储 SDK |

OOP 的核心问题是：对象是否拥有与自身相关的行为，职责是否清晰，依赖是否面向抽象。

---

## 3. FP：函数式编程

FP（Functional Programming）把程序看成数据经过函数转换的过程，特别适合计算、校验、映射和状态转换。

### 3.1 纯函数

纯函数满足：相同输入一定得到相同输出，并且不修改外部状态。

~~~ts
function calculateLineTotal(
  unitPriceInCents: number,
  quantity: number,
): number {
  return unitPriceInCents * quantity
}
~~~

纯函数不依赖数据库、网络、当前时间，因而容易测试。

### 3.2 不可变数据

更新数据时创建新值：

~~~ts
const user = { id: 'u1', name: 'Tom', age: 18 }
const updatedUser = { ...user, age: 19 }
~~~

不可变数据更容易追踪变化，也更适合撤销、重做和并发场景。

### 3.3 高阶函数和组合

函数可以作为参数和返回值：

~~~ts
function withTax(rate: number) {
  return (amountInCents: number) =>
    Math.round(amountInCents * (1 + rate))
}

const withTenPercentTax = withTax(0.1)
withTenPercentTax(1000) // 1100
~~~

数据处理可以写成组合管道：

~~~ts
const visibleProducts = products
  .filter(product => product.isPublished)
  .map(product => ({
    id: product.id,
    title: product.title,
    priceInCents: product.priceInCents,
  }))
~~~

### 3.4 将副作用放在边界

网络、数据库、文件和时间是必要的副作用，不应该被消灭，而应该集中在边界：

~~~ts
// 纯业务逻辑
function calculateOrderAmount(items: OrderItem[]) {
  const subtotalInCents = items.reduce(
    (sum, item) => sum + item.unitPriceInCents * item.quantity,
    0,
  )
  const discountInCents = subtotalInCents >= 10000 ? 1000 : 0

  return {
    subtotalInCents,
    discountInCents,
    totalInCents: subtotalInCents - discountInCents,
  }
}

// 副作用边界
async function createOrderUseCase(input: CreateOrderDto) {
  const products = await productRepository.findByIds(input.items)
  const items = buildOrderItems(products, input.items)
  const amount = calculateOrderAmount(items)
  return orderRepository.create({ items, amount })
}
~~~

FP 的核心问题是：能否把业务规则拆成小而稳定的变换，并让副作用可见、可控。

---

## 4. AOP：面向切面编程

AOP（Aspect-Oriented Programming）处理横切关注点：它们不属于某个业务模块，却会横跨很多模块。

典型横切关注点：

- 身份认证和权限
- 日志与链路追踪
- 事务
- 缓存
- 性能统计
- 异常转换
- 重试和限流

### 4.1 核心术语

| 术语 | 含义 | Nest 风格对应 |
| --- | --- | --- |
| Aspect | 一类横切行为 | 日志拦截器、权限策略 |
| Join Point | 可以插入行为的位置 | Controller 方法前后 |
| Pointcut | 指定哪些位置需要处理 | 路由、方法或装饰器 |
| Advice | 实际附加逻辑 | intercept、canActivate |
| Weaving | 组合切面与业务流程 | 框架运行时管道 |

Nest 不是传统 AspectJ 的编译期织入，但 Guard、Interceptor、Pipe、Filter 和装饰器提供了 AOP 风格的拦截能力。

### 4.2 鉴权 Guard

~~~ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.authorization

    if (!token) {
      throw new UnauthorizedException('缺少登录凭证')
    }

    request.user = verifyToken(token)
    return true
  }
}
~~~

订单方法不需要重复解析 token。

### 4.3 日志 Interceptor

~~~ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    const startedAt = Date.now()

    return next.handle().pipe(
      tap(() => {
        console.log({
          method: request.method,
          path: request.url,
          durationMs: Date.now() - startedAt,
        })
      }),
    )
  }
}
~~~

### 4.4 AOP 的边界

AOP 适合统一处理基础设施行为，不适合隐藏核心业务规则。以下规则应该直接出现在 Service 或领域对象中：

- 库存不足不能下单。
- 已支付订单不能重复支付。
- 支付金额必须和订单金额一致。
- 订单只能从合法状态迁移到下一个状态。

---

## 5. 其他重要思想

### 5.1 命令式与声明式

命令式描述“怎么做”：

~~~ts
let total = 0
for (const item of items) {
  total += item.unitPriceInCents * item.quantity
}
~~~

声明式描述“想要什么结果”：

~~~ts
const total = items.reduce(
  (sum, item) => sum + item.unitPriceInCents * item.quantity,
  0,
)
~~~

Vue 模板同样偏声明式：描述当前状态下应该显示什么，而不是手动操作 DOM。

### 5.2 模块化与分层

推荐的依赖方向：

~~~text
表现层（Vue / Controller）
        ↓
应用层（Use Case / Service）
        ↓
领域层（Entity / Pure Function）
        ↓
基础设施层（Repository / DB / SDK）
~~~

核心业务不应该直接依赖数据库驱动或第三方支付 SDK。

### 5.3 组件化

前端页面可以拆成：

- 页面容器：负责请求、路由和页面级状态。
- 业务区块：负责购物车、地址、支付方式。
- 展示组件：负责按钮、金额、商品卡片等纯展示。

组件之间优先使用 props、emit、v-model 和 composable；跨页面共享状态才考虑 store。

### 5.4 事件驱动

支付成功后发布领域事件，由库存、积分和通知模块分别订阅：

~~~ts
await eventBus.publish({
  type: 'OrderPaid',
  orderId: order.id,
  userId: order.userId,
})
~~~

支付流程不需要直接依赖所有后续模块。

### 5.5 响应式

响应式思想是声明数据依赖，数据变化后相关内容自动更新：

~~~ts
const quantity = ref(1)
const unitPrice = ref(1999)
const total = computed(() => quantity.value * unitPrice.value)
~~~

### 5.6 泛型与数据导向

泛型让算法依赖能力而不是具体类型：

~~~ts
function first<T>(items: T[]): T {
  return items[0]
}
~~~

数据导向设计则以数据布局和处理效率为中心，常见于游戏、数据库和大规模数据处理。

---

## 6. 完整案例：电商下单支付

### 6.1 业务目标

用户在 Vue 页面选择商品和数量，提交订单后：

1. 验证身份和请求参数。
2. 查询商品当前价格和库存。
3. 用纯函数计算订单金额。
4. 创建订单并扣减库存。
5. 调用支付网关生成支付地址。
6. 返回订单和支付信息。
7. 支付回调后标记已支付并发布事件。

### 6.2 数据流

~~~text
Vue 下单页
  → POST /api/orders
  → AuthGuard（身份）
  → ValidationPipe（参数）
  → OrderController（HTTP 适配）
  → OrderService（用例编排）
  → calculateOrderAmount（FP 纯计算）
  → OrderRepository（持久化）
  → PaymentGateway（外部支付）
  → 返回订单和支付地址
~~~

### 6.3 目录结构

~~~text
src/
├─ modules/orders/
│  ├─ order.controller.ts       # HTTP 接口
│  ├─ order.service.ts          # 用例编排
│  ├─ order.entity.ts           # 订单领域对象
│  ├─ order.types.ts            # DTO 和接口
│  ├─ order.calculator.ts       # FP 纯计算
│  ├─ order.repository.ts       # 持久化抽象
│  └─ order.events.ts           # 领域事件
├─ infrastructure/
│  ├─ database/
│  └─ payment/
└─ common/
   ├─ guards/
   ├─ interceptors/
   └─ filters/

web/src/
├─ pages/checkout/
├─ components/cart/
├─ components/ui/
├─ composables/useOrder.ts
└─ api/order.ts
~~~

### 6.4 核心类型

~~~ts
export type PaymentMethod = 'ALIPAY' | 'WECHAT'

export interface Product {
  id: string
  title: string
  priceInCents: number
  stock: number
  isPublished: boolean
}

export interface OrderItem {
  productId: string
  title: string
  unitPriceInCents: number
  quantity: number
}

export type OrderStatus = 'CREATED' | 'PAID' | 'CANCELLED'

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  subtotalInCents: number
  discountInCents: number
  totalInCents: number
  status: OrderStatus
}

export interface CreateOrderDto {
  items: Array<{ productId: string; quantity: number }>
  paymentMethod: PaymentMethod
}

export interface ApiResponse<T> {
  data: T
  requestId: string
  message?: string
}
~~~

金额使用“分”而不是浮点数，避免金额精度问题。

### 6.5 FP：订单金额计算

~~~ts
export function calculateOrderAmount(items: OrderItem[]) {
  const subtotalInCents = items.reduce(
    (sum, item) => sum + item.unitPriceInCents * item.quantity,
    0,
  )
  const discountInCents = subtotalInCents >= 10000 ? 1000 : 0

  return {
    subtotalInCents,
    discountInCents,
    totalInCents: subtotalInCents - discountInCents,
  }
}
~~~

它只依赖输入、不修改 items、不访问外部系统，因此适合单元测试和规则扩展。

### 6.6 OOP：订单领域对象

~~~ts
export class OrderEntity {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly items: OrderItem[],
    readonly totalInCents: number,
    private status: OrderStatus,
  ) {}

  static create(input: {
    id: string
    userId: string
    items: OrderItem[]
    totalInCents: number
  }) {
    return new OrderEntity(
      input.id,
      input.userId,
      input.items,
      input.totalInCents,
      'CREATED',
    )
  }

  markPaid() {
    if (this.status !== 'CREATED') {
      throw new Error('订单当前状态不允许支付')
    }
    this.status = 'PAID'
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      totalInCents: this.totalInCents,
      status: this.status,
    }
  }
}
~~~

订单负责状态规则，金额计算由纯函数负责，两者职责不同但可以协作。

### 6.7 依赖倒置：Repository 和支付接口

~~~ts
export interface OrderRepository {
  save(order: OrderEntity): Promise<void>
  findById(id: string): Promise<OrderEntity | null>
}

export interface PaymentGateway {
  createPayment(input: {
    orderId: string
    amountInCents: number
    method: PaymentMethod
  }): Promise<{ paymentUrl: string }>
}
~~~

OrderService 依赖接口，具体的 MySQL Repository 或支付宝实现由依赖注入提供。

### 6.8 Nest 风格 Controller

~~~ts
@Controller('api/orders')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Req() request, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(request.user.id, dto)
  }

  @Get(':id')
  getOne(@Req() request, @Param('id') id: string) {
    return this.orderService.getOrder(request.user.id, id)
  }

  @Post(':id/pay')
  pay(
    @Req() request,
    @Param('id') id: string,
    @Body() body: { paymentMethod: PaymentMethod },
  ) {
    return this.orderService.payOrder(
      request.user.id,
      id,
      body.paymentMethod,
    )
  }
}
~~~

Controller 只处理 HTTP 参数和响应，不承载金额计算和数据库细节。

### 6.9 Service：编排业务用例

~~~ts
@Injectable()
export class OrderService {
  constructor(
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const products = await this.products.findByIds(
      dto.items.map(item => item.productId),
    )
    const items = buildOrderItems(products, dto.items)
    const amount = calculateOrderAmount(items)

    const order = OrderEntity.create({
      id: crypto.randomUUID(),
      userId,
      items,
      totalInCents: amount.totalInCents,
    })

    await this.orders.save(order)

    const payment = await this.payments.createPayment({
      orderId: order.id,
      amountInCents: amount.totalInCents,
      method: dto.paymentMethod,
    })

    return {
      order: order.toJSON(),
      paymentUrl: payment.paymentUrl,
    }
  }
}
~~~

生产环境需要在事务中处理订单和库存，并为支付回调设计幂等策略；示例只展示边界。

### 6.10 Vue 3：声明式页面和状态

~~~vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { createOrder } from '@/api/order'

const quantity = ref(1)
const unitPriceInCents = ref(1999)
const paymentMethod = ref<'ALIPAY' | 'WECHAT'>('ALIPAY')
const submitting = ref(false)
const errorMessage = ref('')

const totalInCents = computed(() =>
  unitPriceInCents.value * quantity.value,
)

async function submitOrder() {
  submitting.value = true
  errorMessage.value = ''

  try {
    const response = await createOrder({
      items: [{ productId: 'p-100', quantity: quantity.value }],
      paymentMethod: paymentMethod.value,
    })
    window.location.href = response.data.paymentUrl
  } catch {
    errorMessage.value = '下单失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitOrder">
    <label>
      数量
      <input v-model.number="quantity" type="number" min="1" />
    </label>

    <p>应付：{{ (totalInCents / 100).toFixed(2) }} 元</p>

    <select v-model="paymentMethod">
      <option value="ALIPAY">支付宝</option>
      <option value="WECHAT">微信支付</option>
    </select>

    <button :disabled="submitting" type="submit">
      {{ submitting ? '提交中…' : '提交订单' }}
    </button>

    <p v-if="errorMessage">{{ errorMessage }}</p>
  </form>
</template>
~~~

这个页面同时体现响应式、声明式、FP 和副作用隔离。

### 6.11 REST API

#### 创建订单

~~~http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [{ "productId": "p-100", "quantity": 2 }],
  "paymentMethod": "ALIPAY"
}
~~~

响应：

~~~json
{
  "data": {
    "order": {
      "id": "o-001",
      "status": "CREATED",
      "totalInCents": 3998
    },
    "paymentUrl": "https://pay.example.com/o-001"
  },
  "requestId": "req-001"
}
~~~

#### 查询订单

~~~http
GET /api/orders/o-001
Authorization: Bearer <token>
~~~

#### 发起支付

~~~http
POST /api/orders/o-001/pay
Authorization: Bearer <token>
Content-Type: application/json

{ "paymentMethod": "WECHAT" }
~~~

### 6.12 简化数据表

~~~sql
CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  subtotal_in_cents INT NOT NULL,
  discount_in_cents INT NOT NULL,
  total_in_cents INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  unit_price_in_cents INT NOT NULL,
  quantity INT NOT NULL
);
~~~

订单项保存下单时的商品名称和价格快照，避免商品后续改价影响历史订单。

---

## 7. 设计原则

### 7.1 SOLID

| 原则 | 本案例中的体现 |
| --- | --- |
| 单一职责（SRP） | Controller 处理 HTTP，Service 编排用例，Repository 处理持久化 |
| 开闭原则（OCP） | 新增支付网关时新增实现，不修改订单核心逻辑 |
| 里氏替换（LSP） | 所有 PaymentGateway 实现都能被 Service 使用 |
| 接口隔离（ISP） | 按能力拆分商品、订单和支付接口 |
| 依赖倒置（DIP） | Service 依赖抽象，而不是具体数据库或 SDK |

### 7.2 KISS、DRY、YAGNI

- **KISS**：优先选择容易读懂的实现。
- **DRY**：抽取真正稳定且重复的知识，不为消除两行相似代码而过度抽象。
- **YAGNI**：没有明确需求时，不提前实现复杂规则引擎或插件系统。

### 7.3 设计判断表

| 问题 | 优先考虑 | 原因 |
| --- | --- | --- |
| 计算订单金额、校验优惠券 | FP | 输入输出明确，易测试 |
| 订单状态、库存规则 | OOP/领域模型 | 需要保护状态和不变量 |
| 日志、鉴权、异常转换 | AOP 风格拦截器/Guard | 横跨多个接口，避免重复 |
| 页面状态和组件通信 | 响应式/组件化 | 数据变化驱动界面 |
| 支付成功后的库存和通知 | 事件驱动 | 降低模块直接依赖 |

---

## 8. 常见误区

### 8.1 把 OOP 等同于大量 class

class 只是语法工具。真正重要的是职责、封装和依赖边界，简单数据转换不必强行包装成类。

### 8.2 为了纯函数而回避所有副作用

网络、数据库、文件和时间是系统必需的副作用。应把它们放在边界，让核心规则尽量纯。

### 8.3 过度使用继承

继承会建立强耦合。优先考虑接口、组合和策略函数。

### 8.4 用 AOP 隐藏核心业务逻辑

日志和鉴权适合拦截器；退款规则、优惠计算和状态迁移应在业务代码中显式表达。

### 8.5 过早引入复杂设计模式

设计模式是解决重复问题的经验，不是项目必备清单。先让流程清晰，再根据稳定变化点引入策略、工厂或适配器。

### 8.6 直接把数据库模型当 API 模型

数据库、领域对象和前端响应变化节奏不同，应通过 DTO 和映射层隔离。

---

## 9. 测试思路

### 9.1 单元测试

优先测试纯函数和领域规则：

~~~ts
describe('calculateOrderAmount', () => {
  it('满 100 元减 10 元', () => {
    const result = calculateOrderAmount([
      {
        productId: 'p1',
        title: '商品',
        unitPriceInCents: 5000,
        quantity: 2,
      },
    ])

    expect(result).toEqual({
      subtotalInCents: 10000,
      discountInCents: 1000,
      totalInCents: 9000,
    })
  })
})
~~~

### 9.2 集成测试

- 商品不存在时创建订单失败。
- 库存不足时不能创建订单。
- 订单保存了正确的价格快照。
- 支付网关失败时订单不会错误标记为已支付。

### 9.3 API/E2E 测试

- 未登录返回 401。
- 用户不能查询其他用户的订单。
- 创建订单返回订单 ID 和支付地址。
- 重复支付回调不会重复扣库存或发放积分。
- 无效数量、无效支付方式返回 400。

### 9.4 前端测试

- 数量变化后金额正确更新。
- 提交期间按钮禁用，避免重复提交。
- API 失败时显示错误并恢复按钮状态。
- 创建成功后跳转到支付地址。

---

## 10. 学习路线

1. 基础表达：变量、条件、循环、函数、异常和模块。
2. 数据与算法：数组、对象、Map、树、复杂度和常用算法。
3. TypeScript：类型、泛型、接口、联合类型和类型收窄。
4. 前端工程：Vue 组件、响应式、路由、状态管理和请求封装。
5. 后端工程：HTTP、Controller、Service、数据库、鉴权和错误处理。
6. OOP：封装、组合、多态、依赖注入和领域模型。
7. FP：纯函数、不可变数据、函数组合和副作用边界。
8. AOP 与中间件：Guard、Interceptor、日志、权限、事务和监控。
9. 架构设计：分层架构、事件驱动、缓存、消息队列和一致性。
10. 工程质量：单元测试、集成测试、E2E、性能、安全和可观测性。

---

## 11. 项目复盘检查清单

### 业务和边界

- [ ] 每个模块是否只有一个主要职责？
- [ ] 核心业务规则是否显式可见？
- [ ] 数据库、支付 SDK 和 HTTP 是否隔离在边界？
- [ ] 订单状态是否有明确且受保护的迁移规则？

### FP 视角

- [ ] 金额、校验和映射逻辑是否可以写成纯函数？
- [ ] 是否有不必要的共享可变状态？
- [ ] 副作用是否集中在 Controller、Service 或基础设施边界？

### OOP 视角

- [ ] 对象是否拥有与自身相关的行为？
- [ ] 是否依赖抽象接口而不是具体实现？
- [ ] 是否可以用组合替代复杂继承？

### AOP 视角

- [ ] 日志、鉴权、异常和监控是否避免重复？
- [ ] 拦截器是否只处理横切关注点？
- [ ] 业务规则是否被隐藏在不明显的切面中？

### 工程质量

- [ ] 是否覆盖正常、异常、边界和重复请求场景？
- [ ] API 错误结构是否统一？
- [ ] 是否记录 requestId，方便排查全链路问题？
- [ ] 是否有超时、重试、幂等和事务策略？

---

## 12. 总结

可以用三句话记住三种思想：

- **OOP**：系统中有哪些对象，它们分别负责什么？
- **FP**：数据经过哪些纯函数和变换得到结果？
- **AOP**：哪些公共行为横跨多个模块，应该统一拦截？

在全栈项目中，常见的组合方式是：

~~~text
Vue 响应式 + 组件化
        ↓
Controller / API 适配
        ↓
OOP Service / Entity 组织职责和状态
        ↓
FP 函数处理计算、校验和映射
        ↓
AOP 风格 Guard / Interceptor 处理鉴权、日志和监控
        ↓
Repository / Gateway 隔离数据库和第三方服务
~~~

设计的最终目的不是展示用了多少范式，而是让系统的变化有边界、规则可验证、依赖可替换、代码能被下一位开发者读懂。

