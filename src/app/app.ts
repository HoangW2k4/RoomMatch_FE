import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpinnerLoadingComponent } from './shared/module/spinner-loading';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SpinnerLoadingComponent],
  template: `
    <!-- Global Spinner Loading -->
    <app-spinner-loading 
      [show]="(isLoading$ | async) ?? false" 
      [message]="(loadingMessage$ | async) ?? 'Đang tải...'"
      [size]="'medium'"
      [overlay]="true">
    </app-spinner-loading>
    
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'RoomMatch';

  // Expose loading observables to template
  isLoading$;
  loadingMessage$;

  constructor(public loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
    this.loadingMessage$ = this.loadingService.message$;
  }
}
