import { Component, input, OnInit, output } from '@angular/core';

@Component({
  selector: 'app-game-over-modal',
  templateUrl: './game-over-modal.component.html',
  styleUrls: ['./game-over-modal.component.css'],
})
export class GameOverModalComponent {
  isOpen = input.required<boolean>();
  finalScore = input.required<number>();
  bestRecord = input.required<number>();

  onRestart = output<void>();

  triggerRestart(): void {
    this.onRestart.emit();
  }
}
