import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertType } from '../../shared/module/alert';

export interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly initialState: AlertState = {
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK'
  };

  private readonly alertSubject = new BehaviorSubject<AlertState>(this.initialState);
  readonly alert$ = this.alertSubject.asObservable();

  show(type: AlertType, title: string, message: string, confirmText: string = 'OK'): void {
    this.alertSubject.next({
      visible: true,
      type,
      title,
      message,
      confirmText
    });
  }

  hide(): void {
    this.alertSubject.next({
      ...this.alertSubject.value,
      visible: false
    });
  }
}
