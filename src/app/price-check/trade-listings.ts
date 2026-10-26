import { Component, input } from '@angular/core';
import { PRICE_CHECK_DEFAULTS } from '../constants';
import { TranslatePipe } from '../core/i18n';
import type { GroupedResult, TradeSearch } from './trade-search';

/** Trade listings table. Stage 3 functional UI; the design comes later. */
@Component({
  selector: 'app-trade-listings',
  imports: [TranslatePipe],
  template: `
    @let s = search();
    @if (s.error(); as error) {
      <p class="rounded bg-red-950 px-2 py-1.5 text-red-300">{{ 'trade_result.error' | t }}: {{ error }}</p>
    }
    @if (s.searchResult(); as result) {
      <div class="mb-1 text-xs text-zinc-500">{{ 'trade_result.matched' | t: result.total }}</div>
    }
    @if (s.rows().length) {
      <table class="w-full text-xs tabular-nums">
        <thead class="text-zinc-500">
          <tr>
            <th class="py-0.5 text-left font-normal">{{ 'trade_result.price' | t }}</th>
            <th class="text-right font-normal">{{ detailHeader(s.rows()) }}</th>
            <th class="text-right font-normal">{{ 'trade_result.listed' | t }}</th>
            @if (showSeller) {
              <th class="text-right font-normal">{{ 'trade_result.seller' | t }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of s.rows(); track row.id) {
            <tr class="border-t border-zinc-800" [class.text-amber-300]="row.isMine" [class.opacity-60]="row.accountStatus !== 'online'">
              <td class="py-0.5">
                {{ row.priceAmount }} {{ row.priceCurrency }}
                @if (row.listedTimes > 1) {
                  <span class="text-zinc-500">×{{ row.listedTimes }}</span>
                }
              </td>
              <td class="text-right">{{ detail(row) }}</td>
              <td class="text-right text-zinc-400">{{ row.relativeDate }}</td>
              @if (showSeller) {
                <td class="max-w-24 truncate text-right text-zinc-400">{{ showSeller === 'ign' ? row.ign : row.accountName }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    } @else if (s.isSearching()) {
      <p class="text-zinc-500">Searching…</p>
    }
  `,
})
export class TradeListings {
  readonly search = input.required<TradeSearch>();
  protected readonly showSeller = PRICE_CHECK_DEFAULTS.showSeller;

  /** Second column: stack size for currency, gem level/quality for gems, item level otherwise. */
  protected detailHeader(rows: GroupedResult[]): string {
    if (rows.some((r) => r.stackSize != null)) return 'Stack';
    if (rows.some((r) => r.level != null)) return 'Level / Q';
    return 'iLvl';
  }

  protected detail(row: GroupedResult): string {
    if (row.stackSize != null) return String(row.stackSize);
    if (row.level != null) return [row.level, row.quality].filter(Boolean).join(' / ');
    return row.itemLevel ?? '';
  }
}
