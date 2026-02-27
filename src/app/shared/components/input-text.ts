import { Component, Input, forwardRef, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule, NgControl } from '@angular/forms';

@Component({
  selector: 'app-input-text',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="input-wrapper" [class.error]="shouldShowError()">
      <label *ngIf="label" class="input-label" [class.required]="required">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      
      <div class="input-container">
        <span *ngIf="prefixIcon" class="prefix-icon">{{ prefixIcon }}</span>
        
        <input
          [type]="getInputType()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [attr.maxlength]="maxLength"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          class="input-field"
          [class.has-prefix]="prefixIcon"
          [class.has-suffix]="suffixIcon || type === 'password'"
        />
        
        <span *ngIf="suffixIcon && type !== 'password'" class="suffix-icon">{{ suffixIcon }}</span>
        
        <button 
          *ngIf="type === 'password'"
          type="button"
          class="password-toggle"
          (click)="togglePasswordVisibility()"
          [disabled]="disabled"
          tabindex="-1"
        >
          <img 
            *ngIf="!showPassword"
            src="assets/icons/ic_show_password.svg"
            alt="Hiện mật khẩu"
            width="20"
            height="20"
          />
          <img 
            *ngIf="showPassword"
            src="assets/icons/ic_hide_password.svg"
            alt="Ẩn mật khẩu"
            width="20"
            height="20"
          />
        </button>
      </div>
      
      <div *ngIf="shouldShowError()" class="error-message">
        <span>{{ getCurrentErrorMessage() }} !</span>
      </div>
      
      <div *ngIf="helperText && !shouldShowError()" class="helper-text">
        {{ helperText }}
      </div>
    </div>
  `,
  styles: [`
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      margin-bottom: 1rem;
    }

    .input-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .required-mark {
      color: #ef4444;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-field {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      color: #1f2937;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      outline: none;
      transition: all 0.2s ease;
    }

    /* Ẩn icon mặc định của trình duyệt cho input password */
    .input-field::-ms-reveal,
    .input-field::-ms-clear {
      display: none;
    }

    .input-field::-webkit-credentials-auto-fill-button,
    .input-field::-webkit-textfield-decoration-container,
    .input-field::-webkit-contacts-auto-fill-button {
      visibility: hidden;
      pointer-events: none;
      position: absolute;
      right: 0;
      display: none !important;
    }

    input[type="password"]::-ms-reveal {
      display: none;
    }

    input[type="password"]::-webkit-credentials-auto-fill-button,
    input[type="password"]::-webkit-textfield-decoration-container {
      display: none !important;
      visibility: hidden !important;
    }

    .input-field:focus {
      border-color: #3b82f6;
    //   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input-field:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .input-field:readonly {
      background-color: #f9fafb;
      cursor: default;
    }

    .input-field.has-prefix {
      padding-left: 2.5rem;
    }

    .input-field.has-suffix {
      padding-right: 2.5rem;
    }

    .prefix-icon,
    .suffix-icon {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
      color: #6b7280;
      pointer-events: none;
    }

    .prefix-icon {
      left: 0.75rem;
    }

    .suffix-icon {
      right: 0.75rem;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }

    .password-toggle:hover:not(:disabled) {
      opacity: 1;
    }

    .password-toggle:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    .password-toggle img {
      display: block;
    }

    .error .input-field {
      border-color: #ef4444;
    }

    .error .input-field:focus {
      border-color: #ef4444;
    //   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #ef4444;
      animation: slideDown 0.2s ease;
    }

    .error-icon {
      font-size: 1rem;
    }

    .helper-text {
      font-size: 0.875rem;
      color: #6b7280;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-0.25rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class InputTextComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url' = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() maxLength?: number;
  @Input() errorMessage: string = '';
  @Input() helperText: string = '';
  @Input() prefixIcon: string = '';
  @Input() suffixIcon: string = '';

  value: string = '';
  touched: boolean = false;
  dirty: boolean = false;
  hasError: boolean = false;
  showPassword: boolean = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.dirty = true;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  onFocus(): void {
    // Optional: Add focus logic if needed
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Get input type based on password visibility
  getInputType(): string {
    if (this.type === 'password' && this.showPassword) {
      return 'text';
    }
    return this.type;
  }

  // Method to set error state from parent component
  setError(hasError: boolean, message?: string): void {
    this.hasError = hasError;
    if (message) {
      this.errorMessage = message;
    }
  }

  // Method to reset the input
  reset(): void {
    this.value = '';
    this.touched = false;
    this.dirty = false;
    this.hasError = false;
    this.onChange('');
  }

  // Check if error should be displayed
  shouldShowError(): boolean {
    const hasCustomError = !!this.errorMessage;
    const control = this.ngControl?.control;
    if (control) {
      return hasCustomError || !!(control.invalid && (control.touched || control.dirty));
    }
    return hasCustomError || (this.hasError && (this.touched || this.dirty));
  }

  // Get current error message
  getCurrentErrorMessage(): string {
    // If custom error message is set, use it
    if (this.errorMessage) {
      return this.errorMessage;
    }

    // Otherwise, get error from form control
    const control = this.ngControl?.control;
    if (control?.errors) {
      const errors = control.errors;
      
      if (errors['required']) {
        return 'Trường này là bắt buộc';
      }
      if (errors['email']) {
        return 'Email không hợp lệ';
      }
      if (errors['minlength']) {
        const minLength = errors['minlength'].requiredLength;
        return `Tối thiểu ${minLength} ký tự`;
      }
      if (errors['maxlength']) {
        const maxLength = errors['maxlength'].requiredLength;
        return `Tối đa ${maxLength} ký tự`;
      }
      if (errors['pattern']) {
        return 'Định dạng không đúng';
      }
      if (errors['min']) {
        return `Giá trị tối thiểu là ${errors['min'].min}`;
      }
      if (errors['max']) {
        return `Giá trị tối đa là ${errors['max'].max}`;
      }
    }

    return 'Trường này không hợp lệ';
  }
}
