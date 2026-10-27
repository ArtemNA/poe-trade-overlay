import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initSettings } from './app/core/settings';

// Settings first: the hotkeys, the league and the price check options depend on them.
initSettings()
  .catch((err) => console.error('Loading settings failed, using the defaults', err))
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
