// MeOS Chrome Extension Content Script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_MEOS_TOKEN') {
    // zustand persist 把 token 存在页面的 localStorage（键 meos-auth）里
    try {
      const raw = localStorage.getItem('meos-auth');
      const parsed = raw ? JSON.parse(raw) : null;
      sendResponse({ token: parsed?.state?.token || null });
    } catch {
      sendResponse({ token: null });
    }
    return true;
  }

  if (message.type === 'OPEN_MEOS') {
    chrome.runtime.sendMessage({ type: 'GET_EXTENSION_ID' }, (response) => {
      if (response && response.extensionId) {
        chrome.tabs.create({
          url: chrome.runtime.getURL('index.html'),
        });
      }
    });
  }
  return true;
});