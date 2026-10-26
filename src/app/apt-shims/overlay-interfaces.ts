/**
 * Stands in for APT `@/web/overlay/interfaces`: only the widget settings ported code reads.
 * Values come from `AppConfig('<widget type>')` in ./web-config.ts.
 */
export interface PriceCheckWidget {
  apiLatencySeconds: number;
}
