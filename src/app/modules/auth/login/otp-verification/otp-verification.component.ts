import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  @Input() email = '';
  @Output() verify = new EventEmitter<string>();
  @Output() resend = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  
  otpCode = ['', '', '', '', '', ''];
  otpTimer = 60;
  private otpInterval: any;
  
  // Getter to check if OTP is complete
  get isOtpComplete(): boolean {
    return this.otpCode.every(digit => digit !== '');
  }
  
  ngOnInit(): void {
    this.startOtpTimer();
  }
  
  ngOnDestroy(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }
  
  startOtpTimer(): void {
    this.otpTimer = 60;
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
    this.otpInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        clearInterval(this.otpInterval);
      }
    }, 1000);
  }
  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const index = parseInt(input.getAttribute('data-index') || '0', 10);
    const value = input.value;

    // 1. Xử lý trường hợp Autofill (iOS/Android) hoặc dán paste nhiều số
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      for (let i = 0; i < digits.length; i++) {
        if (index + i < 6) this.otpCode[index + i] = digits[i];
      }
      const nextIndex = Math.min(index + digits.length, 5);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[data-index="${nextIndex}"]`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }, 10);
      return;
    }

    // 2. Xử lý gõ 1 số bình thường
    const digit = value.replace(/\D/g, ''); // Loại bỏ chữ cái

    if (digit) {
      this.otpCode[index] = digit;
      input.value = digit;
      input.blur(); 
      input.value = '';
      setTimeout(() => {
        if (index < 5) {
          const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
          if (nextInput) {
            nextInput.value = '';
            nextInput.focus();
            nextInput.select();
          }
        }
      });
    } else {
      // Nếu nhập ký tự lạ, xóa trống
      this.otpCode[index] = '';
      input.value = '';
    }
  }

  onOtpKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const index = parseInt(input.getAttribute('data-index') || '0', 10);

    // Xử lý nút Backspace (xóa lùi)
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        this.otpCode[index - 1] = '';
        setTimeout(() => {
          const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
          if (prevInput) {
            prevInput.focus();
            prevInput.select();
          }
        }, 10);
      }
    }

    // Chặn ngay các phím chữ cái ở level keydown để giao diện không bị chớp giật
    if (!/[0-9]/.test(event.key) && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }
  
  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '') || '';

    if (!text) return;

    const digits = text.split('').slice(0, 6);

    // Đổ từ ô đầu tiên
    for (let i = 0; i < digits.length; i++) {
      this.otpCode[i] = digits[i];
    }

    // Focus vào ô cuối cùng được điền hoặc ô tiếp theo
    const nextFocusIndex = Math.min(digits.length, 6);
    const nextInput = document.querySelector(
      `input[data-index="${nextFocusIndex}"]`
    ) as HTMLInputElement;

    if (nextInput) {
      nextInput.focus();
    }

    if (digits.length >= 6) {
      setTimeout(() => this.verifyOtp(), 100);
    }
  }
  
  verifyOtp(): void {
    const otpString = this.otpCode.join('');
    this.verify.emit(otpString);
  }
  
  resendOtp(): void {
    if (this.otpTimer > 0) {
      return;
    }
    this.otpCode = ['', '', '', '', '', ''];
    this.startOtpTimer();
    this.resend.emit();
  }
  
  goBack(): void {
    this.back.emit();
  }
}
