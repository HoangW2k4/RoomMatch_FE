import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <p>&copy; {{ currentYear }} RoomMatch. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #2c3e50;
      color: white;
      padding: 24px;
      margin-top: auto;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }
    .footer-container p {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
