import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadRuntimeConfig } from './app/runtime-config';

(async () => {
    try {
        await loadRuntimeConfig();
    } catch (e) {
        console.warn('Failed to load runtime config, proceeding with defaults');
    }

    bootstrapApplication(AppComponent, appConfig)
        .catch((err) => console.error(err));
})();
