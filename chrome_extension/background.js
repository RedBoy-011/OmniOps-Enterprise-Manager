// OmniOps Chrome Extension Background Service Worker (Manifest V3)
// Communicates with Local Windows Agent (ws://127.0.0.1:8443) and Central Server

const AGENT_WS_URL = "ws://127.0.0.1:8443/chrome-bridge";
const DEFAULT_SERVER_URL = "http://localhost:8080";
let agentSocket = null;
let isConnectedToAgent = false;

console.log("[OmniOps Extension] Background Service Worker initialized.");

function connectToLocalAgent() {
  try {
    agentSocket = new WebSocket(AGENT_WS_URL);

    agentSocket.onopen = () => {
      isConnectedToAgent = true;
      console.log("[OmniOps Extension] Connected to Local Windows Agent via WebSocket.");
      chrome.action.setBadgeText({ text: "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" }); // Emerald Green
      
      // Send handshake
      agentSocket.send(JSON.stringify({
        type: "HANDSHAKE",
        source: "chrome_extension",
        version: "2.4.1",
        timestamp: new Date().toISOString()
      }));
    };

    agentSocket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("[OmniOps Extension] Received command from agent:", message);
        handleAgentCommand(message);
      } catch (err) {
        console.error("[OmniOps Extension] Error parsing agent message:", err);
      }
    };

    agentSocket.onclose = () => {
      isConnectedToAgent = false;
      chrome.action.setBadgeText({ text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red
      console.log("[OmniOps Extension] Disconnected from agent. Retrying in 5s...");
      setTimeout(connectToLocalAgent, 5000);
    };

    agentSocket.onerror = (err) => {
      isConnectedToAgent = false;
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" }); // Amber
    };
  } catch (e) {
    console.warn("[OmniOps Extension] Local Agent not running on port 8443. Retrying in 8s...");
    setTimeout(connectToLocalAgent, 8000);
  }
}

// Execute commands received from Local Agent / Central Server
async function handleAgentCommand(cmd) {
  const { command, url, script, selector, task_id } = cmd;

  if (command === "navigate" && url) {
    const tab = await chrome.tabs.create({ url, active: true });
    respondToAgent({ task_id, status: "success", tab_id: tab.id, current_url: url });
  } else if (command === "screenshot") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      respondToAgent({ task_id, status: "success", screenshot_data: dataUrl });
    });
  } else if (command === "get_dom") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_DATA" }, (response) => {
        respondToAgent({ task_id, status: "success", page_data: response });
      });
    }
  } else if (command === "click_element" && selector) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "CLICK", selector }, (response) => {
        respondToAgent({ task_id, status: response?.success ? "success" : "failed", details: response });
      });
    }
  }
}

function respondToAgent(payload) {
  if (agentSocket && agentSocket.readyState === WebSocket.OPEN) {
    agentSocket.send(JSON.stringify(payload));
  }
}

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_STATUS") {
    sendResponse({
      connected_to_agent: isConnectedToAgent,
      agent_url: AGENT_WS_URL,
      extension_version: "2.4.1"
    });
  } else if (request.action === "RECONNECT_AGENT") {
    connectToLocalAgent();
    sendResponse({ status: "reconnecting" });
  }
  return true;
});

// Initial connection
connectToLocalAgent();
