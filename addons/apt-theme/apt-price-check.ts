import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { TranslatePipe, TrPipe } from '../../src/app/core/i18n';
import { ItemCheckPanel } from '../../src/app/item-check/item-check-panel';
import { NumInput } from '../../src/app/price-check/num-input';
import { PriceCheckPanel } from '../../src/app/price-check/price-check-panel';
import { Currency } from '../../src/app/shared/currency';

/**
 * The price check as Awakened PoE Trade lays it out (one column as tall as the game), over the
 * same logic as ours: everything comes from PriceCheckPanel, only the template is APT's.
 */
@Component({
  selector: 'app-apt-price-check',
  imports: [NgTemplateOutlet, TranslatePipe, TrPipe, NumInput, ItemCheckPanel, Currency],
  templateUrl: './apt-price-check.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class AptPriceCheck extends PriceCheckPanel {}
