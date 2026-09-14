# 数组、切片、Map 与字符串

## 1. 学习目标

理解四类常用数据结构的存储特点，能够安全地增删改查，并避免共享底层数组、nil Map 和中文字符串处理等常见问题。

## 2. 数组

数组长度是类型的一部分，[3]int 和 [4]int 是不同类型。数组赋值会复制全部元素。

~~~go
a := [3]int{10, 20, 30}
b := a
b[0] = 99
fmt.Println(a) // [10 20 30]
~~~

数组适合长度固定的数据；业务集合一般使用切片。

## 3. 切片的结构

切片可以理解为“底层数组的一段视图”，包含指针、长度和容量。

~~~go
numbers := []int{10, 20, 30}
fmt.Println(len(numbers), cap(numbers))
part := numbers[1:3]
~~~

切片区间是左闭右开。numbers[a:b] 包含 a，不包含 b。

### append 与容量

~~~go
items := make([]string, 0, 2)
items = append(items, "Go")
items = append(items, "SQL")
items = append(items, "Redis")
~~~

容量不足时，append 会申请新底层数组。必须接收 append 的返回值。

### 共享底层数组

~~~go
source := []int{1, 2, 3}
view := source[:2]
view[0] = 100
fmt.Println(source) // [100 2 3]
~~~

需要独立副本时：

~~~go
copied := append([]int(nil), source...)
~~~

Go 1.21+ 也可使用 slices.Clone。

### 删除元素

不要求保持顺序：

~~~go
items[i] = items[len(items)-1]
items = items[:len(items)-1]
~~~

要求保持顺序：

~~~go
items = append(items[:i], items[i+1:]...)
~~~

保存指针或大对象时，删除后可清空末尾位置，帮助垃圾回收。

## 4. Map

~~~go
views := make(map[int64]int64)
views[1001] = 1
views[1001]++
count, exists := views[1001]
delete(views, 1001)
~~~

读取不存在的键会得到值类型的零值。需要区分“不存在”和“值为零”时必须使用逗号 ok。

nil Map 可以读取但不能写入：

~~~go
var m map[string]int
fmt.Println(m["x"]) // 0
// m["x"] = 1 会 panic
~~~

Map 不是并发安全的。多个 Goroutine 同时读写应使用锁、sync.Map，或由单个 Goroutine 管理。

## 5. 字符串

字符串不可变，频繁拼接时使用 strings.Builder：

~~~go
var builder strings.Builder
builder.WriteString("Go")
builder.WriteString(" Blog")
result := builder.String()
~~~

常用操作：

~~~go
title := strings.TrimSpace(input)
parts := strings.Split("go,sql,redis", ",")
slug := strings.ToLower(strings.ReplaceAll(title, " ", "-"))
contains := strings.Contains(title, "Go")
~~~

按字符截取中文字符串时先转为 []rune，按字节切片可能破坏 UTF-8。

## 6. 博客实战：标签去重

~~~go
func uniqueTags(tags []string) []string {
	seen := make(map[string]struct{}, len(tags))
	result := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		key := strings.ToLower(tag)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, tag)
	}
	return result
}
~~~

## 7. 常见错误

- 忘记接收 append 返回值。
- 在遍历 Map 时依赖固定顺序。
- 向 nil Map 写入数据。
- 把切片当作完全独立的数据副本。
- 直接按字节截取中文字符串。
- 在多个 Goroutine 中无保护地读写 Map。

## 8. 练习

1. 写一个分页函数，对文章切片按 page 和 pageSize 截取。
2. 实现标签去重并保留第一次出现的大小写。
3. 复制切片后修改副本，验证原切片不变。
4. 统计文章列表中每个分类的文章数。

## 9. 小结与下一章

数组固定长度；切片是视图；Map 用于键值查找；字符串是不可变字节序列。

- 上一篇：[03-流程控制与程序结构](./03-流程控制与程序结构.md)
- 下一篇：[05-函数与参数设计](./05-函数与参数设计.md)

