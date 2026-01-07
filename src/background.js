// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// 统一的创建菜单函数
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    // 创建父级菜单
    chrome.contextMenus.create({
      id: "qrcodeParent",
      title: chrome.i18n.getMessage("contextMenuParent"),
      contexts: ["page", "selection", "link", "image"]
    });

    let 测试翻译
    
    // 创建"生成二维码"子菜单
    chrome.contextMenus.create({
      id: "generateQRCode",
      parentId: "qrcodeParent",
      title: chrome.i18n.getMessage("contextMenuGenerate"),
      contexts: ["page", "selection", "link"]
    });
    
    // 创建"识别二维码"子菜单（仅在图片上显示）
    chrome.contextMenus.create({
      id: "recognizeQRCode",
      parentId: "qrcodeParent",
      title: chrome.i18n.getMessage("contextMenuRecognize"),
      contexts: ["image"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('创建菜单出错:', chrome.runtime.lastError);
      }
    });
  });
}

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateQRCode") {
    let url = '';
    if (info.selectionText) {
      url = info.selectionText;
    } else if (info.linkUrl) {
      url = info.linkUrl;
    } else {
      url = info.pageUrl;
    }
    
    showQRCode(tab.id, url);
  } else if (info.menuItemId === "recognizeQRCode") {
    // 处理识别二维码
    if (info.srcUrl) {
      recognizeQRCodeFromImage(tab.id, info.srcUrl);
    }
  }
});

// 处理来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showQRCode') {
    showQRCode(request.tabId, request.url)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
    console.error('Failed to show QR code:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 表明我们会异步发送响应
  }
});

// 统一的显示二维码函数
async function showQRCode(tabId, url) {
  try {
    // 检查页面中是否已经注入了必要的脚本
    const [{ result: hasQRCode }] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => typeof QRCode !== 'undefined'
    });

    if (!hasQRCode) {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['qrcode.min.js']
      });
}

    // 注入内容脚本并显示面板
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-script.js']
    });

    // 发送消息给内容脚本
    await chrome.tabs.sendMessage(tabId, {
      action: 'generateQRCode',
      url: url
    });

  } catch (error) {
    console.error('Failed to show QR code:', error);
    throw error;
  }
}

// 确保扩展更新或重新加载时重新创建菜单
chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

// 识别图片中的二维码
async function recognizeQRCodeFromImage(tabId, imageUrl) {
  try {
    // 检查页面中是否已经注入了 jsQR 库
    const [{ result: hasJsQR }] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => typeof jsQR !== 'undefined'
    });

    if (!hasJsQR) {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['jsQR.min.js']
      });
    }

    // 注入内容脚本
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-script.js']
    });

    // 发送消息给内容脚本进行识别
    await chrome.tabs.sendMessage(tabId, {
      action: 'recognizeQRCode',
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('Failed to recognize QR code:', error);
    throw error;
  }
}