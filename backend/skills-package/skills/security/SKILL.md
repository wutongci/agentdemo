---
name: security
description: 自动检查常见安全漏洞和安全最佳实践
allowed-tools: ["fs_read", "bash_run"]
triggers:
  - type: keyword
    keywords: ["安全", "security", "漏洞", "vulnerability", "攻击", "认证", "授权"]
  - type: context
    condition: "during /review"
  - type: context
    condition: "during /analyze"
---

# 安全检查知识库

本技能提供常见安全漏洞的检测和防护建议，涵盖 OWASP Top 10 和其他常见安全问题。

## OWASP Top 10 安全风险

### 1. 注入攻击 (Injection)

#### SQL 注入
最常见和危险的攻击方式之一。

```go
// ❌ 不安全：SQL 注入风险
query := "SELECT * FROM users WHERE username = '" + username + "'"
db.Query(query)

// ✅ 安全：使用参数化查询
query := "SELECT * FROM users WHERE username = ?"
db.Query(query, username)

// ✅ 安全：使用 ORM
db.Where("username = ?", username).Find(&user)
```

#### 命令注入
```go
// ❌ 不安全：命令注入风险
cmd := exec.Command("sh", "-c", "ls "+userInput)

// ✅ 安全：避免使用 shell，使用参数数组
cmd := exec.Command("ls", userInput)

// ✅ 更安全：验证输入
if !isValidFilename(userInput) {
    return errors.New("invalid filename")
}
cmd := exec.Command("ls", userInput)
```

#### NoSQL 注入
```javascript
// ❌ 不安全
db.collection.find({ username: req.body.username })

// ✅ 安全：类型验证
if (typeof req.body.username !== 'string') {
    return res.status(400).send('Invalid input')
}
db.collection.find({ username: req.body.username })
```

### 2. 失效的身份认证 (Broken Authentication)

#### 密码安全
```go
// ❌ 不安全：明文存储密码
user.Password = password

// ❌ 不安全：弱哈希算法
hashedPassword := md5.Sum([]byte(password))

// ✅ 安全：使用 bcrypt
hashedPassword, err := bcrypt.GenerateFromPassword(
    []byte(password),
    bcrypt.DefaultCost,
)

// ✅ 验证密码
err := bcrypt.CompareHashAndPassword(
    []byte(user.HashedPassword),
    []byte(password),
)
```

#### 会话管理
```go
// ❌ 不安全：可预测的会话 ID
sessionID := fmt.Sprintf("%d", time.Now().Unix())

// ✅ 安全：使用加密随机数
sessionID, err := generateSecureToken(32)

func generateSecureToken(length int) (string, error) {
    bytes := make([]byte, length)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(bytes), nil
}
```

#### 多因素认证
```go
// ✅ 实施 MFA
func Login(username, password, totpCode string) error {
    user, err := authenticateUser(username, password)
    if err != nil {
        return err
    }

    if user.MFAEnabled {
        if !verifyTOTP(user.MFASecret, totpCode) {
            return errors.New("invalid MFA code")
        }
    }

    return createSession(user)
}
```

### 3. 敏感数据泄露 (Sensitive Data Exposure)

#### 加密存储
```go
// ❌ 不安全：明文存储敏感数据
user.CreditCard = creditCardNumber

// ✅ 安全：加密敏感数据
encryptedData, err := encrypt(creditCardNumber, encryptionKey)
user.EncryptedCreditCard = encryptedData
```

#### HTTPS/TLS
```go
// ❌ 不安全：HTTP 传输
http.ListenAndServe(":8080", handler)

// ✅ 安全：HTTPS 传输
http.ListenAndServeTLS(":443", "cert.pem", "key.pem", handler)

// ✅ 强制 HTTPS
func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "https://"+r.Host+r.URL.String(),
        http.StatusMovedPermanently)
}
```

#### 日志脱敏
```go
// ❌ 不安全：记录敏感信息
log.Printf("User login: %s, password: %s", username, password)

// ✅ 安全：脱敏敏感信息
log.Printf("User login: %s", username)

// ✅ 脱敏函数
func maskCreditCard(cc string) string {
    if len(cc) < 4 {
        return "****"
    }
    return "************" + cc[len(cc)-4:]
}
```

### 4. XML 外部实体 (XXE)

```go
// ❌ 不安全：允许外部实体
decoder := xml.NewDecoder(input)
decoder.Decode(&data)

// ✅ 安全：禁用外部实体
decoder := xml.NewDecoder(input)
decoder.Entity = xml.HTMLEntity
decoder.Strict = false
```

### 5. 失效的访问控制 (Broken Access Control)

#### 权限检查
```go
// ❌ 不安全：缺少权限检查
func DeleteUser(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")
    db.Delete(&User{}, userID)
}

// ✅ 安全：检查权限
func DeleteUser(w http.ResponseWriter, r *http.Request) {
    currentUser := getCurrentUser(r)
    userID := r.URL.Query().Get("id")

    // 只允许管理员或用户自己删除
    if !currentUser.IsAdmin && currentUser.ID != userID {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    db.Delete(&User{}, userID)
}
```

#### 对象级访问控制
```go
// ✅ 验证资源所有权
func GetDocument(w http.ResponseWriter, r *http.Request) {
    currentUser := getCurrentUser(r)
    docID := r.URL.Query().Get("id")

    var doc Document
    if err := db.First(&doc, docID).Error; err != nil {
        http.Error(w, "Not found", http.StatusNotFound)
        return
    }

    // 验证所有权
    if doc.OwnerID != currentUser.ID && !currentUser.IsAdmin {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    json.NewEncoder(w).Encode(doc)
}
```

### 6. 安全配置错误 (Security Misconfiguration)

#### 环境变量
```go
// ❌ 不安全：硬编码密钥
const APIKey = "sk-1234567890abcdef"

// ✅ 安全：使用环境变量
apiKey := os.Getenv("API_KEY")
if apiKey == "" {
    log.Fatal("API_KEY not set")
}
```

#### 错误信息
```go
// ❌ 不安全：暴露详细错误
if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
}

// ✅ 安全：通用错误信息
if err != nil {
    log.Printf("Internal error: %v", err) // 记录详细错误
    http.Error(w, "Internal server error",
        http.StatusInternalServerError) // 返回通用错误
}
```

#### 默认凭证
```go
// ❌ 不安全：使用默认密码
if password == "" {
    password = "admin123"
}

// ✅ 安全：强制设置密码
if password == "" {
    return errors.New("password required")
}
if !isStrongPassword(password) {
    return errors.New("password too weak")
}
```

### 7. 跨站脚本 (XSS)

#### 输出编码
```go
// ❌ 不安全：直接输出用户输入
fmt.Fprintf(w, "<div>%s</div>", userInput)

// ✅ 安全：HTML 转义
import "html"
fmt.Fprintf(w, "<div>%s</div>", html.EscapeString(userInput))

// ✅ 使用模板自动转义
tmpl.Execute(w, data)
```

#### Content Security Policy
```go
// ✅ 设置 CSP 头
w.Header().Set("Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'")
```

### 8. 不安全的反序列化 (Insecure Deserialization)

```go
// ❌ 不安全：反序列化不可信数据
var data MyStruct
json.Unmarshal(untrustedInput, &data)
processData(data)

// ✅ 安全：验证和限制
var data MyStruct
if err := json.Unmarshal(untrustedInput, &data); err != nil {
    return fmt.Errorf("invalid input: %w", err)
}

// 验证数据
if err := validateData(&data); err != nil {
    return fmt.Errorf("validation failed: %w", err)
}

processData(data)
```

### 9. 使用已知漏洞的组件 (Using Components with Known Vulnerabilities)

#### 依赖管理
```bash
# 定期更新依赖
go get -u ./...

# 检查安全漏洞
go list -json -m all | nancy sleuth
```

#### 最小化依赖
```go
// ✅ 只引入必要的依赖
// 定期审查和清理不使用的依赖
```

### 10. 不足的日志和监控 (Insufficient Logging & Monitoring)

#### 安全事件日志
```go
// ✅ 记录安全相关事件
func Login(username, password string) error {
    user, err := db.FindUser(username)
    if err != nil {
        securityLog.Warn("Login attempt for non-existent user",
            "username", username,
            "ip", getClientIP())
        return err
    }

    if !verifyPassword(user, password) {
        securityLog.Warn("Failed login attempt",
            "username", username,
            "user_id", user.ID,
            "ip", getClientIP())
        return errors.New("invalid credentials")
    }

    securityLog.Info("Successful login",
        "username", username,
        "user_id", user.ID,
        "ip", getClientIP())
    return nil
}
```

#### 审计日志
```go
// ✅ 记录重要操作
func DeleteUser(userID string, operatorID string) error {
    auditLog.Info("User deletion",
        "user_id", userID,
        "operator_id", operatorID,
        "timestamp", time.Now(),
        "action", "DELETE_USER")

    return db.Delete(&User{}, userID)
}
```

## 其他常见安全问题

### CSRF (跨站请求伪造)

```go
// ✅ 使用 CSRF token
func HandleForm(w http.ResponseWriter, r *http.Request) {
    if !validateCSRFToken(r) {
        http.Error(w, "Invalid CSRF token", http.StatusForbidden)
        return
    }
    // 处理表单
}

// ✅ SameSite Cookie
http.SetCookie(w, &http.Cookie{
    Name:     "session",
    Value:    sessionID,
    SameSite: http.SameSiteStrictMode,
    Secure:   true,
    HttpOnly: true,
})
```

### 目录遍历

```go
// ❌ 不安全：目录遍历风险
filepath := "/var/www/" + userInput

// ✅ 安全：清理路径
filepath := filepath.Clean("/var/www/" + userInput)
if !strings.HasPrefix(filepath, "/var/www/") {
    return errors.New("invalid path")
}
```

### 速率限制

```go
// ✅ 实施速率限制
limiter := rate.NewLimiter(rate.Limit(10), 100) // 10 req/s, burst 100

func HandleRequest(w http.ResponseWriter, r *http.Request) {
    if !limiter.Allow() {
        http.Error(w, "Too many requests",
            http.StatusTooManyRequests)
        return
    }
    // 处理请求
}
```

## 安全检查清单

### 输入验证
- [ ] 所有用户输入都经过验证
- [ ] 使用白名单而非黑名单
- [ ] 输入长度限制
- [ ] 类型检查

### 认证和授权
- [ ] 密码安全存储（bcrypt/scrypt）
- [ ] 会话管理安全
- [ ] 实施权限检查
- [ ] 支持 MFA

### 数据保护
- [ ] 敏感数据加密
- [ ] 使用 HTTPS
- [ ] 日志脱敏
- [ ] 安全的密钥管理

### 注入防护
- [ ] 使用参数化查询
- [ ] 避免动态构建命令
- [ ] 输出编码

### 配置安全
- [ ] 无硬编码密钥
- [ ] 安全的默认配置
- [ ] 最小权限原则
- [ ] 定期更新依赖

### 监控和响应
- [ ] 安全事件日志
- [ ] 异常监控
- [ ] 审计日志
- [ ] 事件响应计划

## 安全问题报告模板

```markdown
### 安全问题: [漏洞类型]

**严重程度**: 🔴 严重 / 🟡 重要 / 🟢 一般

**位置**: [文件名:行号]

**漏洞描述**: [详细说明安全问题]

**攻击场景**: [说明如何利用这个漏洞]

**影响**: [说明可能的后果]

**修复建议**:
[提供安全的代码示例]

**参考**: [OWASP 或其他安全标准链接]
```
