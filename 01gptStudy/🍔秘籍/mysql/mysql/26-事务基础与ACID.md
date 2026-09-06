# 第二十六章 事务基础与 ACID

## 本章目标

通过本章学习，你将能够：
1. 理解事务的核心理念：原子工作单元，要么全部成功，要么全部失败
2. 掌握 MySQL 事务的基本命令：START TRANSACTION、COMMIT、ROLLBACK、SAVEPOINT
3. 理解 autocommit 模式的含义和作用
4. 深入理解 ACID 四个特性的含义、重要性和实现原理
5. 理解 Undo Log 和 Redo Log 在事务实现中的作用
6. 区分可回滚的 DML 和（通常）不可回滚的 DDL
7. 在应用代码中正确使用事务

## 前置知识

在学习本章之前，你需要：
- 理解基本的 SQL DML 操作（INSERT、UPDATE、DELETE）
- 了解 InnoDB 是 MySQL 的事务性存储引擎（MyISAM 不支持事务）
- 了解基本的数据库连接概念
- 理解原子操作（不可分割的操作单元）的基本概念

---

## 26.1 事务的现实类比

### 26.1.1 银行转账 —— 经典例子

想象一下银行转账的场景：从账户 A 转 1000 元到账户 B。

```
操作步骤：
1. 检查账户 A 余额是否 >= 1000
2. 从账户 A 扣除 1000 元
3. 向账户 B 增加 1000 元

如果执行到第 2 步后系统崩溃：
- 账户 A 少了 1000 元  ✓（已扣除）
- 账户 B 没有收到 1000 元 ✗（未增加）
→ 1000 元凭空消失了！

如果执行到第 3 步时失败（如违反约束）：
- 账户 A 少了 1000 元 ✗（已扣除但无法回退）
→ 1000 元丢失了！
```

**事务就是解决这个问题的**：把"扣款"和"存款"打包成一个不可分割的原子操作。要么全部执行成功（COMMIT），要么全部撤销（ROLLBACK）。

### 26.1.2 事务的定义

事务（Transaction）是数据库管理系统执行过程中的一个逻辑单位，由一个有限的数据库操作序列构成。事务具有以下特点：

- **原子性**：事务中的所有操作是一个不可分割的整体
- **一致性**：事务使数据库从一个一致状态转变到另一个一致状态
- **隔离性**：并发事务之间互不干扰
- **持久性**：一旦提交，数据永久保存

---

## 26.2 MySQL 事务命令

### 26.2.1 开启和提交事务

```sql
-- 方式一：START TRANSACTION（推荐，标准 SQL）
START TRANSACTION;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;

-- 方式二：BEGIN / BEGIN WORK（MySQL 简写）
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;

-- START TRANSACTION 可以附带修饰符
START TRANSACTION READ ONLY;       -- 只读事务（优化性能）
START TRANSACTION READ WRITE;      -- 读写事务（默认）
START TRANSACTION WITH CONSISTENT SNAPSHOT;  -- 开启事务同时建立一致性快照
```

### 26.2.2 ROLLBACK —— 撤销事务

```sql
-- 基本回滚
START TRANSACTION;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
-- 此时，在另一个会话中看不到这个修改（隔离性）
SELECT * FROM accounts WHERE id = 1;  -- 显示扣减后的值（本会话内可见）
ROLLBACK;
-- 所有修改被撤销，账户余额恢复

-- 实际场景：审核不通过则撤销
START TRANSACTION;
INSERT INTO orders (user_id, amount, status) VALUES (1, 500, 'pending');
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 100;

-- 检查库存是否充足
SELECT quantity FROM inventory WHERE product_id = 100;
-- 如果库存 < 0，说明超卖，回滚
-- ROLLBACK;
-- 否则
COMMIT;
```

### 26.2.3 SAVEPOINT —— 部分回滚

SAVEPOINT 允许在事务中设置回滚点，可以回滚到指定的保存点而不撤销整个事务。

```sql
START TRANSACTION;

INSERT INTO orders (user_id, amount) VALUES (1, 1000);  -- 步骤 1
SAVEPOINT order_created;

UPDATE accounts SET balance = balance - 1000 WHERE id = 1;  -- 步骤 2
SAVEPOINT balance_debited;

-- 假设这里发生错误（如向 B 账户充值失败）
-- 可以选择回滚到 balance_debited，保留步骤 1 的订单记录
ROLLBACK TO SAVEPOINT balance_debited;
-- 步骤 2 的扣款被撤销，步骤 1 的订单记录保留

-- 继续执行其他操作...

COMMIT;  -- 提交当前事务中所有保留的修改

-- 释放保存点
RELEASE SAVEPOINT order_created;  -- 删除保存点，不能再 ROLLBACK TO 它

-- 注意：
-- ROLLBACK TO SAVEPOINT 之后，该保存点之后的保存点也会被删除
-- 但 ROLLBACK TO 不会结束事务，事务仍然是活跃的
-- COMMIT 或完整的 ROLLBACK 才会结束事务
```

### 26.2.4 SAVEPOINT 高级示例

```sql
-- 复杂业务：处理多步骤订单，每步可以独立回滚
DELIMITER $$

CREATE PROCEDURE process_complex_order()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Transaction failed and rolled back completely.' AS result;
    END;

    START TRANSACTION;

    -- 步骤 1：创建订单
    INSERT INTO orders (user_id, amount, status) VALUES (1, 500, 'created');
    SET @order_id = LAST_INSERT_ID();
    SAVEPOINT order_created;

    -- 步骤 2：锁定库存
    UPDATE inventory SET locked_quantity = locked_quantity + 1
    WHERE product_id = 100 AND available_quantity >= locked_quantity + 1;

    IF ROW_COUNT() = 0 THEN
        -- 库存不足，回滚到订单创建之后
        ROLLBACK TO SAVEPOINT order_created;
        UPDATE orders SET status = 'failed_no_stock' WHERE id = @order_id;
        COMMIT;
        SELECT 'Order created but failed due to insufficient stock.' AS result;
        LEAVE proc_end;
    END IF;

    SAVEPOINT inventory_locked;

    -- 步骤 3：扣款
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;

    IF ROW_COUNT() = 0 THEN
        ROLLBACK TO SAVEPOINT inventory_locked;
        ROLLBACK TO SAVEPOINT order_created;
        UPDATE orders SET status = 'failed_payment' WHERE id = @order_id;
        COMMIT;
        SELECT 'Payment failed.' AS result;
        LEAVE proc_end;
    END IF;

    -- 所有步骤完成
    UPDATE orders SET status = 'confirmed' WHERE id = @order_id;
    COMMIT;
    SELECT 'Order processed successfully.' AS result;

    proc_end: BEGIN END;
END$$

DELIMITER ;
```

---

## 26.3 Autocommit 模式

### 26.3.1 理解 autocommit

```sql
-- 查看当前 autocommit 设置
SHOW VARIABLES LIKE 'autocommit';
-- 默认值：ON（每个语句自动作为一个事务提交）

-- autocommit = ON 时的行为
-- 每条 INSERT/UPDATE/DELETE 语句自动被包装在事务中并立即提交
INSERT INTO users (name) VALUES ('Alice');
-- 等价于：
-- START TRANSACTION;
-- INSERT INTO users (name) VALUES ('Alice');
-- COMMIT;

-- autocommit = OFF 时的行为
-- 必须显式 COMMIT 或 ROLLBACK
SET autocommit = 0;

INSERT INTO users (name) VALUES ('Bob');   -- 未提交
INSERT INTO users (name) VALUES ('Charlie'); -- 未提交
-- 此时如果关闭连接，这些修改会丢失！
COMMIT;  -- 现在两个 INSERT 才真正生效

-- 恢复默认
SET autocommit = 1;

-- 注意：START TRANSACTION 会临时禁用 autocommit
-- 直到 COMMIT 或 ROLLBACK 后恢复
```

### 26.3.2 autocommit 的最佳实践

```sql
-- 生产环境建议：
-- 1. 保持 autocommit = ON（默认）
-- 2. 需要事务时显式使用 START TRANSACTION
-- 3. 不要在会话级别修改 autocommit（容易忘记恢复）

-- 错误做法：
SET autocommit = 0;
-- ... 执行了一些操作 ...
-- 忘记 COMMIT 或 ROLLBACK，关闭连接
-- 结果是：修改可能被提交（取决于驱动），也可能被回滚
-- 行为不可预测！
```

---

## 26.4 可回滚和不可回滚的操作

### 26.4.1 DML 操作（可回滚）

```sql
-- INSERT、UPDATE、DELETE 是 DML（数据操作语言）
-- 在 InnoDB 中，这些操作可以完全回滚

START TRANSACTION;
INSERT INTO users (name) VALUES ('Test');
UPDATE users SET name = 'Updated' WHERE id = 1;
DELETE FROM users WHERE id = 2;
ROLLBACK;  -- 所有操作全部撤销
```

### 26.4.2 DDL 操作（通常不可回滚，但有例外）

```sql
-- 传统上，DDL 操作在 MySQL 中是隐式提交的
-- 这意味着 DDL 会自动提交当前未提交的事务

START TRANSACTION;
INSERT INTO users (name) VALUES ('Test');
CREATE TABLE temp_table (id INT);  -- 隐式提交前面的 INSERT！
ROLLBACK;  -- 无法回滚 INSERT（已被隐式提交）和 CREATE TABLE

-- MySQL 8.0 的原子 DDL：
-- InnoDB 存储引擎支持原子 DDL
-- CREATE TABLE、ALTER TABLE、DROP TABLE 等在某些情况下可以原子执行

-- 但 DDL 仍然不参与用户显式的事务！DDL 语句总是自动提交的
START TRANSACTION;
INSERT INTO users (name) VALUES ('User1');  -- 在事务中
CREATE TABLE test_atomic (id INT);           -- 自动提交前面的 INSERT，并立即创建表
INSERT INTO users (name) VALUES ('User2');  -- 新的事务（因为上面的 DDL 已经提交了）
ROLLBACK;  -- 只回滚 User2 的插入，User1 和 CREATE TABLE 不受影响
```

---

## 26.5 ACID 详解

### 26.5.1 A - Atomicity（原子性）

**定义**：事务中的所有操作要么全部成功（COMMIT），要么全部失败（ROLLBACK）。不存在部分成功的情况。

```sql
-- 原子性的体现
START TRANSACTION;
-- 操作 A：扣款
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
-- 操作 B：存款
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
-- 操作 C：记录日志
INSERT INTO transfer_logs (from_id, to_id, amount) VALUES (1, 2, 1000);
COMMIT;
-- 三个操作要么全部生效，要么全部不生效

-- 如果操作 B 失败（如违反约束），整个事务回滚：
-- 操作 A 的扣款被撤销
-- 操作 C 的日志不会被写入
```

**Undo Log 实现原子性**：

```
Undo Log（回滚日志）记录了数据修改前的"旧值"。

当执行 UPDATE accounts SET balance = balance - 1000 WHERE id = 1 时：
1. 从数据页读取该行数据（或从 buffer pool）
2. 将旧值（修改前的 balance）写入 Undo Log
3. 修改 buffer pool 中的数据
4. 修改后的数据写入 Redo Log

回滚时：
1. 从 Undo Log 中读取旧值
2. 将旧值应用回数据页
3. 撤销所有修改
```

### 26.5.2 C - Consistency（一致性）

**定义**：事务将数据库从一个一致状态转变到另一个一致状态。事务执行前后，所有完整性约束都必须满足。

```sql
-- 一致性的体现

-- 约束一：余额不能为负
ALTER TABLE accounts ADD CONSTRAINT chk_balance CHECK (balance >= 0);

START TRANSACTION;
UPDATE accounts SET balance = balance - 2000 WHERE id = 1 AND balance >= 2000;
-- 如果 id=1 的余额只有 1500，此行更新不影响任何行（ROW_COUNT()=0）
-- 如果应用层不检查就继续，后续操作可能破坏一致性
COMMIT;

-- 约束二：转账总额守恒
-- 转账前：A (5000) + B (3000) = 8000
-- 转账后：A (4000) + B (4000) = 8000
-- 事务确保了不会凭空增加或减少资金

-- 一致性的保障机制：
-- 1. 数据类型约束：不能插入字符串到 INT 列
-- 2. NOT NULL 约束
-- 3. UNIQUE 约束：不允许重复
-- 4. PRIMARY KEY 约束：唯一标识每一行
-- 5. FOREIGN KEY 约束：引用完整性
-- 6. CHECK 约束：自定义条件
-- 7. 触发器：自定义逻辑校验
```

### 26.5.3 I - Isolation（隔离性）

**定义**：多个并发事务之间互相隔离，一个事务的中间状态对其他事务不可见。

```sql
-- 隔离性的直观理解
-- 两个窗口（两个并发事务）的操作：

-- 窗口 A（事务 1）：
START TRANSACTION;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
-- 此时账户 A 的余额在事务 1 中已经减少
-- 但在 REPEATABLE READ 隔离级别下，窗口 B 看不到这个减少

-- 窗口 B（事务 2）：
START TRANSACTION;
SELECT balance FROM accounts WHERE id = 1;
-- 仍然看到的是事务 1 开始之前的旧值！
-- 这就是 MVCC（多版本并发控制）在发挥作用

-- 窗口 A：
COMMIT;  -- 提交后，其他事务才能看到修改

-- 窗口 B：
SELECT balance FROM accounts WHERE id = 1;
-- 此时看到的是新值（依赖于隔离级别）
```

**MVCC 实现隔离性**：

```
InnoDB 通过以下机制实现事务隔离：
1. MVCC（Multi-Version Concurrency Control）：
   - 每行数据保留多个版本
   - 每个事务看到的是数据的特定快照（取决于事务开始时间）
   - 读不阻塞写，写不阻塞读

2. 锁（Locks）：
   - 记录锁（Record Lock）：锁定索引记录
   - 间隙锁（Gap Lock）：锁定索引间隙（防止幻读）
   - Next-Key Lock：记录锁 + 间隙锁

隔离级别的详细讨论见第二十七章。
```

### 26.5.4 D - Durability（持久性）

**定义**：一旦事务提交，其修改就是永久性的，即使系统崩溃也不会丢失。

```sql
-- 持久性的体现

START TRANSACTION;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;
-- 此时即使服务器断电，id=2 的账户余额也不会丢失增加的 1000 元

-- 持久性的保障机制：
```

**Redo Log 实现持久性**：

```
Write-Ahead Logging（WAL，预写日志）机制：

1. 当修改数据时，InnoDB 先将修改记录写入 Redo Log Buffer（内存）
2. 提交事务时（COMMIT），将 Redo Log Buffer 刷写到 Redo Log 文件（磁盘）
3. 之后在空闲时（或 Checkpoint），将 buffer pool 中的脏页刷写到数据文件

事务提交流程（简化）：
┌──────────────────────────────────────────────┐
│ 1. 修改 buffer pool 中的数据页（内存）        │
│ 2. 记录修改到 Redo Log Buffer（内存）         │
│ 3. COMMIT                                     │
│ 4. 将 Redo Log Buffer 刷盘（关键步骤！）       │
│ 5. 返回客户端"提交成功"                       │
│ 6. 后台：将脏页刷入数据文件（不阻塞提交）      │
└──────────────────────────────────────────────┘

崩溃恢复（Crash Recovery）：
1. 系统重启后，InnoDB 检查数据文件和 Redo Log
2. 重放（Replay）Redo Log 中已提交但未写入数据文件的操作
3. 撤销（Undo）未提交的事务的修改
4. 恢复完成后，数据库处于一致状态

Redo Log 配置：
- innodb_log_file_size：每个 Redo Log 文件的大小（默认 48MB）
- innodb_log_files_in_group：Redo Log 文件的数量（默认 2）
- innodb_flush_log_at_trx_commit：
  - 0：每秒刷一次（可能丢失 1 秒数据）
  - 1：每次提交都刷（最安全，默认，也是推荐设置）
  - 2：每次提交写 OS 缓存，每秒刷盘（折中）

Double Write Buffer（双写缓冲）：
- 防止"部分写"问题（一个数据页写了一半断电）
- 先将脏页写入 doublewrite buffer（磁盘上连续区域）
- 再写入实际数据文件
- 恢复时：如果数据文件中的页不完整，从 doublewrite buffer 恢复
```

---

## 26.6 事务中的隐式提交

某些语句在执行前会隐式提交当前事务（等同于在执行前自动执行了一次 COMMIT）。

```sql
-- 会导致隐式提交的语句：

-- 1. DDL 语句（CREATE、ALTER、DROP、TRUNCATE、RENAME）
START TRANSACTION;
INSERT INTO users VALUES (1, 'test');
CREATE TABLE new_table (id INT);  -- 隐式提交了上面的 INSERT！

-- 2. 权限管理语句（GRANT、REVOKE、SET PASSWORD）

-- 3. 管理语句（ANALYZE TABLE、CACHE INDEX、CHECK TABLE、
--    FLUSH、LOAD INDEX INTO CACHE、OPTIMIZE TABLE、REPAIR TABLE、RESET）

-- 4. 开始事务的语句（START TRANSACTION、BEGIN）
-- 如果当前有未提交的事务，START TRANSACTION 会隐式提交它

-- 5. 锁相关语句（LOCK TABLES、UNLOCK TABLES）

-- 6. 复制控制语句

-- 最佳实践：
-- 1. 在事务中不要混入 DDL 操作
-- 2. DDL 操作单独执行，确认已提交的事务不受影响
-- 3. 如果不确定某语句是否会隐式提交，在它前后都加上 COMMIT
```

---

## 26.7 应用代码中的事务

### 26.7.1 Python 示例

```python
# Python 中使用事务（伪代码，使用 mysql-connector-python 或 PyMySQL）
import mysql.connector

def transfer_money(from_id, to_id, amount):
    conn = mysql.connector.connect(
        host='localhost', user='root',
        password='password', database='bank'
    )
    conn.autocommit = False  # 关闭自动提交

    try:
        cursor = conn.cursor()

        # 检查余额
        cursor.execute(
            "SELECT balance FROM accounts WHERE id = %s FOR UPDATE",
            (from_id,)
        )
        balance = cursor.fetchone()[0]

        if balance < amount:
            raise Exception("Insufficient balance")

        # 扣款
        cursor.execute(
            "UPDATE accounts SET balance = balance - %s WHERE id = %s",
            (amount, from_id)
        )

        # 存款
        cursor.execute(
            "UPDATE accounts SET balance = balance + %s WHERE id = %s",
            (amount, to_id)
        )

        # 记录日志
        cursor.execute(
            "INSERT INTO transfer_logs (from_id, to_id, amount) VALUES (%s, %s, %s)",
            (from_id, to_id, amount)
        )

        conn.commit()  # 提交事务
        print("Transfer successful")

    except Exception as e:
        conn.rollback()  # 回滚事务
        print(f"Transfer failed: {e}")

    finally:
        cursor.close()
        conn.close()
```

### 26.7.2 Java 示例

```java
// Java 中使用事务（伪代码，使用 JDBC）
public void transferMoney(int fromId, int toId, double amount) {
    Connection conn = null;
    try {
        conn = dataSource.getConnection();
        conn.setAutoCommit(false);  // 关闭自动提交

        PreparedStatement checkStmt = conn.prepareStatement(
            "SELECT balance FROM accounts WHERE id = ? FOR UPDATE"
        );
        checkStmt.setInt(1, fromId);
        ResultSet rs = checkStmt.executeQuery();

        if (rs.next() && rs.getDouble("balance") < amount) {
            throw new InsufficientBalanceException("Insufficient balance");
        }

        PreparedStatement debitStmt = conn.prepareStatement(
            "UPDATE accounts SET balance = balance - ? WHERE id = ?"
        );
        debitStmt.setDouble(1, amount);
        debitStmt.setInt(2, fromId);
        debitStmt.executeUpdate();

        PreparedStatement creditStmt = conn.prepareStatement(
            "UPDATE accounts SET balance = balance + ? WHERE id = ?"
        );
        creditStmt.setDouble(1, amount);
        creditStmt.setInt(2, toId);
        creditStmt.executeUpdate();

        conn.commit();

    } catch (Exception e) {
        if (conn != null) {
            try { conn.rollback(); } catch (SQLException ex) { /* log */ }
        }
        throw new TransferFailedException("Transfer failed", e);
    } finally {
        if (conn != null) {
            try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { /* log */ }
        }
    }
}
```

### 26.7.3 应用层事务最佳实践

1. **始终设置事务超时**：防止长时间锁等待
2. **事务尽可能短小**：减少锁持有时间，提高并发
3. **在事务中避免远程调用**：调外部 API 会延长事务时间
4. **正确处理回滚**：捕获异常时必须回滚
5. **使用适当的隔离级别**：根据业务需求选择，不要总是用 SERIALIZABLE
6. **连接池注意事项**：确保事务结束后连接状态被重置（autocommit 恢复、隔离级别恢复）

---

## 常见错误

1. **忘记 COMMIT 或 ROLLBACK**
   - 错误：在 autocommit=OFF 的情况下执行修改后直接关闭连接，没有显式 COMMIT。
   - 后果：修改可能被回滚（取决于关闭方式），造成数据丢失。
   - 解决：始终在事务结束时显式 COMMIT 或 ROLLBACK。使用 try-catch-finally 确保连接正确关闭。

2. **在 autocommit=ON 时误认为有事务保护**
   - 错误：执行了两条 UPDATE 希望它们要么同时成功要么同时失败，但没有使用 START TRANSACTION。
   - 后果：第一条 UPDATE 成功后可能已提交，第二条 UPDATE 失败时第一条无法回滚。
   - 解决：需要事务保护的多条语句必须放在显式事务中。

3. **将 DDL 混入事务**
   - 错误：在 START TRANSACTION 和 COMMIT 之间执行 ALTER TABLE。
   - 后果：ALTER TABLE 会隐式提交之前的所有修改，破坏了事务的原子性假设。
   - 解决：DDL 语句应该单独执行，明确知道它会隐式提交。

4. **事务中执行耗时操作**
   - 错误：在事务中调用外部 API、发送邮件、等待用户输入。
   - 后果：事务长时间持有锁，阻塞其他事务，导致连接超时或锁等待超时。
   - 解决：事务中只执行数据库操作，外部调用在事务外完成。

5. **不理解隐式提交导致事务断裂**
   - 错误：不知道某些语句（如 CREATE TABLE、ALTER TABLE、LOCK TABLES）会隐式提交。
   - 后果：预期的事务回滚范围不符合实际。
   - 解决：熟悉隐式提交的语句列表，设计事务时不混入这些语句。

---

## 本章练习

1. **银行转账模拟**：创建 accounts 表（id, name, balance, CHECK(balance >= 0)），编写一个完整的转账存储过程，包含：余额检查、扣款、存款、日志记录。使用事务确保原子性，测试各种异常场景（余额不足、目标账户不存在、转账金额为负等）。

2. **SAVEPOINT 练习**：在一个事务中模拟多步骤操作（创建订单 → 扣库存 → 扣款 → 确认），在每步之后设置 SAVEPOINT。模拟不同步骤失败时的回滚行为，验证 ROLLBACK TO SAVEPOINT 只撤销部分操作。

3. **autocommit 行为观察**：在两个 MySQL 会话中，分别测试 autocommit ON 和 OFF 时的行为差异，观察彼此能否看到未提交的修改。记录实验步骤和结果。

4. **Undo/Redo Log 理解练习**：阅读 InnoDB 架构图，描述一个 UPDATE 操作从发出到持久化的完整数据流路径，包括：buffer pool、Undo Log、Redo Log、Binlog、数据文件等组件的交互顺序。说明崩溃恢复时如何使用 Redo Log 和 Undo Log。

5. **应用层事务代码审查**：审查一段包含事务的 Python/Java 代码，找出其中的潜在问题（如：事务未正确关闭、autocommit 设置不当、异常处理不完善、在事务中做外部调用等），并给出修复后的代码。

6. **ACID 违反场景分析**：给出 4 个具体场景，分别违反了 ACID 中的 A、C、I、D 特性。分析原因、可能造成的后果以及 MySQL 提供了哪些机制来防范这些问题。
