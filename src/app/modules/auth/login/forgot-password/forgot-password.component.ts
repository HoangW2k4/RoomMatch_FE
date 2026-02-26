import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextComponent } from '../../../../shared/components/input-text';

export interface ForgotPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordError {
  type: 'error' | 'warning';
  title: string;
  message: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  @Output() submit = new EventEmitter<ForgotPasswordData>();
  @Output() backToSignIn = new EventEmitter<void>();
  @Output() validationError = new EventEmitter<ForgotPasswordError>();
  
  forgotPasswordData: ForgotPasswordData = {
    email: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  onSubmit(): void {
    // Validate email
    if (!this.forgotPasswordData.email) {
      this.validationError.emit({
        type: 'warning',
        title: 'Cảnh báo',
        message: 'Vui lòng nhập email của bạn.'
      });
      return;
    }
    
    // Validate password
    if (!this.forgotPasswordData.newPassword) {
      this.validationError.emit({
        type: 'warning',
        title: 'Cảnh báo',
        message: 'Vui lòng nhập mật khẩu mới.'
      });
      return;
    }
    
    // Validate passwords match
    if (this.forgotPasswordData.newPassword !== this.forgotPasswordData.confirmPassword) {
      this.validationError.emit({
        type: 'error',
        title: 'Lỗi',
        message: 'Mật khẩu không khớp!'
      });
      return;
    }
    
    this.submit.emit(this.forgotPasswordData);
  }
  
  onBackToSignIn(): void {
    this.backToSignIn.emit();
  }
  
  // Getter để check validation
  get isPasswordMismatch(): boolean {
    return this.forgotPasswordData.newPassword !== '' && 
           this.forgotPasswordData.confirmPassword !== '' && 
           this.forgotPasswordData.newPassword !== this.forgotPasswordData.confirmPassword;
  }
}
