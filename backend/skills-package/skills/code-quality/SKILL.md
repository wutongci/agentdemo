---
name: code-quality
description: 自动检查代码质量问题，提供改进建议
allowed-tools: ["fs_read", "bash_run"]
triggers:
  - type: keyword
    keywords: ["质量", "quality", "重构", "refactor", "优化", "optimize"]
  - type: context
    condition: "during /review"
  - type: context
    condition: "during /analyze"
---

# 代码质量检查知识库

本技能提供自动化的代码质量检查，识别常见问题并提供改进建议。

## 检查维度

### 1. 代码复杂度

#### 圈复杂度 (Cyclomatic Complexity)
衡量代码中独立路径的数量。

**阈值建议**:
- 1-10: 简单，容易理解和测试
- 11-20: 中等复杂，需要注意
- 21-50: 复杂，建议重构
- 50+: 非常复杂，必须重构

**降低复杂度的方法**:
```go
// ❌ 高复杂度
func ProcessOrder(order Order) error {
    if order.Status == "pending" {
        if order.Amount > 1000 {
            if order.User.IsVIP {
                // 复杂的逻辑
            } else {
                // 另一个复杂逻辑
            }
        } else {
            // 更多逻辑
        }
    } else if order.Status == "confirmed" {
        // 更多嵌套
    }
    return nil
}

// ✅ 降低复杂度：提取方法
func ProcessOrder(order Order) error {
    if order.Status == "pending" {
        return processPendingOrder(order)
    }
    if order.Status == "confirmed" {
        return processConfirmedOrder(order)
    }
    return nil
}

func processPendingOrder(order Order) error {
    if order.Amount > 1000 {
        return processLargeOrder(order)
    }
    return processSmallOrder(order)
}
```

#### 认知复杂度 (Cognitive Complexity)
衡量代码的理解难度。

**降低认知复杂度**:
- 减少嵌套层级（不超过 3 层）
- 使用早返回（early return）
- 提取复杂条件为命名函数
- 使用卫语句（guard clauses）

```go
// ❌ 高认知复杂度
func ValidateUser(user User) error {
    if user.Name != "" {
        if user.Email != "" {
            if user.Age >= 18 {
                return nil
            } else {
                return errors.New("age must be >= 18")
            }
        } else {
            return errors.New("email required")
        }
    } else {
        return errors.New("name required")
    }
}

// ✅ 低认知复杂度：使用卫语句
func ValidateUser(user User) error {
    if user.Name == "" {
        return errors.New("name required")
    }
    if user.Email == "" {
        return errors.New("email required")
    }
    if user.Age < 18 {
        return errors.New("age must be >= 18")
    }
    return nil
}
```

### 2. 代码重复 (Code Duplication)

#### 检测重复
- 完全重复的代码块
- 结构相似但细节不同的代码
- 复制粘贴的代码

#### 重复的危害
- 维护成本高（修改需要多处更改）
- 容易引入 bug
- 代码库膨胀

#### 消除重复
```go
// ❌ 重复代码
func CreateUserOrder(user User, items []Item) error {
    total := 0.0
    for _, item := range items {
        total += item.Price * float64(item.Quantity)
    }
    discount := total * 0.1
    final := total - discount
    return saveOrder(user.ID, final)
}

func CreateGuestOrder(email string, items []Item) error {
    total := 0.0
    for _, item := range items {
        total += item.Price * float64(item.Quantity)
    }
    discount := total * 0.1
    final := total - discount
    return saveGuestOrder(email, final)
}

// ✅ 提取公共逻辑
func calculateOrderTotal(items []Item) float64 {
    total := 0.0
    for _, item := range items {
        total += item.Price * float64(item.Quantity)
    }
    discount := total * 0.1
    return total - discount
}

func CreateUserOrder(user User, items []Item) error {
    total := calculateOrderTotal(items)
    return saveOrder(user.ID, total)
}

func CreateGuestOrder(email string, items []Item) error {
    total := calculateOrderTotal(items)
    return saveGuestOrder(email, total)
}
```

### 3. 函数和方法质量

#### 函数长度
- **建议**: 不超过 50 行
- **理想**: 20-30 行
- **过长**: 考虑职责是否过多

#### 参数数量
- **理想**: 0-2 个参数
- **可接受**: 3-4 个参数
- **需要重构**: 5+ 个参数

**改进方法**:
```go
// ❌ 参数过多
func CreateUser(name, email, phone, address, city, country, zipCode string, age int) error {
    // ...
}

// ✅ 使用对象封装
type UserInfo struct {
    Name    string
    Email   string
    Phone   string
    Address Address
    Age     int
}

type Address struct {
    Street  string
    City    string
    Country string
    ZipCode string
}

func CreateUser(info UserInfo) error {
    // ...
}
```

#### 返回值
- 明确的返回类型
- 错误处理清晰
- 避免返回 nil 导致 panic

### 4. 命名质量

#### 变量命名
```go
// ❌ 糟糕的命名
var d int // 什么的 d?
var data []byte // 太通用
var x User // 无意义

// ✅ 好的命名
var daysSinceLastLogin int
var requestBody []byte
var currentUser User
```

#### 函数命名
```go
// ❌ 不清晰
func proc() error { ... }
func handle(d Data) { ... }

// ✅ 清晰表意
func ProcessPayment() error { ... }
func HandleUserRegistration(data RegistrationData) { ... }
```

#### 常量和配置
```go
// ❌ 魔术数字
if user.LoginAttempts > 5 { ... }
time.Sleep(300 * time.Second)

// ✅ 命名常量
const MaxLoginAttempts = 5
const DefaultTimeout = 300 * time.Second

if user.LoginAttempts > MaxLoginAttempts { ... }
time.Sleep(DefaultTimeout)
```

### 5. 注释质量

#### 有价值的注释
```go
// ✅ 解释为什么
// 使用指数退避避免在服务重启时造成雷鸣般的请求
func retryWithBackoff() { ... }

// 解释业务规则
// 根据税法规定，超过 1000 元的订单需要额外审核
if order.Amount > 1000 { ... }
```

#### 无价值的注释
```go
// ❌ 重复代码内容
// 设置名称为 John
name := "John"

// 循环遍历用户
for _, user := range users { ... }
```

### 6. 错误处理质量

#### 检查点
- [ ] 所有错误都被处理
- [ ] 错误消息包含上下文
- [ ] 使用错误包装保留堆栈
- [ ] 在适当的层级处理错误

```go
// ❌ 忽略错误
file, _ := os.Open("config.json")

// ❌ 丢失上下文
return err

// ✅ 良好的错误处理
file, err := os.Open("config.json")
if err != nil {
    return fmt.Errorf("failed to open config file: %w", err)
}
defer file.Close()
```

### 7. 资源管理

#### 文件处理
```go
// ✅ 使用 defer 确保关闭
file, err := os.Open("data.txt")
if err != nil {
    return err
}
defer file.Close()
```

#### 并发资源
```go
// ✅ 使用 sync.WaitGroup
var wg sync.WaitGroup
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func(n int) {
        defer wg.Done()
        // 处理
    }(i)
}
wg.Wait()
```

### 8. 依赖管理

#### 耦合度
- **低耦合**: 模块间依赖少
- **高内聚**: 模块内部功能相关

#### 依赖注入
```go
// ❌ 紧耦合
type UserService struct {
    db *sql.DB // 直接依赖具体实现
}

// ✅ 依赖注入
type UserRepository interface {
    FindByID(id string) (*User, error)
    Save(user *User) error
}

type UserService struct {
    repo UserRepository // 依赖抽象
}
```

## 质量指标

### 优先级分类

#### P0 - 必须修复
- 未处理的错误
- 资源泄漏
- 明显的逻辑错误
- 安全漏洞

#### P1 - 强烈建议
- 高复杂度函数（圈复杂度 > 20）
- 大量重复代码
- 过长的函数（> 100 行）
- 参数过多（> 5 个）

#### P2 - 建议改进
- 中等复杂度（圈复杂度 11-20）
- 命名不清晰
- 缺少必要注释
- 可以优化的性能

#### P3 - 可选优化
- 轻微的代码风格问题
- 可以更好的命名
- 次要的重构机会

## 自动检查清单

在审查代码时，自动检查以下项目：

### 基本质量
- [ ] 无语法错误
- [ ] 无明显的逻辑错误
- [ ] 所有错误都被处理
- [ ] 资源正确释放

### 可维护性
- [ ] 函数长度合理（< 50 行）
- [ ] 圈复杂度可接受（< 10）
- [ ] 无大量重复代码
- [ ] 命名清晰有意义

### 可读性
- [ ] 代码结构清晰
- [ ] 适当的注释
- [ ] 一致的代码风格
- [ ] 合理的缩进和格式

### 性能
- [ ] 无明显的性能问题
- [ ] 资源使用合理
- [ ] 算法复杂度可接受

## 改进建议模板

当识别到质量问题时，提供以下格式的建议：

```markdown
### 代码质量问题: [问题类型]

**位置**: [文件名:行号]

**问题**: [描述问题]

**严重程度**: P0 / P1 / P2 / P3

**影响**: [说明影响]

**建议修改**:
[提供具体的改进代码]

**原因**: [解释为什么要这样改]
```
