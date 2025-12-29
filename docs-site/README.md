# 文档站点部署说明

本文档站点已准备好部署到 EdgeOne Pages。

## 部署方式

### 方式一：通过 Git 仓库部署（推荐）

1. 将 `docs-site` 目录内容提交到 Git 仓库
2. 在 EdgeOne Pages 控制台创建新项目
3. 连接 Git 仓库
4. 设置构建目录为 `docs-site`
5. 自动部署

### 方式二：直接部署文件夹

使用 EdgeOne Pages MCP 工具直接部署：

```bash
# 使用 MCP 工具部署
mcp_edgeone-pages-mcp-server_deploy_folder_or_zip \
  --builtFolderPath /path/to/docs-site
```

## 文件结构

```
docs-site/
├── index.html      # 主页面
├── styles.css      # 样式文件
├── script.js       # 脚本文件
└── README.md       # 本文件
```

## 本地预览

直接在浏览器中打开 `index.html` 文件即可预览。

## 注意事项

- 所有资源使用相对路径，可以直接部署
- 无需构建步骤，静态 HTML 文件即可
- 支持所有现代浏览器


