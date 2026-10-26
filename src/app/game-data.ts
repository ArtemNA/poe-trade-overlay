import { init, setDataSource, type DataSource } from '@/assets/data';

/** Game data language. Only EN is shipped for now; add a folder in public/data to support more. */
export type Lang = 'en';

const dataUrl = (path: string) => new URL(`data/${path}`, document.baseURI).href;

async function get(path: string): Promise<Response> {
  const response = await fetch(dataUrl(path));
  if (!response.ok) {
    throw new Error(`Failed to load game data "${path}": HTTP ${response.status}`);
  }
  return response;
}

const browserSource: DataSource = {
  text: async (path) => (await get(path)).text(),
  binary: async (path) => (await get(path)).arrayBuffer(),
  // client_strings.js holds RegExps, so it is a JS module rather than JSON.
  clientStrings: async (path) => (await import(/* @vite-ignore */ dataUrl(path))).default,
};

let loading: Promise<void> | undefined;

/** Loads items, stats and client strings once; parsing items requires it. */
export function loadGameData(lang: Lang = 'en'): Promise<void> {
  if (!loading) {
    setDataSource(browserSource);
    loading = init(lang);
  }
  return loading;
}
