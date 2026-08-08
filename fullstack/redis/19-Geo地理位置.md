# 第19章：Geo —— 地理位置

## 本章目标
掌握 Geo 实现"附近的人"、"附近的商家"

---

## 19.1 Geo 是什么

Geo 基于 ZSet，存储经纬度坐标，支持距离计算和半径查询。

```bash
# GEOADD：添加位置
GEOADD cities 116.397 39.908 "北京"
GEOADD cities 121.473 31.230 "上海"
GEOADD cities 113.264 23.129 "广州"
GEOADD cities 114.057 22.543 "深圳"

# GEOPOS：获取坐标
GEOPOS cities "北京"    # 116.397... 39.908...

# GEODIST：两点距离
GEODIST cities "北京" "上海" km   # ~1067km

# GEORADIUS：半径查询（附近有什么）
GEORADIUS cities 116.4 39.9 2000 km   # 北京2000km内的城市

# GEORADIUSBYMEMBER：按已有成员查附近
GEORADIUSBYMEMBER cities "深圳" 200 km  # 深圳200km内

# GEOHASH：坐标的 Geohash 编码
GEOHASH cities "北京"   # "wx4fb..."
```

---

## 19.2 实战：附近的人

```bash
# 用户位置
GEOADD users:location 116.397 39.908 "user:1"
GEOADD users:location 116.410 39.920 "user:2"
GEOADD users:location 121.473 31.230 "user:3"

# user:1 附近 5km 的人
GEORADIUSBYMEMBER users:location "user:1" 5 km

# 带距离和坐标
GEORADIUSBYMEMBER users:location "user:1" 5 km WITHDIST WITHCOORD
```

---

## 19.3 Geo 底层原理

Geo 本质上是个 **ZSet**：Geohash 编码后的值作 score，成员名作 member。

```bash
# 验证：Geo Key 可以用 ZSet 命令
ZRANGE cities 0 -1       # 能看到所有城市
ZCARD cities             # 城市数量
ZREM cities "北京"       # 删除
```

---

## 常见错误

### 错误1：Geo 数据量大时 GEORADIUS 慢

```bash
# 百万级位置数据，大范围半径查询可能慢
# 解决：限制返回数量
GEORADIUS locations 116.4 39.9 100 km COUNT 50
```

---

## 本章小结
- `GEOADD` 添加经纬度
- `GEODIST` 计算两点距离
- `GEORADIUS/GEORADIUSBYMEMBER` 半径查询
- 底层是 ZSet，占用内存很小

## 练习题
1. 添加 5 个城市坐标，查询北京 500km 范围内的城市。
2. 实现"附近的人"：添加用户位置，查询附近 5km 的人。
3. 验证 Geo 本质是 ZSet：用 ZRANGE 查看 Geo 的 Key。
