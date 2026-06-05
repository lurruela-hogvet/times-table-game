import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first } from 'rxjs/operators';
import { ApplicationRef, inject, Injectable } from '@angular/core';
import { concat, interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.initUpdateCheck();
      this.subscribeToUpdates();
    }
  }

  // Check the server for updates periodically
  private initUpdateCheck(): void {
    // Wait for the app to stabilize before starting the interval check
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable === true),
    );
    // Check every 60 minutes (3600000 ms) for any new version uploaded to Azure
    const everyHour$ = interval(3600000);
    const checkUpdatesSequence$ = concat(appIsStable$, everyHour$);

    checkUpdatesSequence$.subscribe(() => {
      this.swUpdate.checkForUpdate().catch((err) => {
        console.error('Error checking for service worker updates:', err);
      });
    });
  }

  // Listen to the Service Worker events to alert the user
  private subscribeToUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(() => {
        // You can replace this standard confirm with a fancy custom Tailwind modal later
        const updateAccepted = confirm(
          '¡Hay una nueva versión disponible de la app! ¿Deseas actualizar ahora para ver los cambios?',
        );

        if (updateAccepted) {
          // Reload the browser window to activate the new cached files immediately
          this.swUpdate.activateUpdate().then(() => document.location.reload());
        }
      });
  }
}
