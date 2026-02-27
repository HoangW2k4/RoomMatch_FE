import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpinnerLoadingComponent } from './shared/module/spinner-loading';
import { LoadingService } from './core/services/loading.service';
import { AlertComponent, AlertType } from './shared/module/alert';
import { AlertService } from './core/services/alert.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SpinnerLoadingComponent, AlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'RoomMatch';

  // Expose loading observables to template
  isLoading$;
  loadingMessage$;
  alert$;

  constructor(
    public loadingService: LoadingService,
    private alertService: AlertService
  ) {
    this.isLoading$ = this.loadingService.loading$;
    this.loadingMessage$ = this.loadingService.message$;
    this.alert$ = this.alertService.alert$;
  }

  showAlertModal(type: AlertType, title: string, message: string, confirmText: string = 'OK'): void {
    this.alertService.show(type, title, message, confirmText);
  }
    
    closeAlert(): void {
      this.alertService.hide();
    }
}
