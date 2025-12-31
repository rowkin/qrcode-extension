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
      }
      
      .panel-content {
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
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
      
      #qrcode-container {
        margin: 20px auto;
        padding: 10px;
        background: white;
        width: 100%;
        max-width: 256px;
        height: 256px;
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
        box-sizing: border-box;
      }
      
      .url-container {
        width: 100%;
        max-width: 300px;
        margin: 10px auto;
        position: relative;
        display: flex;
        align-items: flex-start;
        background: #f5f5f5;
        border-radius: 4px;
        padding: 8px 8px 20px;
        box-sizing: border-box;
      }
      
      #url-display {
        word-break: break-all;
        font-size: 13px;
        color: #333;
        text-align: left;
        flex-grow: 1;
        cursor: text;
        user-select: text;
        padding: 4px;
        margin-right: 8px;
        min-height: 20px;
        border: 1px solid transparent;
        border-radius: 2px;
        outline: none;
        background: transparent;
        resize: none;
        overflow-wrap: break-word;
        white-space: pre-wrap;
      }
      
      #url-display:focus {
        border-color: #1a73e8;
        background: white;
        outline: none;
      }
      
      #url-display:empty:before {
        content: attr(placeholder);
        color: #999;
      }
      
      .copy-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        background: #1a73e8;
        color: white;
        border: none;
        padding: 4px 12px;
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
      .color-customizer {
        width: 100%;
        max-width: 300px;
        margin: 15px auto 0;
        border-top: 1px solid #e0e0e0;
        padding-top: 15px;
        box-sizing: border-box;
      }
      
      .color-toggle-btn {
        width: 100%;
        padding: 8px 12px;
        background: #f5f5f5;
        border: 1px solid #dadce0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        color: #5f6368;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s;
        box-sizing: border-box;
      }
      
      .color-toggle-btn:hover {
        background: #e8eaed;
      }
      
      .toggle-icon {
        transition: transform 0.3s;
        font-size: 10px;
      }
      
      .color-toggle-btn.expanded .toggle-icon {
        transform: rotate(180deg);
      }
      
      .color-picker-panel {
        margin-top: 8px;
        padding: 10px;
        background: #fafafa;
        border-radius: 4px;
        animation: slideDown 0.3s ease;
        box-sizing: border-box;
        overflow: hidden;
        width: 100%;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .color-picker-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      
      .color-picker-row:last-child {
        margin-bottom: 0;
      }
      
      .color-picker-row label {
        width: 70px;
        font-size: 12px;
        color: #5f6368;
        flex-shrink: 0;
        min-width: 70px;
      }
      
      .color-input-group {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }
      
      .color-input {
        width: 40px;
        height: 28px;
        border: 1px solid #dadce0;
        border-radius: 3px;
        cursor: pointer;
        padding: 0;
      }
      
      .color-text-input {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid #dadce0;
        border-radius: 3px;
        font-size: 12px;
        font-family: monospace;
        min-width: 0;
      }
      
      .color-text-input:focus {
        outline: none;
        border-color: #1a73e8;
      }
      
      .preset-colors {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }
      
      .preset-label {
        font-size: 12px;
        color: #5f6368;
        margin-bottom: 8px;
      }
      
      .preset-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        width: 100%;
        box-sizing: border-box;
      }
      
      .padding-control {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      }
      
      .padding-label {
        font-size: 11px;
        color: #5f6368;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 500;
      }
      
      .padding-value {
        font-size: 11px;
        color: #1a73e8;
        font-weight: 600;
        min-width: 30px;
        text-align: right;
      }
      
      .padding-slider-container {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }
      
      .padding-slider {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: #e0e0e0;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }
      
      .padding-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #1a73e8;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .padding-slider::-webkit-slider-thumb:hover {
        background: #1557b0;
        transform: scale(1.15);
      }
      
      .padding-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #1a73e8;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .padding-slider::-moz-range-thumb:hover {
        background: #1557b0;
        transform: scale(1.15);
      }
      
      .padding-preset-buttons {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      
      .padding-preset-btn {
        padding: 3px 10px;
        font-size: 10px;
        background: white;
        border: 1px solid #dadce0;
        border-radius: 3px;
        cursor: pointer;
        color: #5f6368;
        transition: all 0.2s;
        white-space: nowrap;
      }
      
      .padding-preset-btn:hover {
        background: #f5f5f5;
        border-color: #1a73e8;
        color: #1a73e8;
      }
      
      .padding-preset-btn.active {
        background: #1a73e8;
        border-color: #1a73e8;
        color: white;
      }
      
      /* 设置项分组样式 - 为未来扩展准备 */
      .settings-group {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      }
      
      .settings-group:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }
      
      .settings-group-title {
        font-size: 11px;
        color: #5f6368;
        margin-bottom: 6px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .preset-btn {
        width: 36px;
        height: 36px;
        border: 2px solid #dadce0;
        border-radius: 4px;
        cursor: pointer;
        padding: 2px;
        background: white;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .preset-btn:hover {
        border-color: #1a73e8;
        transform: scale(1.1);
      }
      
      .preset-color-box {
        width: 100%;
        height: 100%;
        border-radius: 2px;
        display: block;
      }
      
      .color-actions {
        margin-top: 8px;
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }
      
      .reset-color-btn {
        padding: 4px 12px;
        background: white;
        border: 1px solid #dadce0;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        color: #5f6368;
        transition: all 0.2s;
      }
      
      .reset-color-btn:hover {
        background: #f5f5f5;
        border-color: #1a73e8;
        color: #1a73e8;
      }
      
      @media (max-width: 768px) {
        #qrcode-floating-panel {
          width: 90%;
          min-width: auto;
          max-width: 350px;
        }
        
        .panel-content {
          max-width: 100%;
        }
        
        .url-container {
          width: 100%;
          max-width: 100%;
        }
        
        #qrcode-container {
          width: 100%;
          max-width: 256px;
        }
        
        .color-customizer {
          width: 100%;
          max-width: 100%;
        }
        
        .color-picker-row {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .color-picker-row label {
          width: 100%;
          margin-bottom: 6px;
        }
        
        .color-input-group {
          width: 100%;
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
      width: 100%;
      max-width: 256px;
      height: 256px;
      margin: 20px auto;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
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
    chrome.storage.local.get(['qrColorDark', 'qrColorLight'], (result) => {
      resolve({
        colorDark: result.qrColorDark || '#000000',
        colorLight: result.qrColorLight || '#ffffff'
      });
    });
  });
}

// 保存颜色设置
function saveColorSettings(colorDark, colorLight) {
  chrome.storage.local.set({
    qrColorDark: colorDark,
    qrColorLight: colorLight
  });
}

// 获取留白设置
async function getPaddingSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['qrPadding'], (result) => {
      resolve({
        padding: result.qrPadding !== undefined ? result.qrPadding : 0
      });
    });
  });
}

// 保存留白设置
function savePaddingSettings(padding) {
  chrome.storage.local.set({
    qrPadding: padding
  });
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
    document.body.appendChild(tempContainer);
    
    let qrCodeInstance = null;
    let resolved = false;
    
    // 超时处理
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (tempContainer.parentNode) {
          document.body.removeChild(tempContainer);
        }
        reject(new Error('QR code generation timeout'));
      }
    }, 10000);
    
    try {
      qrCodeInstance = new QRCode(tempContainer, {
        text: url,
        width: 256,
        height: 256,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.H,
        onRender: () => {
          // 使用轮询检查图片是否已加载
          const checkImage = setInterval(() => {
            const qrImg = tempContainer.querySelector('img');
            if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
              clearInterval(checkImage);
              clearTimeout(timeout);
              
              if (resolved) return;
              resolved = true;
              
              try {
                const ctx = canvas.getContext('2d');
                const paddingPx = Math.round((padding / 100) * 256);
                const totalSize = 256 + paddingPx * 2;
                
                canvas.width = totalSize;
                canvas.height = totalSize;
                
                // 绘制背景色
                ctx.fillStyle = colorLight;
                ctx.fillRect(0, 0, totalSize, totalSize);
                
                // 绘制二维码（居中，带留白）
                ctx.drawImage(qrImg, paddingPx, paddingPx, 256, 256);
                
                // 清理临时容器
                if (tempContainer.parentNode) {
                  document.body.removeChild(tempContainer);
                }
                resolve();
              } catch (error) {
                if (tempContainer.parentNode) {
                  document.body.removeChild(tempContainer);
                }
                reject(error);
              }
            }
          }, 50);
          
          // 5秒后如果还没加载完，清除检查
          setTimeout(() => {
            clearInterval(checkImage);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              if (tempContainer.parentNode) {
                document.body.removeChild(tempContainer);
              }
              reject(new Error('QR code image load timeout'));
            }
          }, 5000);
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      if (tempContainer.parentNode) {
        document.body.removeChild(tempContainer);
      }
      reject(error);
    }
  });
}

// 生成二维码
async function generateQRCode(panel, url, colorDark = null, colorLight = null, padding = null) {
  const container = panel.querySelector('#qrcode-container');
  if (!container) {
    console.error('QR code container not found');
    return;
  }
  
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

  try {
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
        <div id="url-display" contenteditable="true" role="textbox" aria-label="URL" placeholder="${url}"></div>
        <button class="copy-btn">${chrome.i18n.getMessage("copyButtonText")}</button>
        <div class="tooltip">${chrome.i18n.getMessage("copiedText")}</div>
      </div>
      <div class="color-customizer">
        <button class="color-toggle-btn" id="color-toggle-btn">
          ${chrome.i18n.getMessage("customizeColor")} <span class="toggle-icon">▼</span>
        </button>
        <div class="color-picker-panel" id="color-picker-panel" style="display: none;">
          <div class="color-picker-row">
            <label>${chrome.i18n.getMessage("foregroundColor")}:</label>
            <div class="color-input-group">
              <input type="color" id="color-dark" value="#000000" class="color-input">
              <input type="text" id="color-dark-text" value="#000000" class="color-text-input" maxlength="7">
            </div>
          </div>
          <div class="color-picker-row">
            <label>${chrome.i18n.getMessage("backgroundColor")}:</label>
            <div class="color-input-group">
              <input type="color" id="color-light" value="#ffffff" class="color-input">
              <input type="text" id="color-light-text" value="#ffffff" class="color-text-input" maxlength="7">
            </div>
          </div>
          <div class="settings-group">
            <div class="settings-group-title">${chrome.i18n.getMessage("presetColors")}</div>
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
          <div class="settings-group">
            <div class="settings-group-title">${chrome.i18n.getMessage("paddingControl")}</div>
            <div class="padding-label">
              <span>${chrome.i18n.getMessage("paddingValue")}</span>
              <span class="padding-value" id="padding-value">0</span>
            </div>
            <div class="padding-slider-container">
              <input type="range" id="padding-slider" class="padding-slider" min="0" max="100" value="0" step="1">
            </div>
            <div class="padding-preset-buttons">
              <button class="padding-preset-btn" data-padding="0" title="${chrome.i18n.getMessage("paddingNone")}">${chrome.i18n.getMessage("paddingNone")}</button>
              <button class="padding-preset-btn" data-padding="10" title="${chrome.i18n.getMessage("paddingSmall")}">${chrome.i18n.getMessage("paddingSmall")}</button>
              <button class="padding-preset-btn" data-padding="20" title="${chrome.i18n.getMessage("paddingMedium")}">${chrome.i18n.getMessage("paddingMedium")}</button>
              <button class="padding-preset-btn" data-padding="30" title="${chrome.i18n.getMessage("paddingLarge")}">${chrome.i18n.getMessage("paddingLarge")}</button>
            </div>
          </div>
          <div class="color-actions">
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
  const toggleBtn = panel.querySelector('#color-toggle-btn');
  const colorPanel = panel.querySelector('#color-picker-panel');
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
  
  // 切换颜色面板显示
  toggleBtn.addEventListener('click', () => {
    const isExpanded = colorPanel.style.display !== 'none';
    colorPanel.style.display = isExpanded ? 'none' : 'block';
    toggleBtn.classList.toggle('expanded', !isExpanded);
  });
  
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

