import { Component, effect, input } from '@angular/core';
import { PRICE_CHECK_FULL_HEIGHT } from '../../src/app/constants';
import { settings } from '../../src/app/core/settings';
import { host } from '../../src/app/host';
import { themeById } from '../../src/app/themes';
import type { BaseType } from '@/assets/data';
import { TranslatePipe } from '../../src/app/core/i18n';
import { AptTitleBar } from './apt-title-bar';

/** "Which one?" for an unidentified unique, as APT asks it (`UnidentifiedResolver.vue`). */
@Component({
  selector: 'app-apt-unidentified-picker',
  imports: [TranslatePipe, AptTitleBar],
  template: `
    <apt-title-bar />
    <div class="flex min-h-0 grow flex-col bg-[#2d3748]">
      <div class="m-4 rounded bg-[#1a202c] px-2 py-1">{{ 'item.identification' | t: baseName() }}</div>
      <div class="grid grid-cols-2 gap-2 overflow-auto px-4 pb-4">
        @for (unique of variants(); track unique.refName) {
          <div class="flex">
            <button class="flex w-full items-center gap-x-3 rounded bg-[#4a5568] p-2" (click)="pick()(unique)">
              <img [src]="unique.icon" alt="" class="w-12" />
              <div class="text-left leading-tight">{{ unique.name }}</div>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  host: { class: 'apt-price-check relative flex min-h-0 flex-1 flex-col' },
})
export class AptUnidentifiedPicker {
  readonly baseName = input.required<string>();
  readonly variants = input.required<BaseType[]>();
  /** The popup's callback: the theme's picker is created with NgComponentOutlet, which has no outputs. */
  readonly pick = input.required<(unique: BaseType) => void>();

  constructor() {
    // The same window as the price check: 460 px wide, as tall as the game.
    effect(() => {
      this.variants();
      void host.fitPopup(themeById(settings().theme).priceCheckSize?.width ?? 460, PRICE_CHECK_FULL_HEIGHT);
    });
  }
}
