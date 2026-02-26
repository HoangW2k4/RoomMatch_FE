import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('Đang tải...');

  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public message$: Observable<string> = this.messageSubject.asObservable();

  /**
   * Show loading spinner
   * @param message Optional loading message
   */
  show(message: string = 'Đang tải...'): void {
    this.messageSubject.next(message);
    this.loadingSubject.next(true);
  }

  /**
   * Hide loading spinner
   */
  hide(): void {
    this.loadingSubject.next(false);
    this.messageSubject.next('Đang tải...');
  }

  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
