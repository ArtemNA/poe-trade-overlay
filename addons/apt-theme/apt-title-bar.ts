import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { currencyRates } from '../../src/app/core/currency-rates';
import { TrPipe } from '../../src/app/core/i18n';
import { Leagues } from '../../src/app/core/leagues';
import { settings } from '../../src/app/core/settings';
import { host } from '../../src/app/host';
import { Currency } from '../../src/app/shared/currency';
import { AptIcon } from './apt-icon';

/**
 * APT's title bar (`AppTitlebar.vue` + the "⇄ 359" popover of `PriceCheckWindow.vue`): 24 px,
 * gray-900, gray-600 text; the divine price on the left, the league in the middle, close on the
 * right. The league opens our league menu (APT opens its settings there).
 */
@Component({
  selector: 'apt-title-bar',
  imports: [AptIcon, Currency, TrPipe],
  template: `
    <div class="apt-titlebar">
      @if (divine(); as rate) {
        <button class="whitespace-nowrap" [class.apt-titlebar-open]="menu() === 'divine'" (click)="toggle('divine')">
          <apt-icon name="exchange" /> {{ round(rate) }}
        </button>
      } @else {
        <div class="w-8"></div>
      }
      <button class="truncate" [class.apt-titlebar-open]="menu() === 'league'" (click)="toggle('league')">
        {{ settings().leagueId ?? ('No league' | tr) }}
      </button>
      <button class="apt-titlebar-close" tabindex="-1" [title]="'Close' | tr" (click)="close()"><apt-icon name="window-close" /></button>
    </div>

    @if (menu() === 'divine' && divine(); as rate) {
      <div class="apt-tippy absolute top-[30px] left-1 z-30">
        <div class="apt-tippy-arrow left-4"></div>
        <div class="flex items-center gap-x-1 text-base">
          <div class="flex size-8 flex-none items-center justify-center"><app-currency tag="divine" [size]="32" /></div>
          <apt-icon name="arrow-right" class="px-1 text-sm text-[#718096]" />
          <span class="whitespace-nowrap">{{ round(rate) }}<span class="apt-sans"> ×</span></span>
          <div class="flex size-8 flex-none items-center justify-center"><app-currency tag="chaos" [size]="32" /></div>
        </div>
        @for (i of tenths; track i) {
          <div class="pl-1">{{ i / 10 }} div ⇒ {{ round((rate * i) / 10) }} c</div>
        }
      </div>
    }

    @if (menu() === 'league') {
      <div class="apt-tippy absolute top-[30px] left-1/2 z-30 min-w-40 -translate-x-1/2 px-0! py-1!">
        <div class="apt-tippy-arrow left-1/2 -translate-x-1/2"></div>
        @for (league of leagues.list(); track league.id) {
          <button class="block w-full px-3 py-0.5 text-left whitespace-nowrap hover:bg-[#e2e8f0]" [class.font-bold]="league.id === settings().leagueId"
            (click)="selectLeague(league.id)">{{ league.id }}</button>
        } @empty {
          <span class="block px-3 py-0.5 whitespace-nowrap">{{ leagues.error() ?? ('Loading leagues…' | tr) }}</span>
        }
      </div>
    }
  `,
  host: { class: 'relative block flex-none', '(document:mousedown)': 'outside($event)' },
})
export class AptTitleBar {
  private readonly element = inject(ElementRef<HTMLElement>);

  /** A click anywhere else closes the popover, as tippy does. */
  protected outside(event: MouseEvent): void {
    if (this.menu() && !this.element.nativeElement.contains(event.target as Node)) this.menu.set(null);
  }

  protected readonly settings = settings;
  protected readonly leagues = inject(Leagues);
  protected readonly divine = computed(() => currencyRates.divine());
  protected readonly menu = signal<'divine' | 'league' | null>(null);
  protected readonly tenths = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  protected round(value: number): number {
    return Math.round(value);
  }

  protected toggle(menu: 'divine' | 'league'): void {
    this.menu.update((open) => (open === menu ? null : menu));
  }

  protected selectLeague(id: string): void {
    this.leagues.select(id);
    this.menu.set(null);
  }

  protected close(): void {
    this.menu.set(null);
    host.hidePopup();
  }
}
