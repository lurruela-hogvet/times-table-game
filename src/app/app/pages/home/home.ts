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

  showModal = signal<boolean>(false);
  lastFinalScore = signal<number>(0);
  firstNumber = signal(Math.floor(Math.random() * 10));
  secondNumber = signal(Math.floor(Math.random() * 10));
  options = signal<number[]>([]);

  correctAnswer = computed(() => this.firstNumber() * this.secondNumber());

  isAnswered = signal<boolean>(false);
  selectedOption = signal<number | null>(null);

  constructor() {
    const savedCurrent = localStorage.getItem('quiz_current_score');
    const savedRecord = localStorage.getItem('quiz_highest_record');
    const savedErrors = localStorage.getItem('quiz_wrong_count');

    if (savedCurrent) this.currentScore.set(parseInt(savedCurrent, 10));
    if (savedRecord) this.sessionScore.set(parseInt(savedRecord, 10));
    if (savedErrors) this.wrongAnswersCount.set(parseInt(savedErrors, 10));

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
    });

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

  generateOptions(): void {
    const correctAnswerValue = this.correctAnswer();
    const uniqueAnswers = new Set<number>();

    uniqueAnswers.add(correctAnswerValue);

    while (uniqueAnswers.size < 5) {
      const randomWrongAnswer = Math.floor(Math.random() * 100) + 1;
      uniqueAnswers.add(randomWrongAnswer);
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

    this.firstNumber.set(Math.floor(Math.random() * 10) + 1);
    this.secondNumber.set(Math.floor(Math.random() * 10) + 1);

    this.generateOptions();
  }

  handleRestartGame(): void {
    this.currentScore.set(0);
    this.wrongAnswersCount.set(0);
    this.showModal.set(false);
    this.nextQuestion();
  }
}
