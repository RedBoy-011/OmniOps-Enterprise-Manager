/// <reference types="vite/client" />

declare module '@tauri-apps/api/core' {
  export function invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T>;
}
