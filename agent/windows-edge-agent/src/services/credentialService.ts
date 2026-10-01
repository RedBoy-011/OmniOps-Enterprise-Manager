export interface Credentials {
  masterUrl: string;
  exchangeToken: string;
}

/**
 * Modiriate zakhire va bazyabi kelidha dar Windows Credential Manager
 * az tarighe Tauri Bridge ya Fallback-e LocalStorage
 */
export async function saveCredentials(masterUrl: string, exchangeToken: string): Promise<void> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_omni_credentials', { masterUrl, exchangeToken });
  } catch (err) {
    // Agar dar mohite web ya test bashe
    localStorage.setItem('omni_master_url', masterUrl);
    localStorage.setItem('omni_exchange_token', exchangeToken);
  }
}

export async function getStoredCredentials(): Promise<Credentials> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const creds = await invoke<any>('load_omni_credentials');
    return {
      masterUrl: creds.master_url || 'http://localhost:3000',
      exchangeToken: creds.exchange_token || '',
    };
  } catch {
    return {
      masterUrl: localStorage.getItem('omni_master_url') || 'http://localhost:3000',
      exchangeToken: localStorage.getItem('omni_exchange_token') || 'omni_sec_tok_master_default',
    };
  }
}
