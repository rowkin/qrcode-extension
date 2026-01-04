// 防止重复注入监听器
if (!window.qrcodeExtensionInjected) {
  window.qrcodeExtensionInjected = true;

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateQRCode') {
      try {
        injectQRCodePanel(request.url);
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to inject QR code panel:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true; // 表明我们会异步发送响应
    }
  });
}

// 移除现有面板
function removeExistingPanel() {
  const existingPanel = document.getElementById('qrcode-floating-panel');
  const existingOverlay = document.querySelector('.qrcode-overlay');
  if (existingPanel) existingPanel.remove();
  if (existingOverlay) existingOverlay.remove();
}
// 注入样式
function injectStyles() {
  if (!document.getElementById('qrcode-style')) {
    const style = document.createElement('style');
    style.id = 'qrcode-style';
    style.textContent = `
    #qrcode-floating-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        text-align: center;
        min-width: 300px;
        animation: fadeIn 0.3s ease;
        /* constrain to viewport and use column layout so header stays visible */
        max-height: calc(100vh - 40px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .panel-content {
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
        box-sizing: border-box;
        /* make settings area scrollable when viewport is small */
        max-height: calc(100vh - 160px);
        overflow: auto;
        padding-right: 8px;
      }
      
      #qrcode-floating-panel .close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        font-size: 20px;
        color: #666;
        padding: 0;
        line-height: 20px;
      }
      
      #qrcode-floating-panel .close-btn:hover {
        color: #333;
      }
      
      .url-container {
        width: 256px;
        margin: 10px auto;
        position: relative;
        display: flex;
        align-items: flex-start;
        background: #f5f5f5;
        border-radius: 4px;
        padding: 8px 8px 40px;
        box-sizing: border-box;
      }
      
      #url-display {
        word-break: break-all;
        font-size: 13px;
        color: #333;
        text-align: left;
        flex-grow: 1;
        cursor: text;
        user-select: all;
        padding: 4px;
        min-height: 20px;
      }
      
      .copy-btn {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: #1a73e8;
        color: white;
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        width: 60px;
        text-align: center;
      }
      
      .copy-btn:hover {
        background: #1557b0;
      }
      
      .copy-btn.copied {
        background: #34a853;
      }
      
      .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        white-space: nowrap;
      }
      
      .tooltip.show {
        opacity: 1;
      }
      
      .download-container {
        position: absolute;
        bottom: 0;
        right: 0;
        opacity: 0;
        transition: all 0.3s ease;
      }
      
      #qrcode-container:hover .download-container {
        opacity: 1;
      }
      
      .download-btn {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        border: none;
        padding: 0;
        transition: all 0.2s ease;
      }
      
      .download-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 1);
      }
      
      .download-icon {
        width: 16px;
        height: 16px;
        fill: #1a73e8;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .qrcode-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
      }
      
      /* 移动端适配 */
      @media (max-width: 768px) {
        #qrcode-floating-panel {
          width: 90%;
          min-width: auto;
          max-width: 350px;
        }
        
        .url-container {
          width: 100%;
        }
        
        #qrcode-container {
          width: 100%;
          max-width: 256px;
        }
      }
    `;
    // loading 相关样式
    style.textContent += `
    .loading-state {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fff;
      padding: 20px;
      box-sizing: border-box;
      z-index: 2;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      margin-bottom: 16px;
      position: relative;
    }

    .spinner {
      animation: rotate 2s linear infinite;
      transform-origin: center center;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    .path {
      stroke: #1a73e8;
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }

    .loading-text {
      color: #5f6368;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      margin-top: 8px;
      white-space: nowrap;
    }

    @keyframes rotate {
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes dash {
      0% {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -35;
      }
      100% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -124;
      }
    }

    /* 确保二维码容器样式正确 */
    #qrcode-container {
        position: relative;
        width: 256px;
        height: 256px;
        margin: 20px auto;
        padding: 0px;
        background: white;
        border: 1px solid #dadce0;
        border-radius: 4px;
        /* allow internal scroll when the QR canvas/image is larger than visible area */
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        max-height: 50vh;
        box-sizing: border-box;
      }

    #qrcode-container img {
      display: block;
      width: 256px;
      height: 256px;
      object-fit: contain;
    }

    /* 确保二维码图片容器样式正确 */
    #qrcode-container > div {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
    // 添加样式到页面中
    document.head.appendChild(style);
  }
}

// 设置关闭处理程序
function setupCloseHandlers(panel, overlay) {
  const close = () => {
    panel.remove();
    overlay.remove();
  };
  
  panel.querySelector('.close-btn').onclick = close;
  overlay.onclick = close;
  
  // 添加 ESC 键关闭功能
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
    }
  });
}

// 设置复制处理程序
function setupCopyHandler(panel, url) {
  const copyBtn = panel.querySelector('.copy-btn');
  const tooltip = panel.querySelector('.tooltip');
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.classList.add('copied');
      copyBtn.textContent = chrome.i18n.getMessage("copiedText");
      tooltip.classList.add('show');
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.textContent = chrome.i18n.getMessage("copyButtonText");
        tooltip.classList.remove('show');
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      tooltip.textContent = chrome.i18n.getMessage("copyFailedText");
      tooltip.classList.add('show');
      setTimeout(() => {
        tooltip.classList.remove('show');
      }, 2000);
    }
  });
}

  // 设置URL选择功能
function setupUrlSelection(panel) {
  const urlDisplay = panel.querySelector('#url-display');
  urlDisplay.addEventListener('click', () => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(urlDisplay);
    selection.removeAllRanges();
    selection.addRange(range);
  });
}

// 生成二维码
function generateQRCode(panel, url) {
  const container = panel.querySelector('#qrcode-container');
  
  // 创建加载状态元素
  const loadingState = document.createElement('div');
  loadingState.className = 'loading-state';
  loadingState.innerHTML = `
    <div class="loading-spinner">
      <svg viewBox="0 0 50 50" class="spinner">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
      </svg>
    </div>
    <span class="loading-text">${chrome.i18n.getMessage("loadingText") || '正在生成二维码...'}</span>
  `;

  // 创建二维码容器
  const qrcodeDiv = document.createElement('div');
  qrcodeDiv.className = 'qrcode-inner';
  
  // 添加到主容器
  container.appendChild(qrcodeDiv);
  container.appendChild(loadingState);

  setTimeout(() => {
    try {
      // 直接在容器中生成二维码
      new QRCode(container, {
        text: url,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
        onRender: () => {
          // 二维码渲染完成后
          const loadingState = container.querySelector('.loading-state');
          if (loadingState) {
            loadingState.remove();
          }
          
          // 添加下载功能
          setupDownloadHandler(panel);
        }
      });
      
      // 确保图片加载完成
      const checkImage = setInterval(() => {
        const qrImage = container.querySelector('img');
        if (qrImage && qrImage.complete) {
          clearInterval(checkImage);
          const loadingState = container.querySelector('.loading-state');
          if (loadingState) {
            loadingState.remove();
          }
          // 添加下载功能
          setupDownloadHandler(panel);
        }
      }, 100);

      // 5秒后如果还没加载完，清除检查
      setTimeout(() => clearInterval(checkImage), 5000);
      
    } catch (error) {
      console.error('QR Code generation failed:', error);
      container.innerHTML = `
        <div class="error-container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#d93025" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div class="error-message">
            ${chrome.i18n.getMessage("generateFailedText") || '生成二维码失败'}
          </div>
        </div>
      `;
    }
  }, 100);
}

function injectQRCodePanel(url) {
  // 如果已存在面板，先移除
  removeExistingPanel();

  // 创建浮动面板
  const panel = document.createElement('div');
  panel.id = 'qrcode-floating-panel';
  
  // 注入样式
  injectStyles();
  
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'qrcode-overlay';
  
  // 构建面板内容
  panel.innerHTML = `
    <button class="close-btn">&times;</button>
    <div class="panel-content">
      <div id="qrcode-container"></div>
      <div class="url-container">
        <div id="url-display" title="${chrome.i18n.getMessage("clickToSelectText")}"></div>
        <button class="copy-btn">${chrome.i18n.getMessage("copyButtonText")}</button>
        <div class="tooltip">${chrome.i18n.getMessage("copiedText")}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  
  // 设置关闭事件
  setupCloseHandlers(panel, overlay);
  
  // 显示URL
  panel.querySelector('#url-display').textContent = url;
  
  // 设置复制功能
  setupCopyHandler(panel, url);
  
  // 设置URL选择功能
  setupUrlSelection(panel);
  
  // 生成二维码
  generateQRCode(panel, url);
}

// 添加下载功能
function setupDownloadHandler(panel) {
  const qrcodeContainer = panel.querySelector('#qrcode-container');
  const qrcodeImg = qrcodeContainer.querySelector('img');
  
  // 创建下载按钮容器
  const downloadContainer = document.createElement('div');
  downloadContainer.className = 'download-container';
  
  // 创建下载按钮
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'download-btn';
  downloadBtn.title = chrome.i18n.getMessage("downloadQRCode");
  
  // 添加下载图标 SVG
  downloadBtn.innerHTML = `
    <svg class="download-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  `;
  
  // 添加下载事件
  downloadBtn.addEventListener('click', async () => {
    try {
      // 创建一个临时 canvas 来处理二维码图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置 canvas 尺寸
      canvas.width = qrcodeImg.width;
      canvas.height = qrcodeImg.height;
      
      // 绘制白色背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 等待图片加载完成
      await new Promise((resolve, reject) => {
        if (qrcodeImg.complete) {
          resolve();
        } else {
          qrcodeImg.onload = resolve;
          qrcodeImg.onerror = reject;
        }
      });
      
      // 绘制二维码图片
      ctx.drawImage(qrcodeImg, 0, 0);
      
      // 创建下载链接
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `qrcode-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 显示下载成功提示
      const tooltip = panel.querySelector('.tooltip');
      tooltip.textContent = chrome.i18n.getMessage("downloadSuccess");
      tooltip.classList.add('show');
      
      setTimeout(() => {
        tooltip.classList.remove('show');
      }, 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      const tooltip = panel.querySelector('.tooltip');
      tooltip.textContent = chrome.i18n.getMessage("downloadFailed");
      tooltip.classList.add('show');
      
      setTimeout(() => {
        tooltip.classList.remove('show');
      }, 2000);
    }
  });
  
  // 将下载按钮添加到容器
  downloadContainer.appendChild(downloadBtn);
  qrcodeContainer.appendChild(downloadContainer);
}

