# PoE Trade Overlay — план реалізації (Angular + Tauri)

> Робоча назва. Основа — аналіз [Awakened PoE Trade](https://github.com/SnosMe/awakened-poe-trade) (APT, MIT), стан репозиторію на 25.09.2026, ~20 тис. рядків TS/Vue.
> Мета: власний застосунок для PoE1 на **Angular + Tauri 2**, з частиною функцій APT, зі спрощеною моделлю вікон і з максимальним перевикористанням TS-логіки APT.

---

## 1. Обсяг

### 1.1 Беремо

| # | Функція | Що робить для користувача | Джерело в APT |
|---|---|---|---|
| F1 | **Прайс-чек (ядро)** | Хоткей над предметом → вікно з розібраним предметом, фільтрами (моди, тіри, пресети pseudo / base item), пошуком на trade і лістингами. Режими: auto-hide (тримаєш хоткей), locked (вікно лишається відкритим) | `renderer/src/parser/*`, `web/price-check/{PriceCheckWindow,CheckedItem}.vue`, `filters/*`, `trade/*` |
| F2 | Онлайн-фільтри | Online/offline, in league, merchant only, «listed N днів тому», валюта (chaos / div) | `trade/OnlineFilter*.vue` |
| F3 | Rate limit | Черга запитів з урахуванням лімітів GGG, індикатор стану, «штучне сповільнення» | `trade/RateLimiter.ts`, `artificial-slowdown.ts`, `RateLimiterState.vue` |
| F4 | **Bulk / обмін** | Пошук через bulk exchange для валют, фрагментів, карт; «у вас N × ціна» | `trade/pathofexile-bulk.ts`, `TradeBulk.vue`, `expected-value/StackValue.vue` |
| F5 | **poe.ninja** | Миттєва ціна без запиту до trade, графік за 7 днів, «схожі предмети», вартість дусту при розпиленні | `background/Prices.ts`, `trends/*`, `related-items/*`, `expected-value/DustValue.vue` |
| F6 | **poeprices.info** | ML-прогноз ціни для рідкісних предметів + фідбек | `price-prediction/*` |
| F7 | **Вбудований браузер** | Вікно з pathofexile.com: логін в акаунт, проходження Cloudflare, перегляд trade. Cookies спільні з HTTP-запитами застосунку | `BackgroundInfo.vue`, `main/src/proxy.ts` (`useSessionCookies`) |
| F8 | **Unidentified uniques** | Для неідентифікованого унікального предмета пропонує варіанти на вибір | `unidentified-resolver/*` |
| F9 | **Item check + посилання** | Окремий хоткей: інфо про предмет, відкрити wiki / PoEDB / Craft of Exile, «знайти в сховищі» | `item-check/*` |
| F10 | **Map check** | Перевірка модів мапи: профілі, позначки «небезпечно / попередження / бажано / бачив», підсвітка нових модів | `map-check/*` |
| F11 | **Stash search** | Пресети тексту / regex для пошуку в сховищі, вставка за хоткеєм | `stash-search/*`, `main/src/shortcuts/text-box.ts` |
| F12 | **Chat-команди** | Хоткеї на `/hideout`, `/exit`, `@last ty`, `/invite @last`… з вставкою і відправкою | `main/src/shortcuts/text-box.ts`, `settings/chat.vue` |
| F13 | Налаштування | Ліга, акаунт, хоткеї, розмір шрифту, налаштування прайс-чеку та мап, відновлення буфера | `settings/*`, `web/Config.ts` |
| F14 | Системне | Трей, автооновлення, single instance, лог | `main/src/{AppTray,AppUpdater,RemoteLogger}.ts` |

### 1.2 Не беремо

| Функція APT | Чому прибираємо |
|---|---|
| Режим віджетів (Shift+Space), меню віджетів, drag/resize | Замінюємо моделлю «popup на вимогу» (розділ 2.2) |
| Item search за назвою + OCR Heist-гемів | Не обрано; OCR (WASM + скриншот) — окремий складний модуль |
| Ctrl+колесо по вкладках сховища | Не обрано (за потреби ~2–4 год) |
| Таймер, image strip, Delve grid | Не обрано |
| Читання `Client.txt` | В APT розібрані trade-whisper ніде не використовуються (`client-log.ts` — фактично заготовка) |
| Читання конфігу гри (`GameConfig.ts`) | З 3.29 APT однаково примусово використовує `Ctrl` як showModsKey |
| Linux / macOS | Тільки Windows: WebView2, WinAPI. Платформенний код ізолюємо, щоб інші ОС можна було додати пізніше |
| ru / ko / cmn-Hant | Тільки EN, але архітектура готова до інших мов (розділ 4) |
| PoE2 | Тільки PoE1 |

---

## 2. Архітектура

### 2.1 Стек

**Frontend (Angular)**
- Angular 20+ (standalone components, signals), TypeScript strict, Tailwind CSS.
- Переклади UI: **Transloco** (runtime-переклади, можна напряму перевикористати `app_i18n.json` з APT). Вбудований Angular i18n не підходить: він компілює окремий бандл на кожну мову.
- Графіки: власний SVG (спершу планувався `ng-apexcharts`; див. F-35).
- Підказки й popover: Angular CDK Overlay. Перетягування в списках налаштувань: CDK Drag&Drop.
- Помилки: `neverthrow` (як в APT, бо парсер на ньому побудований).

**Backend (Tauri 2, Rust)** — тільки те, що спілкується з ОС:
- `windows` (WinAPI): `SetWinEventHook` (foreground), `GetWindowRect`, `SendInput`, стилі вікна (`WS_EX_NOACTIVATE`).
- `tauri-plugin-global-shortcut` (або власний `RegisterHotKey`).
- `tauri-plugin-clipboard-manager` або `arboard`.
- `tauri-plugin-http` — запити до pathofexile.com, poe.ninja, poeprices.info без CORS.
- `tauri-plugin-store` (конфіг), `tauri-plugin-updater`, `tauri-plugin-single-instance`, `tauri-plugin-log`, `tauri-plugin-opener` (відкривати wiki й інші сайти в системному браузері).

**Правило розподілу:** у Rust іде те, що працює з ОС і рідко змінюється. У TS іде все, що змінюється разом з грою: парсер, фільтри, trade-логіка.

### 2.2 Модель вікон («popup на вимогу» замість постійного оверлея)

```
┌──────────── Rust ─────────────┐        ┌────────── Angular ──────────┐
│ ForegroundWatcher             │ event  │                             │
│  (EVENT_SYSTEM_FOREGROUND)    ├───────►│ AppState: isGameActive      │
│  → реєструє / знімає хоткеї   │        │                             │
│                               │        │                             │
│ Hotkey → release mods →       │ event  │ PriceCheckService           │
│  SendInput Ctrl+C →           ├───────►│  parse → filters → trade    │
│  poll clipboard → restore?    │ {text, │                             │
│                               │ cursor,│ Popup window (prehidden)    │
│ PopupWindow: show/hide,       │ gameRect}│ ◄─ invoke('popup_show')   │
│  position, topmost, NOACTIVATE│◄───────┤                             │
└───────────────────────────────┘        └─────────────────────────────┘
```

- **Popup-вікна створюються на старті й ховаються** (WebView2 стартує 100–500 мс, тому створювати вікно на хоткей не можна). На хоткей виконуються тільки `set_position` + `show`.
- Popup — topmost, прозорий фон, `WS_EX_NOACTIVATE`. Гра не втрачає фокус, а кліки по фільтрах працюють.
- Хоткеї **реєструються тільки поки активне вікно PoE** (як в APT). Так `RegisterHotKey` не забирає клавіші в інших застосунків. Для цього потрібен легкий `SetWinEventHook` на зміну foreground-вікна, а не стеження за позицією гри.
- Позиція: як в APT — на половині вікна гри, протилежній курсору (інвентар справа → вікно зліва). `GetWindowRect` гри читаємо в момент хоткея.
- Закриття: Esc (глобальний хоткей, поки popup видимий), клік поза вікном, у режимі auto-hide — відпускання хоткея.
- Поле вводу в popup: на час вводу знімаємо `NOACTIVATE` і даємо фокус, після закриття повертаємо фокус грі (`SetForegroundWindow` дозволений, бо наш процес був активним останнім).
- **Звичайні вікна (з активацією):** налаштування, вбудований браузер, редактор stash-search і профілів мап.
- Обмеження (як в APT): гра має бути у windowed / borderless fullscreen.

### 2.3 Структура проєкту

```
poe-trade-overlay/
├─ src-tauri/                 # Rust
│  ├─ src/
│  │  ├─ main.rs
│  │  ├─ platform/            # усе WinAPI тут, за trait'ами → легше додати іншу ОС
│  │  │  ├─ mod.rs            # trait GameWindow, InputSim, ForegroundWatcher
│  │  │  └─ windows.rs
│  │  ├─ hotkeys.rs           # реєстрація, зарезервовані клавіші гри, дублікати
│  │  ├─ clipboard.rs         # read-item-text з таймаутом, restore
│  │  ├─ input.rs             # copy-item, type-in-chat, stash-search послідовності
│  │  ├─ popup.rs             # show/hide/position/no-activate
│  │  └─ browser.rs           # вбудований браузер + експорт cookies
│  └─ tauri.conf.json
├─ src/                       # Angular
│  ├─ app/
│  │  ├─ core/                # host-bridge (invoke/listen), config, i18n, http
│  │  ├─ features/
│  │  │  ├─ price-check/
│  │  │  ├─ bulk/
│  │  │  ├─ ninja/
│  │  │  ├─ item-check/
│  │  │  ├─ map-check/
│  │  │  ├─ stash-search/
│  │  │  └─ settings/
│  │  └─ shared/ui/           # аналоги APT ui/*: checkbox, toggle, slider, popover
│  ├─ lib/apt/                # ПОРТОВАНИЙ код APT (framework-agnostic TS) + LICENSE
│  │  ├─ parser/
│  │  ├─ data/
│  │  ├─ filters/
│  │  └─ trade/
│  └─ assets/data/en/         # items.ndjson, stats.ndjson, client_strings.js, app_i18n.json
└─ THIRD_PARTY_LICENSES.md
```

`lib/apt/` — чистий TS без Angular. Це полегшує підтягування змін з APT (розділ 6) і тестування.

---

## 3. Перенесення коду APT: що й як

| Модуль APT | Рядків | Як переносимо | Зусилля |
|---|---|---|---|
| `renderer/src/parser/` | 2 476 | Копія 1:1, Vue немає. Додати unit-тести на тексти предметів | низькі |
| `renderer/src/assets/data/` | 488 | Копія; завантаження ndjson через `fetch` з assets | низькі |
| `price-check/filters/*.ts` + `pseudo/` | ~2 900 TS | Копія 1:1, Vue немає | низькі |
| `price-check/filters/*.vue` | ~1 850 | Переписати на Angular (FilterModifier, FilterBtnNumeric, Tiers, Links, Anointment, FiltersBlock…) | **високі** |
| `price-check/trade/*.ts` | ~1 400 | Копія; `RateLimiter.ts`, `artificial-slowdown.ts`, `common.ts` імпортують Vue (`ref`/`shallowRef`) → замінити на Angular signals | середні |
| `price-check/trade/*.vue` | ~1 100 | Переписати: TradeListing, TradeBulk, OnlineFilter, TradeLinks | високі |
| `background/Prices.ts`, `Leagues.ts` | ~340 | Використовують Vue-реактивність → сервіси з signals | середні |
| `trends/`, `related-items/`, `expected-value/`, `price-prediction/`, `unidentified-resolver/` | ~1 040 | TS-частини копіюються, `.vue` переписуються | середні |
| `item-check/`, `map-check/` | ~900 | Логіка (`prepare-map-stats.ts`, `common.ts`) — копія; UI — Angular | середні |
| `stash-search/`, `settings/` | ~1 160 | UI переписується; логіку конфігу (`Config.ts`) спрощуємо | середні |
| `main/src/shortcuts/*` | 481 | **Ідеї й послідовності клавіш** переносимо в Rust (див. нижче) | середні |
| `main/src/proxy.ts` | 80 | Замінюється на `tauri-plugin-http` + спільні cookies | середні / ризик |
| `main/src/windowing/*` | 361 | Не переносимо: замінює модель popup | — |

### Важливі деталі з `main/src/shortcuts`, які не можна загубити
- Перед імітацією `Ctrl+C` **відпустити всі модифікатори хоткея** (`keyToggle(..., 'up')`). Інакше гра отримає, наприклад, `Ctrl+Alt+D+C`.
- Опція `keepModKeys`: не відпускати модифікатори, якщо хоткей сам по собі містить `Ctrl`.
- Зарезервовані клавіші гри, які не можна призначати: `Ctrl+C`, `Ctrl+V`, `Ctrl+A`, `Ctrl+F`, `Ctrl+Enter`, `Home`, `Delete`, `Enter`, `ArrowUp`, `ArrowRight`, `ArrowLeft`. Перевіряти й дублікати хоткеїв.
- Буфер обміну: опитувати, поки не з'явиться **новий** текст предмета, з таймаутом. Опція «відновити попередній вміст буфера».
- Chat-команди (`typeInChat`): логіка `@last` на початку чи в кінці рядка, автоочищення для префіксів `# % @ $ & /`, `Ctrl+A` для інших, після відправки — «відновлення» попереднього чату (`Enter`, `Enter`, `↑`, `↑`, `Esc`).
- Stash search: `Ctrl+F` → вставити → `Enter`, тільки коли активна гра.

---

## 4. Готовність до інших мов (зараз тільки EN)

APT вже мультимовний за дизайном, тож достатньо не зламати це під час портування:

1. **Дані гри по папках мов:** `assets/data/{lang}/items.ndjson`, `stats.ndjson`, `client_strings.js`. Завантаження за кодом мови з конфігу, без захардкодженого `en`.
2. **Парсер** уже бере рядки з `client_strings` поточної мови, тож переносимо без змін.
3. **UI-рядки:** Transloco + `app_i18n.json` (формат APT). Жодного тексту прямо в шаблонах.
4. **Trade-домени:** функція `poeWebApi()` з мапою мова → домен (`www.pathofexile.com`, `ru.pathofexile.com`, `pathofexile.tw`, `poe.kakaogames.com`) і прапорцем «примусово англійський сайт».
5. **Мовозалежні регулярні вирази й URL** (PoEDB lang, regex whisper'ів) — тільки через мапи `Record<Lang, ...>`.
6. Тип `Lang = 'en'` зараз; щоб додати мову, треба розширити union, покласти дані й переклад. TypeScript сам покаже всі мапи, які треба доповнити.

Оцінка «додати ще одну мову APT пізніше»: ~4–8 год плюс тестування.

---

## 5. Етапи та оцінка

Припущення: одна людина, досвідчений Angular-розробник, Rust вперше. Години — чистий час роботи. Діапазон «оптимістично – реалістично».

| Етап | Зміст | Години |
|---|---|---|
| **0. Скелет і spike** | Tauri 2 + Angular + Tailwind; Rust: foreground watcher, реєстрація хоткеїв тільки в PoE, відпускання модифікаторів + `SendInput Ctrl+C`, опитування буфера; приховане popup-вікно з `NOACTIVATE`, позиціювання відносно гри; DPI / кілька моніторів. **Критерій:** хоткей над предметом показує сирий текст предмета у popup, гра не втрачає фокус | 16–28 |
| **1. Дані + парсер** | `lib/apt/parser`, `lib/apt/data`, завантаження ndjson, тести на 30–50 зразках предметів (тексти з гри / issues APT) | 12–20 |
| **2. HTTP-шар** | `tauri-plugin-http`, власний User-Agent, ліги, порт `RateLimiter` на signals, кеш, обробка помилок / техробіт | 10–16 |
| **3. Прайс-чек ядро (F1–F3)** | Порт `filters/*.ts`; Angular-компоненти фільтрів і лістингів; режими auto-hide / locked; посилання «відкрити на trade»; індикатор rate limit. Найбільший етап | 50–80 |
| — **MVP готовий** (етапи 0–3 + мінімальні налаштування: ліга, хоткей) | | **~95–155** |
| **4. Bulk (F4)** | `pathofexile-bulk.ts`, TradeBulk, StackValue | 8–14 |
| **5. poe.ninja (F5)** | `Prices.ts` на сервіс, швидка ціна, графік 7 днів (SVG), related items, DustValue | 14–22 |
| **6. poeprices.info (F6)** | Запит, відображення, фідбек | 4–8 |
| **7. Вбудований браузер (F7)** | Окреме вікно pathofexile.com; **спільні cookies** WebView ↔ HTTP-клієнт (див. ризик R1); Cloudflare; хоткей «браузер ↔ гра» | 12–24 |
| **8. Unidentified uniques (F8)** | Вибір варіанта з ITEM_DROP / даних | 2–4 |
| **9. Item check (F9)** | Хоткей, інфо-панель, wiki / PoEDB / CoE через `opener`, «знайти в сховищі» | 6–10 |
| **10. Map check (F10)** | Порт `prepare-map-stats`, панель модів, профілі, редактор матчерів у налаштуваннях | 14–22 |
| **11. Stash search (F11)** | Пресети + хоткеї, Rust-послідовність `Ctrl+F` → paste → Enter, редактор | 6–10 |
| **12. Chat-команди (F12)** | Rust-порт `typeInChat`, налаштування списку команд | 4–8 |
| **13. Налаштування (F13)** | Вікно налаштувань: загальні, хоткеї (компонент запису комбінації), чат, прайс-чек, мапи; `tauri-plugin-store`; версіонування конфігу | 20–30 |
| **14. Системне (F14)** | Трей, single instance, лог, `tauri-plugin-updater` (ключ підпису, GitHub Releases), інсталятор | 8–14 |
| **15. Стабілізація** | Крайові випадки: DPI, кілька моніторів, borderless / windowed, втрата фокусу, ліміти, нова ліга | 16–30 |
| **Разом** | | **~200–340** |

### Стан етапу 0 (26.10.2026)
Перевірено на Блокноті в ролі гри (`POE_GAME_TITLE="poe-item.txt - Notepad"`), Windows 11, два монітори:
- `Ctrl+D` → відпускання модифікаторів → `SendInput Ctrl+C` → текст предмета з буфера за **~52 мс**;
- popup з'являється на половині вікна, протилежній курсору, і **не забирає фокус** (`WS_EX_NOACTIVATE`); кліки по ньому доходять до WebView, активне вікно не змінюється;
- `Esc` закриває popup. Через `RegisterHotKey` не вийшло (клавішу вже зайняла інша програма), тому `Esc` працює через `WH_KEYBOARD_LL`-хук, увімкнений тільки поки popup видимий;
- хоткей реєструється тільки поки активне вікно гри; перехід на інше вікно ховає popup.

Ще не перевірено в справжній PoE: borderless / windowed, DPI і поведінка фокусу саме в грі.

### Стан етапу 1 (26.10.2026)
Парсер і дані APT (EN) перенесені, 10 тестів Vitest проходять, popup показує розібраний предмет. Деталі й відхилення від плану — у [docs/FINDINGS.md](docs/FINDINGS.md) (F-06…F-11).

### Стан етапу 2 (26.10.2026)
Запити через `tauri-plugin-http` з власним User-Agent, ліги з вибором (синхронізується між вікнами), порт `RateLimiter` / `Cache` / rate-limit частини `common.ts` на signals; 25 тестів. Статичні значення — у `src/app/constants.ts` і `src-tauri/src/constants.rs`. Деталі — F-12…F-17 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 3 (26.10.2026)
Фільтри APT (16 файлів) і `pathofexile-trade.ts` перенесені без змін; пресети, item- і стат-фільтри, онлайн-фільтри, пошук і лістинги працюють у popup (перевірено на справжньому trade API). UI — функціональний, дизайн ще попереду; ввід з клавіатури в popup поки замінено колесом миші. 31 тест. Деталі — F-18…F-24 у [docs/FINDINGS.md](docs/FINDINGS.md).
Потім: вікно за дизайном R3·1 (дві колонки, курс divine у заголовку) і ввід чисел з клавіатури — popup бере фокус лише на час введення (F-25, F-27).

### Стан етапу 4 (27.10.2026)
`pathofexile-bulk.ts` перенесено без змін, логіка `TradeBulk.vue` і `StackValue.vue` — у `bulk-search.ts`. Вкладка Bulk відкривається сама для валюти й стекових предметів: найкраща справжня пропозиція, ціна poe.ninja, рядок Market Ratio, «You have × N». Нове відносно APT: пропозиції, дешевші за половину ціни poe.ninja, позначаються як приманки й ховаються. `Esc` працює й під час введення. Перевірено в застосунку на тестовій «грі»; 47 тестів. Деталі — F-26, F-29…F-32 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 5 (27.10.2026)
Ціни poe.ninja беруться з того самого завантаження, що й курс валют. Зліва під предметом — коротка ціна зі зміною за тиждень, вкладка poe.ninja показує ціну, графік за 7 днів, схожі предмети з цінами й вартість у дусті. 54 тести. Знімки всіх перевірених станів — у [docs/screenshots](docs/screenshots/README.md). Деталі — F-33…F-36 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 9 (27.10.2026)
Окремий хоткей Alt+D відкриває компактне вікно item check: назва, Wiki / PoEDB / Craft of Exile, «Find in Stash» (вводить назву в пошук сховища в грі), DPS зброї, дуст і коротка ціна poe.ninja. Те саме є у вкладці Wiki в price check. Окремі хоткеї на кожне посилання — разом із налаштуваннями (етап 13). Для мап і контрактів поки показується той самий item check; map check — етап 10. 58 тестів. Деталі — F-37, F-38 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 10 (27.10.2026)
Alt+D на мапі (а також на контракті, кресленні, запрошенні, Chart чи журналі експедиції) відкриває map check. У ньому скриншот локації, тір, Quantity / Rarity / Pack size, нагадування про босів Maven і список модів, кольоровий за позначками («небезпечно / попередження / бажано / бачив»). Профілів три, нерозпізнані моди показуються окремо, а для застарілих формулювань є банер. Висота вікна item check і map check іде за вмістом. Редактор позначок — на вкладці «Map check» головного вікна (у налаштування переїде на етапі 13). 66 тестів. Деталі — F-39 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 13 (27.10.2026)
Головне вікно стало вікном налаштувань з розділами General (назва вікна гри, ліга, акаунт), Hotkeys, Price check, Map check (редактор позначок) і Log. Хоткеї записуються натисканням; серед них окремі Wiki / PoEDB / Craft of Exile / Find in Stash без показу popup. Налаштування зберігаються в `settings.json` (`tauri-plugin-store`) з версією і міграцією; старі дані з localStorage переносяться. Dev-збірка має окремий identifier (`npm run dev`), тож не чіпає конфіг релізу. Не зроблено: розмір шрифту. 71 тест (TS) і 7 (Rust). Деталі — F-40, F-41 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 12 (27.10.2026)
Чат-команди: розділ Chat у налаштуваннях (текст, Send, хоткей, додати / прибрати), дефолтні команди APT (`/hideout` на F5, `/exit` на F9 і команди з `@last`). Хоткей вводить текст у чат гри з підстановкою останнього, хто писав у приват, як APT `typeInChat`. Перевірено на фейковій грі. 72 тести (TS) і 10 (Rust). Деталі — F-42 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 11 (27.10.2026)
Alt+F відкриває панель пресетів пошуку в сховищі по центру гри; клік вводить текст у пошук. Пресет може мати свій хоткей, що шукає одразу (у групі можна вимкнути). Редактор груп і пресетів — розділ «Stash search» у налаштуваннях; дефолтні групи з APT. Перевірено на фейковій грі. 73 тести (TS) і 11 (Rust). Деталі — F-43 у [docs/FINDINGS.md](docs/FINDINGS.md).

### Стан етапу 7 (27.10.2026)
Вбудований браузер: вікно pathofexile.com для входу в акаунт і перевірки Cloudflare. З налаштуванням «Use the built-in browser» trade-запити виконуються всередині його сторінки, з її cookies і User-Agent; ризик R1 закрито запасним варіантом. Якщо Cloudflare блокує запит, price check показує зрозуміле повідомлення з кнопкою «Open browser». Є хоткей «браузер ↔ гра». Пошук через браузер перевірено на справжньому API, самого Cloudflare — ні. 75 тестів (TS) і 14 (Rust). Деталі — F-45 у [docs/FINDINGS.md](docs/FINDINGS.md).

### У календарі
- **Вечорами (10–15 год/тиждень):** MVP за ~2–3 місяці, усе обране — ~4–7 місяців.
- **Повний день:** MVP за ~3–4 тижні, усе — ~6–9 тижнів.
- Найбільший ризик для термінів — етап 0 (Rust і поведінка фокусу) та UI фільтрів на етапі 3. Решта — передбачувана робота.

### Рекомендований порядок
0 → 1 → 2 → 3 (**MVP, ним уже можна користуватися**) → 5 → 4 → 9 → 10 → 13 → 12 → 11 → 7 → 6 → 8 → 14 → 15.
Вбудований браузер (7) стоїть пізніше: він потрібен, тільки коли trade починає вимагати логін або Cloudflare. До того часу запити працюють і без нього.

---

## 6. Дані гри та синхронізація з APT

- У репозиторії APT **немає генератора** `items.ndjson` / `stats.ndjson`: дані генеруються поза ним і просто комітяться.
- Стратегія: скрипт `scripts/sync-apt.mjs`, який підтягує `renderer/public/data/en/*` з APT за тегом / комітом (і, за бажанням, показує diff `lib/apt/*` з upstream). Запускати на старті кожної ліги.
- `lib/apt/` максимально близький до оригіналу: правки мінімальні й позначені коментарем `// [port]`. Тоді зміни з upstream переносяться майже автоматично.
- Нова ліга = оновити дані + перевірити парсер на нових механіках. Очікувано 2–8 год щоліги.

---

## 7. Ризики

| ID | Ризик | Ймовірність | Що робимо |
|---|---|---|---|
| R1 | **Спільні cookies між WebView2 і HTTP-клієнтом.** APT робить запити через `net.request` з `useSessionCookies: true` і прибирає атрибут `Partitioned` з Cloudflare-cookies. У Tauri cookie jar `tauri-plugin-http` (reqwest) і WebView2 — **різні** | висока | Spike на етапі 7: читати cookies вебв'ю (API cookies у Tauri 2 або `ICoreWebView2CookieManager` через `webview2-com`) і копіювати їх у jar. Запасний варіант — виконувати trade-запити зсередини прихованого вебв'ю на origin pathofexile.com |
| R2 | Поведінка фокусу та `NOACTIVATE` у PoE (borderless, кілька моніторів) | середня | Етап 0 — саме spike з цим критерієм; не йти далі, поки не працює |
| R3 | Rust для новачка | середня | Тримати Rust-частину маленькою (~1–1,5 тис. рядків), усе інше в TS |
| R4 | Розходження з upstream APT | середня | Розділ 6: `lib/apt/` близько до оригіналу, скрипт синхронізації |
| R5 | Зміни trade API / Cloudflare з боку GGG | низька–середня | Ті самі, що в APT: стежити за issues APT |
| R6 | Антивірус і SmartScreen на непідписаному exe | середня | Підпис коду (платно) або пояснення в README |
| R7 | Мережеві ліміти GGG / бан за агресивні запити | низька | Порт `RateLimiter` 1:1, власний `User-Agent` з контактом, без паралельних сплесків |

---

## 8. Ліцензія та правила

- Код APT — MIT © 2020 Alexander Drozdov. У `lib/apt/` покласти `LICENSE` APT, у корені — `THIRD_PARTY_LICENSES.md`, у шапках скопійованих файлів — коментар з джерелом.
- `items.ndjson` / `stats.ndjson` — похідні від даних гри (власність GGG). Ними користуються всі інструменти для PoE, але MIT від APT на сам контент гри не поширюється.
- Trade API: **власний** `User-Agent` (назва, версія, контакт), без видавання себе за APT; дотримання rate limits.
- Нічого не впроваджувати в процес гри: тільки окреме вікно, буфер обміну та імітація клавіш, як в APT.

---

## 9. Відкриті питання

1. Назва проєкту і де він житиме (GitHub-репозиторій, публічний чи приватний).
2. Чи потрібне автооновлення одразу, чи вистачить ручних релізів на GitHub на старті.
3. ~~Дизайн~~ — вирішено: свій, не копія APT. Перед UI-етапами запропонувати кілька варіантів через скіл дизайну.
4. Ctrl+колесо по вкладках сховища — дешево (2–4 год); додати в план?
