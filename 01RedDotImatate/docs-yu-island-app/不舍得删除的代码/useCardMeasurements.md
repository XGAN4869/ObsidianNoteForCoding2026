```ts
import { nextTick, shallowRef } from 'vue'

/** 输出：由前端测量得到的卡片真实 px 尺寸，保留输入顺序。👇 */
export interface MeasuredCard<T> {
  item: T
  width: number
  height: number
}
// 前端测量结果：本批卡片及其测量尺寸+ 间距
export interface CardMeasurement<T> {
  cards: MeasuredCard<T>[]
  gap: number
}

// hooks 配置项：模板负责绘制卡片，composable 只通过选择器读取尺寸。
export interface UseCardMeasurementOptions {
  cardSelector: string
  gapSelector: string
}

//!! 重点: 测量节点放在页面模板中，直接使用当前页面的节点查询
export function useCardMeasurement<T>(options: UseCardMeasurementOptions) {
  //被测量 raw 数据
  const measuringItems = shallowRef<T[]>([])
  //! 真正被应用的 card 数据
  const lastMeasurement = shallowRef<CardMeasurement<T> | null>(null)

  //! 暴露1：异步，渲染本批卡片后，一次查询获取卡片高度和间距。
  async function measure(items: T[]): Promise<CardMeasurement<T>> {
    //1. 空批次无需渲染。
    if (items.length === 0) {
      const emptyMeasurement = { cards: [], gap: 0 }
      lastMeasurement.value = emptyMeasurement
      return emptyMeasurement
    }
    lastMeasurement.value = null

    //2. measuringItems 拿到的还是原始数据，为了渲染隐藏测量区
    measuringItems.value = items
    //! ✅ nextTick 结束：节点存在，可以执行 uni.createSelectorQuery() 去查
    await nextTick()

    try {
      const measurement = await new Promise<CardMeasurement<T>>((resolve, reject) => {
        //! 3. 批量读取卡片尺寸
        const query = uni.createSelectorQuery()
        let cardRects: UniApp.NodeInfo[] = []
        let gap = 0

        // All所有卡片的 width height节点 --> 给 cardRects 赋值
        query.selectAll(options.cardSelector).boundingClientRect(result => {
          cardRects = Array.isArray(result) ? result : []
        })
        // 一个 gap --> 给 gap 赋值
        query.select(options.gapSelector).boundingClientRect(result => {
          if (result && !Array.isArray(result)) gap = result.width ?? 0
        })
        // 执行所有的请求。请求结果按请求次序构成数组，在 callback 的第一个参数中返回
        query.exec(() => {
          //4. 测量不完整时停止提交，避免错误高度污染后续列状态。
          if (cardRects.length !== items.length || gap <= 0) {
            reject(new Error('卡片测量节点尚未就绪，请重试'))
            return
          }

          const cards: MeasuredCard<T>[] = []
          for (let index = 0; index < items.length; index += 1) {
            const { width = 0, height = 0 } = cardRects[index]
            if (width <= 0 || height <= 0) {
              reject(new Error('卡片测量尺寸无效，请重试'))
              return
            }
            //! 4. 组装 cards
            cards.push({ item: items[index], width, height })
          }
          //! 5. return  measurement👇 = cards + gap
          resolve({ cards, gap })
        })
      })
      lastMeasurement.value = measurement
      return measurement
    } finally {
      //5. 成功或失败都释放测量区，正式列表继续由瀑布流管理。
      measuringItems.value = []
    }
  }

  return { measuringItems, lastMeasurement, measure }
}

```