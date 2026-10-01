import { getStoredCredentials } from './credentialService';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OmniStreamCallbacks {
  onToken: (token: string) => void;
  onCommandDetected: (action: string, command: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

/**
 * Ersale darkhast-haye LLM be Master Server-e OmniOps bejaye Cloud APIs (OpenAI/Anthropic)
 * Ba poshtibani az SSE Streaming va Automatic Token Auth
 */
export async function streamOmniChat(
  messages: ChatMessage[],
  callbacks: OmniStreamCallbacks
): Promise<() => void> {
  const controller = new AbortController();

  try {
    const creds = await getStoredCredentials();
    if (!creds.masterUrl || !creds.exchangeToken) {
      throw new Error('Tanzimate Master Server ya Exchange Token tanzim nashode ast!');
    }

    const baseUrl = creds.masterUrl.replace(/\/+$/, '');
    const endpoint = `${baseUrl}/v1/chat`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.exchangeToken}`,
        'X-Agent-Client': 'OmniOps-Windows-Edge-Agent/v2.4',
        'X-Platform': 'Windows-NT'
      },
      body: JSON.stringify({
        messages,
        stream: true,
        edge_metadata: {
          os: 'Windows 11 Enterprise',
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'win-edge-node',
          capabilities: ['POWERSHELL', 'CMD', 'REGISTRY', 'SERVICE_CONTROL']
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OmniOps Master Server Error [${response.status}]: ${errText}`);
    }

    if (!response.body) {
      throw new Error('Response body khali ast (No Stream support)');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                callbacks.onDone();
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const chunk = parsed.choices?.[0]?.delta?.content || parsed.token || '';
                if (chunk) {
                  callbacks.onToken(chunk);
                }
              } catch {
                callbacks.onToken(dataStr);
              }
            }
          }
        }
        callbacks.onDone();
      } catch (streamErr: any) {
        if (streamErr.name !== 'AbortError') {
          callbacks.onError(streamErr.message || 'Stream connection interrupted');
        }
      }
    })();

  } catch (error: any) {
    callbacks.onError(error.message || 'Khataye ertebat ba OmniOps Master');
  }

  return () => controller.abort();
}
