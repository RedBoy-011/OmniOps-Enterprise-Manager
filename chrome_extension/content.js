// OmniOps Chrome Extension - Content Script
// Injected into webpages to inspect DOM, interact with buttons, and extract tables

console.log("[OmniOps] Content script active on:", window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PAGE_DATA") {
    sendResponse({
      title: document.title,
      url: window.location.href,
      text_snippet: document.body.innerText.slice(0, 3000),
      forms_count: document.forms.length,
      links_count: document.querySelectorAll("a").length
    });
  } else if (request.action === "CLICK" && request.selector) {
    try {
      const el = document.querySelector(request.selector);
      if (el) {
        el.click();
        sendResponse({ success: true, message: `Clicked ${request.selector}` });
      } else {
        sendResponse({ success: false, error: `Element ${request.selector} not found` });
      }
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
  }
  return true;
});
