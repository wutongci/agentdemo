# OSS 加载 Skills 包配置指南

本文档说明如何配置从阿里云 OSS 加载 Skills 包。

## 前置要求

1. 阿里云账号
2. 已创建 OSS Bucket
3. 有访问 OSS 的 AccessKey ID 和 AccessKey Secret

---

## 步骤 1：准备 Skills 包

将你的 skills-package 目录打包并上传到 OSS：

```bash
# 压缩 Skills 包
cd backend
tar -czf skills-package.tar.gz skills-package/

# 使用阿里云 OSS 工具上传
ossutil cp skills-package.tar.gz oss://your-bucket/skills/v1.0.0/
```

---

## 步骤 2：配置环境变量

在 `.env` 文件中添加 OSS 配置：

```bash
# OSS 配置
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_SKILLS_PATH=skills/v1.0.0/skills-package.tar.gz
```

---

## 步骤 3：修改 AgentManager 配置

在 `backend/agent/manager.go` 中修改 SkillsPackageConfig：

```go
SkillsPackage: &types.SkillsPackageConfig{
    Source:          "oss",  // 改为 "oss"
    Path:            os.Getenv("OSS_SKILLS_PATH"),
    Version:         "v1.0.0",
    CommandsDir:     "commands",
    SkillsDir:       "skills",
    EnabledCommands: []string{"analyze", "explain", "optimize", "review", "plan"},
    EnabledSkills:   []string{"best-practices", "code-quality", "security"},
}
```

---

## 步骤 4：实现 OSS 下载逻辑（可选）

如果需要完整的 OSS 支持，可以在初始化时添加下载逻辑：

```go
// 在 Manager 初始化时
if config.SkillsPackage != nil && config.SkillsPackage.Source == "oss" {
    // 下载并解压 Skills 包
    localPath, err := downloadFromOSS(config.SkillsPackage.Path)
    if err != nil {
        return nil, fmt.Errorf("download skills from OSS: %w", err)
    }
    config.SkillsPackage.Path = localPath
    config.SkillsPackage.Source = "local"
}
```

---

## 当前实现状态

### ✅ 已实现

- Skills 包本地加载（`Source: "local"`）
- 完整的 Skills 系统演示
- 前后端集成

### 🔄 OSS 支持框架

当前 writeflow-sdk 支持 OSS 加载，但需要：

1. **配置 OSS 客户端**
   ```go
   import "github.com/aliyun/aliyun-oss-go-sdk/oss"

   client, err := oss.New(endpoint, accessKeyID, accessKeySecret)
   bucket, err := client.Bucket(bucketName)
   ```

2. **下载 Skills 包**
   ```go
   err := bucket.GetObjectToFile(ossPath, localPath)
   ```

3. **解压到本地**
   ```bash
   tar -xzf skills-package.tar.gz -C ./temp/
   ```

4. **使用本地路径创建 Agent**
   ```go
   config.SkillsPackage.Path = "./temp/skills-package"
   config.SkillsPackage.Source = "local"
   ```

---

## 混合模式（Hybrid）

writeflow-sdk 还支持混合模式，可以同时使用本地和云端 Skills：

```go
Sandbox: &types.SandboxConfig{
    Kind: types.SandboxKindHybrid,
    HybridConfig: &types.HybridConfig{
        SkillsSource: "oss://your-bucket/skills/",
    },
}
```

---

## 注意事项

1. **权限配置**：确保 OSS Bucket 有正确的访问权限
2. **网络访问**：确保服务器能访问 OSS endpoint
3. **缓存策略**：建议缓存下载的 Skills 包，避免重复下载
4. **版本管理**：使用版本号管理不同的 Skills 包

---

## 示例：完整的 OSS Skills 管理器

```go
package skills

import (
    "fmt"
    "os"
    "path/filepath"

    "github.com/aliyun/aliyun-oss-go-sdk/oss"
)

type OSSSkillsManager struct {
    client     *oss.Client
    bucket     *oss.Bucket
    cacheDir   string
}

func NewOSSSkillsManager(endpoint, accessKeyID, accessKeySecret, bucketName string) (*OSSSkillsManager, error) {
    client, err := oss.New(endpoint, accessKeyID, accessKeySecret)
    if err != nil {
        return nil, err
    }

    bucket, err := client.Bucket(bucketName)
    if err != nil {
        return nil, err
    }

    return &OSSSkillsManager{
        client:   client,
        bucket:   bucket,
        cacheDir: "./cache/skills",
    }, nil
}

func (m *OSSSkillsManager) DownloadSkills(ossPath, version string) (string, error) {
    // 检查缓存
    localPath := filepath.Join(m.cacheDir, version)
    if _, err := os.Stat(localPath); err == nil {
        return localPath, nil // 已缓存
    }

    // 下载压缩包
    tarPath := filepath.Join(m.cacheDir, version+".tar.gz")
    err := m.bucket.GetObjectToFile(ossPath, tarPath)
    if err != nil {
        return "", fmt.Errorf("download from OSS: %w", err)
    }

    // 解压
    // ... 解压逻辑

    return localPath, nil
}
```

---

## 参考文档

- [阿里云 OSS SDK 文档](https://help.aliyun.com/document_detail/32144.html)
- [writeflow-sdk 文档](https://github.com/wordflowlab/agentsdk)
- [Skills 包规范](./SKILLS_DEMO.md)
