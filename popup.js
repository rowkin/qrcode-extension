document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      // 使用统一的消息机制
      chrome.runtime.sendMessage({
        action: 'showQRCode',
        tabId: tabs[0].id,
        url: tabs[0].url
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
        } else if (!response.success) {
          console.error('Failed:', response.error);
        }
        window.close();
      });
    }
  });
});
