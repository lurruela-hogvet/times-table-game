import { RouterOutlet } from '@angular/router';
import { Component, inject, signal } from '@angular/core';

import { UpdateService } from '../core/services/update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('times-table-game');
  private updateService = inject(UpdateService);
}
