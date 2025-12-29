# 文档站点部署指南

## 🔍 问题诊断结果

### MCP 工具部署失败原因

**错误信息**：`Error: Deployment failed: fetch is not defined`

**根本原因**：
- 当前 Node.js 版本：`v16.14.2`
- `fetch` API 在 Node.js 18.0.0+ 才原生支持
- EdgeOne Pages MCP 工具依赖 `fetch` API，在 Node.js 16 环境下无法运行

**结论**：这是 **Node.js 版本问题**，不是项目或 MCP 工具本身的问题。

## ✅ 推荐解决方案

### 方案一：通过 Git 仓库部署（⭐ 强烈推荐）

这是最可靠、最自动化的部署方式，不依赖 Node.js 版本。

#### 步骤：

1. **提交文档站点到 Git**
   ```bash
   # 添加文档站点文件
   git add docs-site/
   
   # 提交更改
   git commit -m "docs: 添加文档站点"
   
   # 推送到远程仓库
   git push
   ```

2. **在 EdgeOne Pages 控制台部署**
   - 访问：https://console.tencentcloud.com/edgeone/pages
   - 点击"创建项目"
   - 选择"从 Git 仓库部署"
   - 连接 Git 仓库：`mdsfe/qrcode-extension`
   - 配置构建设置：
     - **项目名称**：`qrcode-extension-docs`
     - **生产分支**：`master`（或您的主分支）
     - **构建目录**：`docs-site`
     - **构建命令**：留空（静态文件无需构建）
     - **输出目录**：`docs-site`
   - 点击"开始部署"

3. **自动部署**
   - EdgeOne 会自动检测 Git 推送
   - 每次推送后自动重新部署
   - 获得访问 URL：`https://your-project.edgeone.dev`

#### 优势：
- ✅ 不依赖 Node.js 版本
- ✅ 完全自动化（Git 推送即部署）
- ✅ 版本控制
- ✅ 稳定可靠
- ✅ 符合最佳实践

### 方案二：使用自动化脚本创建 ZIP 包

使用项目提供的部署脚本：

```bash
# 查看部署信息
npm run docs:deploy:info

# 创建 ZIP 包
npm run docs:deploy:zip

# 准备 Git 提交
npm run docs:deploy:git
```

然后手动上传 ZIP 包到 EdgeOne Pages 控制台。

### 方案三：升级 Node.js（如果必须使用 MCP 工具）

如果必须使用 MCP 工具直接部署，需要升级 Node.js：

```bash
# 使用 nvm 升级（如果已安装 nvm）
nvm install 18
nvm use 18

# 或安装最新 LTS 版本
nvm install --lts
nvm use --lts

# 验证版本
node -v  # 应该显示 v18.x.x 或更高
```

然后重新尝试 MCP 工具部署。

## 🚀 快速部署（推荐方式）

### 立即开始部署

```bash
# 1. 检查部署信息
npm run docs:deploy:info

# 2. 提交到 Git
git add docs-site/
git commit -m "docs: 添加文档站点"
git push

# 3. 在 EdgeOne Pages 控制台创建项目并连接 Git 仓库
# 4. 设置构建目录为 docs-site
# 5. 完成！自动部署成功
```

## 📋 部署检查清单

- [ ] 文档站点文件完整（index.html, styles.css, script.js）
- [ ] 文件已提交到 Git 仓库
- [ ] EdgeOne Pages 项目已创建
- [ ] Git 仓库已连接
- [ ] 构建目录设置为 `docs-site`
- [ ] 部署成功，可以访问

## 🔧 故障排除

### 问题：Git 推送后没有自动部署

**解决**：
- 检查 EdgeOne Pages 项目设置中的"自动部署"是否开启
- 确认构建目录设置正确
- 查看 EdgeOne Pages 控制台的构建日志

### 问题：部署后页面无法访问

**解决**：
- 检查构建目录和输出目录设置
- 确认 `index.html` 文件在正确位置
- 查看 EdgeOne Pages 控制台的部署日志

### 问题：样式或脚本文件无法加载

**解决**：
- 确认所有文件都在 `docs-site` 目录中
- 检查文件路径是否为相对路径
- 查看浏览器控制台的错误信息

## 📝 总结

- **问题原因**：Node.js 16 不支持 `fetch` API
- **最佳方案**：通过 Git 仓库部署（不依赖 Node.js 版本）
- **自动化工具**：已提供部署脚本辅助
- **推荐流程**：Git 提交 → EdgeOne Pages 连接 → 自动部署

## 🔗 相关链接

- [EdgeOne Pages 控制台](https://console.tencentcloud.com/edgeone/pages)
- [Git 仓库](https://gitee.com/mdsfe/qrcode-extension)
- [Node.js 版本要求](https://nodejs.org/)


