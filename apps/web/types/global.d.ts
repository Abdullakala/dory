declare module '*.wasm?url' {
  const url: string;
  export default url;
}
declare module '*.worker.js?url' {
  const url: string;
  export default url;
}

declare module 'ssh2';
declare module 'ssh2-no-cpu-features';

type AuthBridge = {
  openExternal: (url: string) => Promise<void>;
  onCallback: (callback: (url: string) => void) => () => void;
};

interface Window {
  authBridge?: AuthBridge;
  themeBridge?: {
    getTheme: () => Promise<'light' | 'dark' | 'system'>;
    setTheme: (theme: 'light' | 'dark' | 'system') => Promise<'light' | 'dark' | 'system'>;
    onThemeChanged: (callback: (theme: 'light' | 'dark' | 'system') => void) => () => void;
  };
  electron?: {
    platform: string;
    isPackaged: boolean;
  };
}
