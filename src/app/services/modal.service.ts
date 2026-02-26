import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private loginModalSubject = new BehaviorSubject<boolean>(false);
  loginModal$ = this.loginModalSubject.asObservable();

  openLoginModal(): void {
    this.loginModalSubject.next(true);
  }

  closeLoginModal(): void {
    this.loginModalSubject.next(false);
  }
}
