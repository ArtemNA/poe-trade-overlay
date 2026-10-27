# PoeTradeOverlay

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Running the app in development

```bash
npm run dev
```

This is `tauri dev` with `src-tauri/tauri.dev.conf.json`: the dev build runs under the identifier
`com.artemna.poe-trade-overlay.dev`, so its settings file, WebView data and logs are separate from an
installed release. A debug build started with the release identifier (plain `tauri dev`) refuses to start.

Testing without the game: run `scripts/fake-game.ps1` and start the app with `POE_GAME_TITLE="PoE Fake Game"`
(and `POE_KEEP_POPUP=1` for screenshots); see the comments in `scripts/`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
