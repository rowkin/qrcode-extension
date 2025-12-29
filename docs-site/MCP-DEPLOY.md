# EdgeOne Pages MCP 部署说明

## 🔑 API Token 配置

EdgeOne Pages MCP 工具需要 API Token 才能部署。您需要先获取并配置 API Token。

### 获取 API Token

1. **访问 EdgeOne Pages 控制台**
   - 访问：https://console.tencentcloud.com/edgeone/pages
   - 登录您的腾讯云账号

2. **获取 API Token**
   - 在控制台中找到"API Token"或"访问密钥"设置
   - 创建新的 API Token
   - 复制 Token 值

### 配置 API Token

#### 方式一：环境变量（推荐）

```bash
# 设置环境变量
export EDGEONE_PAGES_API_TOKEN="your-api-token-here"

# 验证设置
echo $EDGEONE_PAGES_API_TOKEN
```

#### 方式二：在 MCP 配置中设置

根据您的 MCP 服务器配置方式，在配置文件中添加：

```json
{
  "edgeone-pages-mcp-server": {
    "apiToken": "your-api-token-here"
  }
}
```

## 🚀 部署步骤

### 1. 配置 API Token

```bash
# 设置环境变量
export EDGEONE_PAGES_API_TOKEN="your-token-here"
```

### 2. 使用 MCP 工具部署

```bash
# 在 Cursor 中使用 MCP 工具
# 或通过命令行调用
```

### 3. 验证部署

部署成功后，您将获得一个访问 URL，类似：
```
https://your-project.edgeone.dev
```

## 📝 注意事项

- API Token 需要妥善保管，不要提交到 Git 仓库
- Token 具有项目访问权限，请谨慎使用
- 如果 Token 泄露，请立即在控制台撤销并重新生成

## 🔄 备选方案

如果无法获取 API Token，可以使用以下方式：

1. **通过 Git 仓库部署**（推荐）
   - 不依赖 API Token
   - 自动化程度高
   - 详见 `DEPLOY-GUIDE.md`

2. **手动上传 ZIP 包**
   - 使用 `npm run docs:deploy:zip` 创建 ZIP 包
   - 在 EdgeOne Pages 控制台手动上传

## 🔗 相关文档

- [EdgeOne Pages 控制台](https://console.tencentcloud.com/edgeone/pages)
- [腾讯云 API 密钥管理](https://console.tencentcloud.com/cam/capi)


