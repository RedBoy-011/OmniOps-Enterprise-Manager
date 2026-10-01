/**
 * Safe runtime bridge for Tauri 2 commands
 * Invokes native Rust commands through WebView injection without bundling dependencies
 */
export async function invokeTauri<T = any>(command: string, args?: Record<string, any>): Promise<T> {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__TAURI_INTERNALS__ && typeof win.__TAURI_INTERNALS__.invoke === 'function') {
      return win.__TAURI_INTERNALS__.invoke(command, args);
    }
    if (win.__TAURI__?.core && typeof win.__TAURI__.core.invoke === 'function') {
      return win.__TAURI__.core.invoke(command, args);
    }
  }
  throw new Error('Tauri bridge not found in current environment (running in web preview/test mode)');
}
