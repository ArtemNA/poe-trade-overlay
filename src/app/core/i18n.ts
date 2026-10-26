import { Pipe, PipeTransform, signal } from '@angular/core';
import { DATA_PATH, DEFAULT_LANG, Lang } from '../constants';

// UI strings come from APT's public/data/<lang>/app_i18n.json, so keys match APT and
// adding a language means adding its file. Nested objects flatten to dotted keys.
const dict = signal<Record<string, string>>({});

function flatten(obj: Record<string, unknown>, prefix = '', out: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value as Record<string, unknown>, path, out);
    else out[path] = String(value);
  }
  return out;
}

export async function loadI18n(lang: Lang = DEFAULT_LANG): Promise<void> {
  const url = new URL(`${DATA_PATH}/${lang}/app_i18n.json`, document.baseURI).href;
  dict.set(flatten(await (await fetch(url)).json()));
}

/** Translates `key`, replacing `{0}`, `{1}`… with `args`. Missing keys are returned as is. */
export function t(key: string, ...args: Array<string | number>): string {
  const text = dict()[key] ?? key;
  return args.length ? text.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? '')) : text;
}

@Pipe({ name: 't' })
export class TranslatePipe implements PipeTransform {
  transform(key: string, ...args: Array<string | number>): string {
    return t(key, ...args);
  }
}
