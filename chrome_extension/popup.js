// OmniOps Popup UI Script
document.addEventListener("DOMContentLoaded", () => {
  const agentBadge = document.getElementById("agentBadge");
  const agentStatus = document.getElementById("agentStatus");
  const activeTabTitle = document.getElementById("activeTabTitle");
  const btnReconnect = document.getElementById("btnReconnect");
  const btnOpenDashboard = document.getElementById("btnOpenDashboard");

  function checkStatus() {
    chrome.runtime.sendMessage({ action: "GET_STATUS" }, (response) => {
      if (response && response.connected_to_agent) {
        agentBadge.textContent = "متصل";
        agentBadge.className = "badge badge-online";
        agentStatus.textContent = "آنلاین (Port 8443)";
        agentStatus.style.color = "#34d399";
      } else {
        agentBadge.textContent = "عدم اتصال";
        agentBadge.className = "badge badge-offline";
        agentStatus.textContent = "سرویس ایجنت متوقف است";
        agentStatus.style.color = "#f87171";
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        activeTabTitle.textContent = tabs[0].title || tabs[0].url || "-";
      }
    });
  }

  btnReconnect.addEventListener("click", () => {
    btnReconnect.textContent = "در حال تلاش مجدد...";
    chrome.runtime.sendMessage({ action: "RECONNECT_AGENT" }, () => {
      setTimeout(() => {
        checkStatus();
        btnReconnect.textContent = "تست و اتصال مجدد به ایجنت";
      }, 1000);
    });
  });

  btnOpenDashboard.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000" });
  });

  checkStatus();
});
