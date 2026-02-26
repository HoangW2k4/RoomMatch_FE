import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextComponent } from '../../../../shared/components/input-text';

export interface SignInData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextComponent],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  @Output() signIn = new EventEmitter<SignInData>();
  @Output() forgotPassword = new EventEmitter<void>();
  @Output() signInWithGoogle = new EventEmitter<void>();
  @Output() signInWithFacebook = new EventEmitter<void>();
  
  signInData: SignInData = {
    email: '',
    password: ''
  };
  
  rememberMe = false;
  
  onSubmit(): void {
    this.signIn.emit(this.signInData);
  }
  
  onForgotPassword(): void {
    this.forgotPassword.emit();
  }
  
  onSignInWithGoogle(): void {
    this.signInWithGoogle.emit();
  }
  
  onSignInWithFacebook(): void {
    this.signInWithFacebook.emit();
  }
}
