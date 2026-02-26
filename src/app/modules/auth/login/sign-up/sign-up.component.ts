import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextComponent } from '../../../../shared/components/input-text';

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

export interface SignUpError {
  type: 'error' | 'warning';
  title: string;
  message: string;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextComponent],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  @Output() signUp = new EventEmitter<{ data: SignUpData, lookingFor: string }>();
  @Output() showTerms = new EventEmitter<void>();
  @Output() showInfo = new EventEmitter<void>();
  @Output() validationError = new EventEmitter<SignUpError>();
  
  signUpData: SignUpData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  };
  
  lookingFor = 'room'; // 'room' or 'roommate'
  acceptTerms = false;
  
  onLookingForChange(type: 'room' | 'roommate'): void {
    this.lookingFor = type;
    if (type === 'roommate') {
      this.showInfo.emit();
    }
  }
  
  onSubmit(): void {
    if (this.signUpData.password !== this.signUpData.confirmPassword) {
      this.validationError.emit({
        type: 'error',
        title: 'Lỗi',
        message: 'Mật khẩu không khớp!'
      });
      return;
    }
    
    if (!this.acceptTerms) {
      this.validationError.emit({
        type: 'warning',
        title: 'Cảnh báo',
        message: 'Vui lòng đồng ý với điều khoản sử dụng để tiếp tục.'
      });
      return;
    }
    
    this.signUp.emit({ data: this.signUpData, lookingFor: this.lookingFor });
  }
  
  onShowTerms(): void {
    this.showTerms.emit();
  }
  
  // Getter để check validation
  get isPasswordMismatch(): boolean {
    return this.signUpData.password !== '' && 
           this.signUpData.confirmPassword !== '' && 
           this.signUpData.password !== this.signUpData.confirmPassword;
  }
}
