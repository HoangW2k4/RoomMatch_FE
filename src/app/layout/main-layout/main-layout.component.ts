import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { LoginComponent } from '../../modules/auth/login/login.component';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, LoginComponent],
  template: `
    <div class="main-layout">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      
      <!-- Global Login Modal -->
      <app-login *ngIf="showLoginModal$ | async" (close)="closeLoginModal()"></app-login>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      background: #f5f5f5;
    }
  `]
})
export class MainLayoutComponent {
  showLoginModal$;
  
  constructor(private modalService: ModalService) {
    this.showLoginModal$ = this.modalService.loginModal$;
  }
  
  closeLoginModal(): void {
    this.modalService.closeLoginModal();
  }
}
