// 防止重复注入监听器
if (!window.qrcodeExtensionInjected_v106) {
  window.qrcodeExtensionInjected_v106 = true;

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
        background: #ffffff;
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
        z-index: 10000;
        text-align: left;
        width: 720px;
        max-width: 90vw;
        height: 520px;
        max-height: 90vh;
        animation: fadeIn 0.3s ease;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      
      .panel-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      /* 左侧区域：二维码 + URL */
      .left-column {
        width: 320px;
        flex-shrink: 0;
        background: #f8f9fa;
        padding: 0;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #e0e0e0;
        box-sizing: border-box;
      }
      
      .left-column-header {
        padding: 16px 20px 12px;
        flex-shrink: 0;
      }
      
      .qr-title {
        font-size: 15px;
        font-weight: 600;
        color: #202124;
        margin: 0;
        text-align: left;
      }
      
      .left-column-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px 24px;
      }
      
      .left-column-footer {
        padding: 12px 20px 16px;
        text-align: left;
        flex-shrink: 0;
      }
      
      .version-info {
        font-size: 11px;
        color: #5f6368;
        margin: 0;
      }

      /* 右侧区域：设置 */
      .right-column {
        flex: 1;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }
      
      .settings-header-wrapper {
        position: relative;
        padding: 16px 56px 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 56px;
      }
      
      .settings-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
        max-height: 410px;
      }
      
      .settings-footer {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        background: #fafafa;
        flex-shrink: 0;
      }

      #qrcode-floating-panel .close-btn {
        position: absolute;
        top: 14px;
        right: 16px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        font-size: 28px;
        color: #5f6368;
        padding: 0;
        line-height: 32px;
        z-index: 100;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      #qrcode-floating-panel .close-btn:hover {
        background: rgba(0,0,0,0.05);
        color: #202124;
      }
      
      #qrcode-container {
        position: relative;
        width: 100%;
        max-width: 256px;
        height: 256px;
        // margin: 20px auto;
        background: white;
        border: 1px solid #dadce0;
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .url-container {
        width: 276px;
        background: #ffffff;
        border: 1px solid #dadce0;
        border-radius: 8px;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }
      
      #url-display {
        font-size: 13px;
        line-height: 1.5;
        color: #3c4043;
        word-break: break-all;
        max-height: 60px;
        overflow-y: auto;
        outline: none;
        border: 1px solid transparent;
        border-radius: 4px;
        padding: 2px;
      }
      
      #url-display:focus {
        background: #f1f3f4;
      }
      
      .copy-btn {
        align-self: flex-end;
        background: #fff;
        color: #1a73e8;
        border: 1px solid #dadce0;
        padding: 6px 16px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .copy-btn:hover {
        background: #f1f8ff;
        border-color: #1a73e8;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .copy-btn.copied {
        background: #e6f4ea;
        color: #137333;
        border-color: transparent;
      }

      .settings-header {
        font-size: 16px;
        font-weight: 600;
        color: #202124;
        margin: 0;
        flex: 1;
      }
      
      .color-customizer {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .color-picker-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .color-picker-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .color-picker-row label {
        font-size: 14px;
        color: #5f6368;
      }
      
      .color-input-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .color-input {
        width: 36px;
        height: 36px;
        border: none;
        padding: 0;
        border-radius: 8px;
        cursor: pointer;
        background: transparent;
      }
      .color-input::-webkit-color-swatch-wrapper { padding: 0; }
      .color-input::-webkit-color-swatch { border: 1px solid #dadce0; border-radius: 8px; }

      .color-text-input {
        width: 80px;
        padding: 8px;
        border: 1px solid #dadce0;
        border-radius: 6px;
        font-family: monospace;
        font-size: 13px;
        color: #3c4043;
        text-transform: uppercase;
      }
      
      .preset-colors {
        margin-top: 8px;
      }
      
      .preset-label {
        font-size: 14px;
        color: #5f6368;
        margin-bottom: 10px;
      }
      
      .preset-buttons {
        display: flex;
        gap: 12px;
      }
      
      .preset-btn {
        width: 42px;
        height: 42px;
        border-radius: 8px;
        border: 2px solid transparent;
        padding: 2px;
        background: #fff;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .preset-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      
      .preset-color-box {
        width: 100%;
        height: 100%;
        border-radius: 6px;
        display: block;
      }
      
      .padding-control {
        margin-top: 0;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      
      .padding-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 14px;
        color: #5f6368;
      }
      
      .padding-slider {
        width: 100%;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
        margin-bottom: 16px;
      }
      
      .padding-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #1a73e8;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: transform 0.1s;
      }
      
      .padding-slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }
      
      .padding-preset-buttons {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      
      .padding-preset-btn {
        flex: 1;
        padding: 8px 0;
        background: #fff;
        border: 1px solid #dadce0;
        border-radius: 6px;
        font-size: 13px;
        color: #5f6368;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .padding-preset-btn:hover {
        background: #f8f9fa;
        color: #1a73e8;
        border-color: #1a73e8;
      }
      
      .padding-preset-btn.active {
        background: #e8f0fe;
        color: #1a73e8;
        border-color: #1a73e8;
        font-weight: 500;
      }
      
      .reset-container {
        margin: 0;
      }
      
      .reset-color-btn {
        width: 100%;
        padding: 12px;
        background: #fff;
        border: 1px solid #dadce0;
        border-radius: 8px;
        color: #d93025;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .reset-color-btn:hover {
        background: #fce8e6;
        color: #c5221f;
        border-color: #d93025;
      }

      /* Scrollbar Styling */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #dadce0;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #bdc1c6;
      }
      
      .tooltip {
        position: absolute;
        top: -30px;
        right: 0;
        background: #202124;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }
      .tooltip.show { opacity: 1; }

      .download-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      #qrcode-container:hover .download-container {
        opacity: 1;
        pointer-events: auto;
      }
      
      .download-btn {
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        border: none;
        padding: 0;
        transition: all 0.2s;
        color: #1a73e8;
      }
      
      .download-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        background: #fff;
      }
      
      .download-icon {
        width: 24px;
        height: 24px;
        fill: currentColor;
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

    /* 错误状态样式 */
    .error-container {
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
      text-align: center;
    }

    .error-icon {
      margin-bottom: 12px;
    }

    .error-message {
      color: #d93025;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .error-hint {
      color: #5f6368;
      font-size: 12px;
      line-height: 1.5;
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
  const urlDisplay = panel.querySelector('#url-display');
  
  copyBtn.addEventListener('click', async () => {
    try {
      // 优先使用按钮数据属性中的URL，否则使用当前显示的URL
      const urlToCopy = copyBtn.dataset.url || urlDisplay.textContent.trim() || url;
      await navigator.clipboard.writeText(urlToCopy);
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
  
  // 当URL改变时，更新按钮数据属性
  const observer = new MutationObserver(() => {
    const currentUrl = urlDisplay.textContent.trim();
    if (currentUrl) {
      copyBtn.dataset.url = currentUrl;
    }
  });
  
  observer.observe(urlDisplay, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

  // 设置URL编辑功能
function setupUrlEditor(panel, initialUrl) {
  const urlDisplay = panel.querySelector('#url-display');
  let currentUrl = initialUrl;
  
  // 防抖函数，用于延迟更新二维码
  let debounceTimer = null;
  const debounceUpdateQR = (newUrl) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (newUrl && newUrl.trim() !== '') {
        currentUrl = newUrl.trim();
        // 重新生成二维码
        generateQRCode(panel, currentUrl);
        // 更新复制功能的目标URL
        const copyBtn = panel.querySelector('.copy-btn');
        if (copyBtn) {
          copyBtn.dataset.url = currentUrl;
        }
      }
    }, 500); // 500ms 防抖
  };
  
  // 监听内容变化
  urlDisplay.addEventListener('input', (e) => {
    const newUrl = e.target.textContent || e.target.innerText;
    debounceUpdateQR(newUrl);
  });
  
  // 监听粘贴事件，确保粘贴纯文本
  urlDisplay.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    debounceUpdateQR(text);
  });
  
  // 双击全选
  urlDisplay.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(urlDisplay);
    selection.removeAllRanges();
    selection.addRange(range);
  });
  
  // 失去焦点时，如果为空则恢复原URL
  urlDisplay.addEventListener('blur', () => {
    const text = urlDisplay.textContent.trim();
    if (!text) {
      urlDisplay.textContent = currentUrl;
    }
  });
  
  // 保存当前URL到按钮数据属性，供复制功能使用
  const copyBtn = panel.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.dataset.url = currentUrl;
  }
}

// 获取颜色设置
async function getColorSettings() {
  return new Promise((resolve) => {
    try {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['qrColorDark', 'qrColorLight'], (result) => {
          if (chrome.runtime.lastError) {
             console.warn('Storage error:', chrome.runtime.lastError);
             resolve({ colorDark: '#000000', colorLight: '#ffffff' });
          } else {
             resolve({
               colorDark: result.qrColorDark || '#000000',
               colorLight: result.qrColorLight || '#ffffff'
             });
          }
        });
      } else {
        console.warn('chrome.storage.local not available');
        resolve({ colorDark: '#000000', colorLight: '#ffffff' });
      }
    } catch (e) {
      console.warn('Error accessing storage:', e);
      resolve({ colorDark: '#000000', colorLight: '#ffffff' });
    }
  });
}

// 保存颜色设置
function saveColorSettings(colorDark, colorLight) {
  try {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        qrColorDark: colorDark,
        qrColorLight: colorLight
      });
    }
  } catch (e) {
    console.warn('Failed to save color settings:', e);
  }
}

// 获取留白设置
async function getPaddingSettings() {
  return new Promise((resolve) => {
    try {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['qrPadding'], (result) => {
          if (chrome.runtime.lastError) {
             resolve({ padding: 0 });
          } else {
             resolve({
               padding: result.qrPadding !== undefined ? result.qrPadding : 0
             });
          }
        });
      } else {
        resolve({ padding: 0 });
      }
    } catch (e) {
      resolve({ padding: 0 });
    }
  });
}

// 保存留白设置
function savePaddingSettings(padding) {
  try {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        qrPadding: padding
      });
    }
  } catch (e) {
    console.warn('Failed to save padding settings:', e);
  }
}

// 生成带留白的二维码
async function generateQRCodeWithPadding(canvas, url, colorDark, colorLight, padding) {
  return new Promise((resolve, reject) => {
    // 创建临时容器生成二维码
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '256px';
    tempContainer.style.height = '256px';
    // 必须插入到文档流中，否则 canvas 可能不会正确绘制
    document.body.appendChild(tempContainer);
    
    try {
      // 实例化 QRCode，它是同步执行 DOM 操作的
      new QRCode(tempContainer, {
        text: url,
        width: 256,
        height: 256,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.H
      });

      // 给一点时间让图片/Canvas渲染完成
      setTimeout(() => {
        try {
          // 尝试获取生成的 Canvas 或 Image
          const qrCanvas = tempContainer.querySelector('canvas');
          let qrImg = tempContainer.querySelector('img');

          if (qrCanvas) {
             // 如果有 canvas，直接使用
             drawToMainCanvas(qrCanvas, canvas, padding, colorLight);
             document.body.removeChild(tempContainer);
             resolve();
          } else if (qrImg) {
             // 如果是 img，等待加载
             if (qrImg.complete) {
               drawToMainCanvas(qrImg, canvas, padding, colorLight);
               document.body.removeChild(tempContainer);
               resolve();
             } else {
               qrImg.onload = () => {
                 drawToMainCanvas(qrImg, canvas, padding, colorLight);
                 document.body.removeChild(tempContainer);
                 resolve();
               };
               qrImg.onerror = () => {
                 document.body.removeChild(tempContainer);
                 reject(new Error('QR code image load failed'));
               };
             }
          } else {
             // 检查是否包含 data URI 图片但未被 querySelector 捕获 (罕见)
             // 尝试等待更长的时间或者检查 childNodes
             console.warn('No canvas or img found immediately, scanning children...');
             qrImg = tempContainer.getElementsByTagName('img')[0]; 
             // ... 如果还是没有，可能失败了
             document.body.removeChild(tempContainer);
             reject(new Error('QR code generation produced no output'));
          }
        } catch (err) {
          if (tempContainer.parentNode) document.body.removeChild(tempContainer);
          reject(err);
        }
      }, 50); // 50ms 延迟通常足够

    } catch (error) {
      if (tempContainer.parentNode) document.body.removeChild(tempContainer);
      reject(error);
    }
  });
}

function drawToMainCanvas(source, targetCanvas, padding, backgroundColor) {
  const ctx = targetCanvas.getContext('2d');
  // 计算尺寸
  const paddingPx = Math.round((padding / 100) * 256);
  const totalSize = 256 + paddingPx * 2;
  
  targetCanvas.width = totalSize;
  targetCanvas.height = totalSize;
  
  // 绘制背景色
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, totalSize, totalSize);
  
  // 绘制二维码（居中，带留白）
  ctx.drawImage(source, paddingPx, paddingPx, 256, 256);
}

// 生成二维码
async function generateQRCode(panel, url, colorDark = null, colorLight = null, padding = null) {
  const container = panel.querySelector('#qrcode-container');
  
  // 获取颜色设置
  if (!colorDark || !colorLight) {
    const colors = await getColorSettings();
    colorDark = colorDark || colors.colorDark;
    colorLight = colorLight || colors.colorLight;
  }
  
  // 获取留白设置
  if (padding === null) {
    const paddingSettings = await getPaddingSettings();
    padding = paddingSettings.padding;
  }
  
  // 清空容器
  container.innerHTML = '';
  
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

  container.appendChild(loadingState);

  setTimeout(async () => {
    try {
      // 检查URL长度
      if (url && url.length > 500) {
        throw new Error('URL太长，请使用较短的链接');
      }
      
      // 创建 canvas 用于显示带留白的二维码
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.maxWidth = '256px';
      canvas.style.maxHeight = '256px';
      canvas.style.objectFit = 'contain';
      
      await generateQRCodeWithPadding(canvas, url, colorDark, colorLight, padding);
      
      // 移除加载状态
      const loadingState = container.querySelector('.loading-state');
      if (loadingState) {
        loadingState.remove();
      }
      
      // 添加 canvas 到容器
      container.appendChild(canvas);
      
      // 保存 canvas 引用到容器，供下载使用
      container.dataset.qrCanvas = 'true';
      container.dataset.qrUrl = url;
      container.dataset.qrColorDark = colorDark;
      container.dataset.qrColorLight = colorLight;
      container.dataset.qrPadding = padding;
      
      // 添加下载功能
      setupDownloadHandler(panel);
      
    } catch (error) {
      console.error('QR Code generation failed:', error);
      const errorMsg = error.message.includes('overflow') 
        ? 'URL内容过长，无法生成二维码' 
        : error.message.includes('太长') 
          ? error.message 
          : chrome.i18n.getMessage("generateFailedText") || '生成二维码失败';
      
      container.innerHTML = `
        <div class="error-container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#d93025" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div class="error-message">${errorMsg}</div>
          <div class="error-hint">建议：使用短链接服务缩短URL</div>
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
  
  // 构建面板内容 - 使用左右分栏结构
  panel.innerHTML = `
    <button class="close-btn">&times;</button>
    <div class="panel-content">
      <div class="left-column">
        <div class="left-column-header">
          <h2 class="qr-title">${chrome.i18n.getMessage("qrGeneratorTitle") || "二维码生成器"}</h2>
        </div>
        
        <div class="left-column-content">
          <div id="qrcode-container"></div>
          <div class="url-container">
            <div id="url-display" contenteditable="true" role="textbox" aria-label="URL" placeholder="${url}"></div>
            <button class="copy-btn">${chrome.i18n.getMessage("copyButtonText")}</button>
            <div class="tooltip">${chrome.i18n.getMessage("copiedText")}</div>
          </div>
        </div>
        
        <div class="left-column-footer">
          <p class="version-info">v1.0.6</p>
        </div>
      </div>
      
      <div class="right-column">
        <div class="settings-header-wrapper">
          <h3 class="settings-header">${chrome.i18n.getMessage("settingsHeader") || "设置"}</h3>
        </div>
        
        <div class="settings-content">
          <div class="color-customizer">
            
            <div class="color-picker-group">
              <div class="color-picker-row">
                <label>${chrome.i18n.getMessage("foregroundColor")}:</label>
                <div class="color-input-container">
                  <input type="color" id="color-dark" value="#000000" class="color-input">
                  <input type="text" id="color-dark-text" value="#000000" class="color-text-input" maxlength="7">
                </div>
              </div>
              
              <div class="color-picker-row">
                <label>${chrome.i18n.getMessage("backgroundColor")}:</label>
                <div class="color-input-container">
                  <input type="color" id="color-light" value="#ffffff" class="color-input">
                  <input type="text" id="color-light-text" value="#ffffff" class="color-text-input" maxlength="7">
                </div>
              </div>
            </div>

            <div class="preset-colors">
              <div class="preset-label">${chrome.i18n.getMessage("presetColors")}:</div>
              <div class="preset-buttons">
                <button class="preset-btn" data-dark="#000000" data-light="#ffffff" title="${chrome.i18n.getMessage("classicBlackWhite")}">
                  <span class="preset-color-box" style="background: linear-gradient(135deg, #000000 0%, #000000 50%, #ffffff 50%, #ffffff 100%);"></span>
                </button>
                <button class="preset-btn" data-dark="#1a73e8" data-light="#ffffff" title="${chrome.i18n.getMessage("blueTheme")}">
                  <span class="preset-color-box" style="background: linear-gradient(135deg, #1a73e8 0%, #1a73e8 50%, #ffffff 50%, #ffffff 100%);"></span>
                </button>
                <button class="preset-btn" data-dark="#34a853" data-light="#ffffff" title="${chrome.i18n.getMessage("greenTheme")}">
                  <span class="preset-color-box" style="background: linear-gradient(135deg, #34a853 0%, #34a853 50%, #ffffff 50%, #ffffff 100%);"></span>
                </button>
                <button class="preset-btn" data-dark="#ea4335" data-light="#ffffff" title="${chrome.i18n.getMessage("redTheme")}">
                  <span class="preset-color-box" style="background: linear-gradient(135deg, #ea4335 0%, #ea4335 50%, #ffffff 50%, #ffffff 100%);"></span>
                </button>
                <button class="preset-btn" data-dark="#9334e6" data-light="#ffffff" title="${chrome.i18n.getMessage("purpleTheme")}">
                  <span class="preset-color-box" style="background: linear-gradient(135deg, #9334e6 0%, #9334e6 50%, #ffffff 50%, #ffffff 100%);"></span>
                </button>
              </div>
            </div>

            <div class="padding-control">
              <div class="padding-label">
                <span>${chrome.i18n.getMessage("paddingControl")}</span>
                <span class="padding-value" id="padding-value">0</span>
              </div>
              <input type="range" id="padding-slider" class="padding-slider" min="0" max="100" value="0" step="1">
              <div class="padding-preset-buttons">
                <button class="padding-preset-btn" data-padding="0" title="${chrome.i18n.getMessage("paddingNone")}">${chrome.i18n.getMessage("paddingNone")}</button>
                <button class="padding-preset-btn" data-padding="10" title="${chrome.i18n.getMessage("paddingSmall")}">${chrome.i18n.getMessage("paddingSmall")}</button>
                <button class="padding-preset-btn" data-padding="20" title="${chrome.i18n.getMessage("paddingMedium")}">${chrome.i18n.getMessage("paddingMedium")}</button>
                <button class="padding-preset-btn" data-padding="30" title="${chrome.i18n.getMessage("paddingLarge")}">${chrome.i18n.getMessage("paddingLarge")}</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <div class="reset-container">
            <button class="reset-color-btn" id="reset-color-btn">${chrome.i18n.getMessage("resetColor")}</button>
          </div>
        </div>
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
  
  // 设置URL编辑功能
  setupUrlEditor(panel, url);
  
  // 设置颜色选择器
  setupColorCustomizer(panel, url);
  
  // 生成二维码
  generateQRCode(panel, url);
}

// 添加下载功能
function setupDownloadHandler(panel) {
  const qrcodeContainer = panel.querySelector('#qrcode-container');
  const qrCanvas = qrcodeContainer.querySelector('canvas');
  
  // 如果已存在下载按钮，先移除
  const existingDownloadContainer = qrcodeContainer.querySelector('.download-container');
  if (existingDownloadContainer) {
    existingDownloadContainer.remove();
  }
  
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
      if (qrCanvas) {
        // 直接使用 canvas 数据
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `qrcode-${timestamp}.png`;
        link.href = qrCanvas.toDataURL('image/png');
        
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
      } else {
        throw new Error('QR code canvas not found');
      }
      
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

// 设置颜色自定义器
async function setupColorCustomizer(panel, url) {
  // 移除 toggleBtn 相关引用
  const colorDarkInput = panel.querySelector('#color-dark');
  const colorDarkText = panel.querySelector('#color-dark-text');
  const colorLightInput = panel.querySelector('#color-light');
  const colorLightText = panel.querySelector('#color-light-text');
  const resetBtn = panel.querySelector('#reset-color-btn');
  const presetBtns = panel.querySelectorAll('.preset-btn');
  
  // 加载保存的颜色设置
  const colors = await getColorSettings();
  colorDarkInput.value = colors.colorDark;
  colorDarkText.value = colors.colorDark;
  colorLightInput.value = colors.colorLight;
  colorLightText.value = colors.colorLight;
  
  // 加载保存的留白设置
  const paddingSettings = await getPaddingSettings();
  const paddingSlider = panel.querySelector('#padding-slider');
  const paddingValue = panel.querySelector('#padding-value');
  paddingSlider.value = paddingSettings.padding;
  paddingValue.textContent = paddingSettings.padding;
  
  // 更新推荐值按钮状态
  const paddingPresetBtns = panel.querySelectorAll('.padding-preset-btn');
  paddingPresetBtns.forEach(btn => {
    if (parseInt(btn.dataset.padding) === paddingSettings.padding) {
      btn.classList.add('active');
    }
  });
  
  // 防抖函数
  let debounceTimer = null;
  const debounceGenerate = (dark, light, padding = null) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const currentPadding = padding !== null ? padding : parseInt(paddingSlider.value);
      await generateQRCode(panel, url, dark, light, currentPadding);
      saveColorSettings(dark, light);
      if (padding !== null) {
        savePaddingSettings(padding);
      }
    }, 300);
  };
  
  // 移除切换颜色面板显示的代码
  
  // 颜色选择器变化
  colorDarkInput.addEventListener('input', (e) => {
    const value = e.target.value;
    colorDarkText.value = value;
    debounceGenerate(value, colorLightInput.value);
  });
  
  colorLightInput.addEventListener('input', (e) => {
    const value = e.target.value;
    colorLightText.value = value;
    debounceGenerate(colorDarkInput.value, value);
  });
  
  // 文本输入变化
  colorDarkText.addEventListener('input', (e) => {
    const value = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorDarkInput.value = value;
      debounceGenerate(value, colorLightInput.value);
    }
  });
  
  colorLightText.addEventListener('input', (e) => {
    const value = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorLightInput.value = value;
      debounceGenerate(colorDarkInput.value, value);
    }
  });
  
  // 预设颜色按钮
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dark = btn.dataset.dark;
      const light = btn.dataset.light;
      colorDarkInput.value = dark;
      colorDarkText.value = dark;
      colorLightInput.value = light;
      colorLightText.value = light;
      debounceGenerate(dark, light);
    });
  });
  
  // 重置按钮
  resetBtn.addEventListener('click', () => {
    const defaultDark = '#000000';
    const defaultLight = '#ffffff';
    colorDarkInput.value = defaultDark;
    colorDarkText.value = defaultDark;
    colorLightInput.value = defaultLight;
    colorLightText.value = defaultLight;
    generateQRCode(panel, url, defaultDark, defaultLight, 0);
    saveColorSettings(defaultDark, defaultLight);
    savePaddingSettings(0);
    paddingSlider.value = 0;
    paddingValue.textContent = '0';
    paddingPresetBtns.forEach(btn => btn.classList.remove('active'));
    paddingPresetBtns[0].classList.add('active');
  });
  
  // 留白滑块变化
  paddingSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    paddingValue.textContent = value;
    // 更新推荐值按钮状态
    paddingPresetBtns.forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.dataset.padding) === value) {
        btn.classList.add('active');
      }
    });
    debounceGenerate(colorDarkInput.value, colorLightInput.value, value);
  });
  
  // 推荐值按钮
  paddingPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const padding = parseInt(btn.dataset.padding);
      paddingSlider.value = padding;
      paddingValue.textContent = padding;
      // 更新按钮状态
      paddingPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      debounceGenerate(colorDarkInput.value, colorLightInput.value, padding);
    });
  });
}

