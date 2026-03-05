import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from '../../services/modal.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  template: `
    <nav class="navbar navbar-expand sticky-top bg-white py-2 shadow-sm" style="border-color: #f1f5f9 !important;">
      <div class="container-fluid px-4">
        <!-- Logo -->
        <a routerLink="/" class="navbar-brand d-flex align-items-center p-0 me-4">
          <img src="assets/images/Logo_flat.svg" alt="RoomMatch" style="height: 40px; width: auto; object-fit: contain;">
        </a>

        <!-- Right section -->
        <div class="d-flex align-items-center gap-3 ms-auto">
          <!-- Authenticated icons -->
          <ng-container *ngIf="isAuthenticated">
            <!-- Notification bell -->
            <a routerLink="/notification" routerLinkActive="active"
               class="btn rounded-circle d-flex align-items-center justify-content-center position-relative nav-icon-btn"
               title="Thông báo">
              <img src="assets/icons/bell.svg" style="width: 22px; height: 22px;" alt="Notification" />
              <span *ngIf="notificationCount > 0"
                    class="position-absolute bg-danger border border-2 border-white rounded-circle"
                    style="width: 10px; height: 10px; top: 8px; right: 8px;">
              </span>
            </a>

            <!-- Chat -->
            <a routerLink="/chat" routerLinkActive="active"
               class="btn rounded-circle d-flex align-items-center justify-content-center position-relative nav-icon-btn"
               title="Tin nhắn">
              <img src="assets/icons/message.svg" style="width: 22px; height: 22px;" alt="Message" />
              <span *ngIf="messageCount > 0"
                    class="position-absolute bg-danger border border-2 border-white rounded-circle"
                    style="width: 10px; height: 10px; top: 8px; right: 8px;">
              </span>
            </a>

            <!-- User avatar dropdown -->
            <div ngbDropdown class="d-inline-block ms-1">
              <button class="btn p-0 border-0 bg-transparent dropdown-toggle-no-caret"
                      type="button" id="userDropdown" ngbDropdownToggle>
                <img [src]="userAvatar" alt="avatar"
                     class="rounded-circle object-fit-cover"
                     style="width: 40px; height: 40px;"
                     (error)="$event.target.setAttribute('src','assets/images/avatar_default.jpg')">
              </button>
              <div ngbDropdownMenu aria-labelledby="userDropdown" class="shadow-sm border-0 mt-2"
                   style="position: absolute; right: 0; left: auto;">
                <button ngbDropdownItem class="py-2 d-flex align-items-center" routerLink="/profile">
                  <img src="assets/icons/user.svg" class="me-2" style="width: 16px; height: 16px;" alt="User" />
                  Trang cá nhân
                </button>
                <button ngbDropdownItem class="py-2 d-flex align-items-center" routerLink="/room/manage">
                  <img src="assets/icons/listing.svg" class="me-2" style="width: 16px; height: 16px;" alt="Listing" />
                  Quản lý bài đăng
                </button>
                <button ngbDropdownItem class="py-2 d-flex align-items-center" routerLink="/settings">
                  <img src="assets/icons/settings.svg" class="me-2" style="width: 16px; height: 16px;" alt="Settings" 
                       (error)="$event.target.setAttribute('src', 'assets/icons/user.svg'); $event.target.style.opacity = '0.7'" />
                  Cài đặt
                </button>
                <div class="dropdown-divider"></div>
                <button ngbDropdownItem class="py-2 d-flex align-items-center text-danger" (click)="logout()" style="cursor:pointer;">
                  <img src="assets/icons/logout.svg" class="me-2" style="width: 16px; height: 16px; filter: invert(34%) sepia(87%) saturate(2335%) hue-rotate(334deg) brightness(98%) contrast(92%);" alt="Logout" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </ng-container>

          <!-- Not authenticated -->
          <button *ngIf="!isAuthenticated" class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold"
                  style="height: 40px;"
                  (click)="openLoginModal()">
            Đăng nhập
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1030;
    }

    .nav-icon-btn {
      width: 40px;
      height: 40px;
      padding: 0 !important;
      background-color: #f1f5f9 !important;
      border: none !important;
      transition: all 0.2s ease;
    }
    .nav-icon-btn:hover {
      background-color: #e2e8f0 !important;
      transform: scale(1.05);
    }
    .nav-icon-btn.active {
      background-color: #e0e7ff !important;
    }

    .dropdown-toggle-no-caret::after {
      display: none;
    }

    .dropdown-item {
      font-size: 0.88rem;
      display: flex;
      align-items: center;
    }
    .dropdown-item:active {
      background-color: #eff6ff;
      color: #1f2937;
    }
  `]
})
export class NavbarComponent implements OnInit {
  userAvatar = 'assets/images/avatar_default.jpg';
  notificationCount = 0;
  messageCount = 3;

  constructor(
    private modalService: ModalService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserAvatar();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  openLoginModal(): void {
    this.modalService.openLoginModal();
  }

  logout(): void {
    this.authService.logout();
  }

  private loadUserAvatar(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.userAvatar = parsed.avatarUrl || 'assets/images/avatar_default.jpg';
      } catch { /* keep default */ }
    }
  }
}

