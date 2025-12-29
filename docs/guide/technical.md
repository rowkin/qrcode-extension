# 技术文档

深入了解二维码生成器的技术实现和架构设计。

## 技术架构

### 核心技术栈

- **Chrome Extension Manifest V3**：使用最新的扩展规范
- **QRCode.js**：二维码生成库
- **原生 JavaScript**：无框架依赖，轻量高效
- **Canvas API**：二维码图片导出
- **i18n API**：国际化支持

### 架构设计

```
┌─────────────────────────────────────┐
│         Chrome Browser              │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐                  │
│  │  Background  │  Service Worker   │
│  │    Script    │  (background.js)  │
│  └──────┬───────┘                   │
│         │                           │
│  ┌──────▼───────┐  ┌──────────────┐ │
│  │   Content    │  │    Popup    │ │
│  │    Script    │  │  (popup.js) │ │
│  │(content.js)  │  └──────────────┘ │
│  └──────────────┘                   │
│                                     │
└─────────────────────────────────────┘
```

## 核心组件

### 1. Background Script (background.js)

**职责**：
- 处理右键菜单创建和管理
- 处理扩展消息传递
- 管理扩展生命周期

**关键功能**：

```javascript
// 创建右键菜单
chrome.contextMenus.create({
  id: 'generateQRCode',
  title: chrome.i18n.getMessage('contextMenuTitle'),
  contexts: ['selection', 'link', 'page']
});

// 处理菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // 处理不同类型的上下文菜单点击
});
```

### 2. Content Script (content.js)

**职责**：
- 在网页中注入二维码面板
- 处理用户交互（复制、下载、关闭）
- 管理面板的显示和隐藏

**关键功能**：

```javascript
// 创建二维码面板
function createQRCodePanel(url) {
  // 创建遮罩层和面板
  // 生成二维码
  // 绑定事件处理
}

// 生成二维码
function generateQRCode(text) {
  // 使用 QRCode.js 生成二维码
  // 渲染到 Canvas
}
```

### 3. Popup Script (popup.js)

**职责**：
- 处理扩展图标点击
- 与 Background Script 通信
- 触发二维码生成

**关键功能**：

```javascript
// 获取当前标签页
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  // 发送消息生成二维码
  chrome.runtime.sendMessage({
    action: 'showQRCode',
    url: tabs[0].url
  });
});
```

## 数据流

### 消息传递流程

```
用户操作
   │
   ├─ 点击扩展图标
   │   └─> Popup Script
   │       └─> Background Script
   │           └─> Content Script
   │               └─> 显示二维码面板
   │
   └─ 右键菜单
       └─> Background Script
           └─> Content Script
               └─> 显示二维码面板
```

### 二维码生成流程

```
1. 获取内容（URL/文本/链接）
   │
2. 验证内容有效性
   │
3. 调用 QRCode.js 生成二维码
   │
4. 渲染到 Canvas
   │
5. 显示在面板中
   │
6. 支持下载和复制
```

## 关键技术实现

### 二维码生成

使用 QRCode.js 库：

```javascript
const qrcode = new QRCode(canvas, {
  text: content,
  width: 256,
  height: 256,
  colorDark: '#000000',
  colorLight: '#ffffff',
  correctLevel: QRCode.CorrectLevel.H
});
```

### 图片下载

使用 Canvas API：

```javascript
function downloadQRCode(canvas) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
```

### 国际化支持

使用 Chrome i18n API：

```javascript
// 获取本地化文本
chrome.i18n.getMessage('key');

// 支持的语言
// - 中文 (zh)
// - 英文 (en)
// - 日文 (ja)
```

## 文件结构

```
qrcode-extension/
├── manifest.json          # 扩展清单文件
├── background.js          # Background Script
├── content.js             # Content Script
├── popup.html             # Popup 页面
├── popup.js               # Popup 脚本
├── qrcode.min.js          # QRCode.js 库
├── icons/                 # 图标资源
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/              # 国际化资源
    ├── en/
    │   └── messages.json
    ├── zh/
    │   └── messages.json
    └── ja/
        └── messages.json
```

## 权限说明

### 所需权限

- `contextMenus`：创建右键菜单
- `activeTab`：访问当前活动标签页
- `scripting`：注入 Content Script
- `tabs`：获取标签页信息
- `<all_urls>`：在所有网页中运行

### 权限用途

- **contextMenus**：提供右键菜单功能
- **activeTab**：获取当前页面 URL
- **scripting**：在页面中注入二维码面板
- **tabs**：查询标签页信息
- **host_permissions**：在所有网站中可用

## 性能优化

### 1. 延迟加载

- QRCode.js 库按需加载
- 面板仅在需要时创建

### 2. 内存管理

- 及时清理 DOM 元素
- 释放 Canvas 资源
- 撤销 Blob URL

### 3. 事件处理

- 使用事件委托
- 及时移除事件监听器
- 避免内存泄漏

## 安全考虑

### 1. Content Security Policy

遵循 Chrome Extension CSP 要求：
- 不使用 `eval()`
- 不使用内联脚本
- 使用安全的资源加载方式

### 2. 数据隐私

- 所有处理在本地完成
- 不收集用户数据
- 不上传任何信息

### 3. 权限最小化

- 仅请求必要的权限
- 遵循最小权限原则

## 浏览器兼容性

### 支持的浏览器

- Chrome 88+
- Edge 88+
- 其他基于 Chromium 的浏览器 88+

### 不支持的浏览器

- Firefox（需要 Manifest V2 版本）
- Safari（需要不同的实现方式）

## 开发指南

### 本地开发

1. 克隆项目
2. 加载未打包的扩展
3. 修改代码后重新加载扩展

### 构建打包

```bash
npm run build
```

### 版本管理

使用 `scripts/bump_version.sh` 脚本：
- 自动更新版本号
- 更新 manifest.json
- 生成打包文件

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License

## 相关资源

- [Chrome Extension 文档](https://developer.chrome.com/docs/extensions/)
- [QRCode.js 文档](https://github.com/davidshimjs/qrcodejs)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/intro/)


