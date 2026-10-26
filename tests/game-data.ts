import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { init, setDataSource } from '@/assets/data';

const dataPath = (path: string) => fileURLToPath(new URL(`../public/data/${path}`, import.meta.url));

let loading: Promise<void> | undefined;

/** Loads public/data from disk, the way the app loads it over HTTP. */
export function loadGameDataFromDisk(): Promise<void> {
  if (!loading) {
    setDataSource({
      text: (path) => readFile(dataPath(path), 'utf-8'),
      binary: async (path) => {
        const buf = await readFile(dataPath(path));
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      },
      // client_strings.js is an ES module; import it without a package.json "type".
      clientStrings: async (path) => {
        const code = await readFile(dataPath(path), 'utf-8');
        const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
        return (await import(/* @vite-ignore */ url)).default;
      },
    });
    loading = init('en');
  }
  return loading;
}
