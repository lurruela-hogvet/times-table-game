import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, effect, signal } from '@angular/core';

import { GameOverModalComponent } from '../../../../core/components/game-over-modal/game-over-modal.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, GameOverModalComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  currentScore = signal(0);
  sessionScore = signal(0);
  wrongAnswersCount = signal<number>(0);
  selectedTables = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  showModal = signal<boolean>(false);
  lastFinalScore = signal<number>(0);
  firstNumber = signal<number>(1);
  secondNumber = signal<number>(1);
  options = signal<number[]>([]);

  correctAnswer = computed(() => this.firstNumber() * this.secondNumber());

  isAnswered = signal<boolean>(false);
  selectedOption = signal<number | null>(null);

  constructor() {
    const savedCurrent = localStorage.getItem('quiz_current_score');
    const savedRecord = localStorage.getItem('quiz_highest_record');
    const savedErrors = localStorage.getItem('quiz_wrong_count');
    const savedTables = localStorage.getItem('quiz_selected_tables');

    if (savedCurrent) this.currentScore.set(parseInt(savedCurrent, 10));
    if (savedRecord) this.sessionScore.set(parseInt(savedRecord, 10));
    if (savedErrors) this.wrongAnswersCount.set(parseInt(savedErrors, 10));
    if (savedTables) {
      try {
        this.selectedTables.set(JSON.parse(savedTables));
      } catch (e) {
        this.selectedTables.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }
    }

    effect(() => {
      localStorage.setItem(
        'quiz_current_score',
        this.currentScore().toString(),
      );
      localStorage.setItem(
        'quiz_highest_record',
        this.sessionScore().toString(),
      );
      localStorage.setItem(
        'quiz_wrong_count',
        this.wrongAnswersCount().toString(),
      );
      localStorage.setItem(
        'quiz_selected_tables',
        JSON.stringify(this.selectedTables()),
      );
    });

    this.setRandomNumbersBasedOnSelection();
    this.generateOptions();
  }

  selectOption(option: number): void {
    if (this.isAnswered()) return;

    this.selectedOption.set(option);
    this.isAnswered.set(true);

    if (option === this.correctAnswer()) {
      this.currentScore.update((score) => score + 1);

      if (this.currentScore() > this.sessionScore()) {
        this.sessionScore.set(this.currentScore());
      }
    } else {
      this.wrongAnswersCount.update((errors) => errors + 1);

      if (this.wrongAnswersCount() >= 3) {
        setTimeout(() => {
          this.lastFinalScore.set(this.currentScore());
          this.showModal.set(true);
        }, 600);
      }
    }
  }

  private setRandomNumbersBasedOnSelection(): void {
    const activeTables = this.selectedTables();

    // Guardrail: If no tables are selected, default to all tables to avoid runtime errors
    const validTables =
      activeTables.length > 0 ? activeTables : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const randomIndex = Math.floor(Math.random() * validTables.length);

    this.firstNumber.set(validTables[randomIndex]);
    this.secondNumber.set(Math.floor(Math.random() * 10) + 1);
  }

  toggleTableSelection(tableNumber: number): void {
    const currentSelection = this.selectedTables();
    if (currentSelection.includes(tableNumber)) {
      // Prevent removing the last remaining table to avoid empty selection states
      if (currentSelection.length > 1) {
        this.selectedTables.set(
          currentSelection.filter((num) => num !== tableNumber),
        );
      }
    } else {
      this.selectedTables.set(
        [...currentSelection, tableNumber].sort((a, b) => a - b),
      );
    }

    // If the game hasn't been answered yet, we can force a reroll to match new criteria
    if (!this.isAnswered()) {
      this.setRandomNumbersBasedOnSelection();
      this.generateOptions();
    }
  }

  generateOptions(): void {
    const correctAnswerValue = this.correctAnswer();
    const uniqueAnswers = new Set<number>();

    uniqueAnswers.add(correctAnswerValue);

    const activeTables = this.selectedTables();
    const validTables =
      activeTables.length > 0 ? activeTables : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // We loop until we get 4 distinct plausible answers
    while (uniqueAnswers.size < 4) {
      // Pick a random table from her current selection to build a credible wrong answer
      const randomTableIdx = Math.floor(Math.random() * validTables.length);
      const randomFactor = Math.floor(Math.random() * 10) + 1;

      const plausibleWrongAnswer = validTables[randomTableIdx] * randomFactor;
      uniqueAnswers.add(plausibleWrongAnswer);
    }

    const finalOptionsArray = Array.from(uniqueAnswers);
    this.shuffle(finalOptionsArray);
  }

  private shuffle(array: number[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    this.options.set(array);
  }

  nextQuestion(): void {
    this.isAnswered.set(false);
    this.selectedOption.set(null);

    this.setRandomNumbersBasedOnSelection();

    this.generateOptions();
  }

  handleRestartGame(): void {
    this.currentScore.set(0);
    this.wrongAnswersCount.set(0);
    this.showModal.set(false);
    this.nextQuestion();
  }
}
