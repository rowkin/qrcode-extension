// 获取用户的首选语言
function getUserLanguage() {
  return navigator.language.split('-')[0] || 'en';
}

// 根据语言获取消息
function getI18nMessage(key) {
  return chrome.i18n.getMessage(key) || key;
}

// 导出工具函数
export { getUserLanguage, getI18nMessage };