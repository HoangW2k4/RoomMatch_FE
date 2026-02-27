import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FeatureNotDevelopedComponent } from '../../../shared/module/feature-not-developed';
import { AlertType } from '../../../shared/module/alert';
import { SignInComponent, SignInData } from './sign-in/sign-in.component';
import { SignUpComponent, SignUpData, SignUpError } from './sign-up/sign-up.component';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';
import { ForgotPasswordComponent, ForgotPasswordData, ForgotPasswordError } from './forgot-password/forgot-password.component';
import { LoginService } from './login.service';
import { LoadingService } from '../../../core/services/loading.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FeatureNotDevelopedComponent, 
    SignInComponent,
    SignUpComponent,
    OtpVerificationComponent,
    ForgotPasswordComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  // Mode toggle
  isSignUp = false; // Show sign-in form by default
  showForgotPassword = false;
  
  // Background carousel
  banners = [
    'assets/images/Login_banner_1.jpg',
    'assets/images/Login_banner_2.jpg',
    'assets/images/Login_banner_3.jpg',
    'assets/images/Login_banner_4.jpg',
    'assets/images/Login_banner_5.jpg'
  ];
  currentSlide = 0;
  private slideInterval: any;
  
  // OTP verification
  showOtpInput = false;
  otpMode: 'signup' | 'forgotPassword' = 'signup'; // Track OTP mode
  currentEmail = '';
  currentSignUpData: SignUpData | null = null; // Store sign up data for OTP verification
  currentLookingFor = 'room'; // Store looking for preference
  currentForgotPasswordData: ForgotPasswordData | null = null;
  
  // Feature not developed modal
  showFeatureNotDeveloped = false;
  featureNotDevelopedTitle = '';
  featureNotDevelopedMessage = '';
  
  constructor(
    private router: Router,
    private loginService: LoginService,
    private loadingService: LoadingService,
    private alertService: AlertService
  ) {}
  
  ngOnInit(): void {
    this.startSlideshow();
  }
  
  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
  
  closeModal(): void {
    this.close.emit();
  }
  
  startSlideshow(): void {
    // Change slide every 5 seconds
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.banners.length;
    }, 5000);
  }
  
  toggleMode(isSignUp: boolean): void {
    this.isSignUp = isSignUp;
    this.showOtpInput = false;
    this.showForgotPassword = false;
  }

  // Sign In handlers
  onSignIn(data: SignInData): void {
    this.loadingService.show('Đang đăng nhập...');
    
    // Call signin API
    this.loginService.signin({ email: data.email, password: data.password }).subscribe({
      next: (response) => {
        this.loadingService.hide();
        this.showAlertModal('success', 'Thành công', 'Đăng nhập thành công!');
        localStorage.setItem('accessToken', response?.data?.accessToken || '');
        localStorage.setItem('refreshToken', response?.data?.refreshToken || '');
        localStorage.setItem('userRole', response?.data?.role || '');
        // Navigate to home or dashboard
        setTimeout(() => {
          this.closeModal();
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Login error:', error);
        // Backend returns: { status: number, message: string, data: null }
        const message = error.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
        this.showAlertModal('error', 'Đăng nhập thất bại', message);
      }
    });
  }
  
  onForgotPassword(): void {
    this.showForgotPassword = true;
    this.showOtpInput = false;
  }
  
  // Forgot Password handlers
  onForgotPasswordSubmit(data: ForgotPasswordData): void {
    this.loadingService.show('Đang gửi mã OTP...');
    
    // Store data for OTP verification
    this.currentEmail = data.email;
    this.currentForgotPasswordData = data;
    this.otpMode = 'forgotPassword';
    
    // Send OTP to email via API
    this.loginService.sendResetPasswordOtp(data.email).subscribe({
      next: () => {
        this.loadingService.hide();
        this.showOtpInput = true;
        this.showAlertModal(
          'success', 
          'Thành công', 
          `Mã OTP đã được gửi đến email ${data.email}. Vui lòng xác thực để đặt lại mật khẩu.`
        );
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Send reset password OTP error:', error);
        const message = error.error?.message || 'Gửi mã OTP thất bại. Vui lòng thử lại.';
        this.showAlertModal('error', 'Gửi OTP thất bại', message);
      }
    });
  }
  
  onForgotPasswordValidationError(error: ForgotPasswordError): void {
    this.showAlertModal(error.type, error.title, error.message);
  }
  
  onBackToSignInFromForgot(): void {
    this.showForgotPassword = false;
    this.currentForgotPasswordData = null;
  }
  
  // Sign Up handlers
  onSignUp(event: { data: SignUpData, lookingFor: string }): void {
    this.loadingService.show('Đang gửi mã OTP...');

    // Store data for OTP verification
    this.currentEmail = event.data.email;
    this.currentSignUpData = event.data;
    this.currentLookingFor = event.lookingFor;
    this.otpMode = 'signup';
    
    // Send OTP to email via API
    this.loginService.sendSignupOtp(event.data.email).subscribe({
      next: () => {
        this.loadingService.hide();
        this.showOtpInput = true;
        this.showAlertModal(
          'success', 
          'Thành công', 
          `Mã OTP đã được gửi đến email ${event.data.email}. Vui lòng kiểm tra hộp thư của bạn.`
        );
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Send signup OTP error:', error);
        const message = error.error?.message || 'Gửi mã OTP thất bại. Vui lòng thử lại.';
        this.showAlertModal('error', 'Gửi OTP thất bại', message);
      }
    });
  }
  
  onSignUpValidationError(error: SignUpError): void {
    this.showAlertModal(error.type, error.title, error.message);
  }
  
  onShowRoommateInfo(): void {
    this.showAlertModal(
      'info',
      'Thông báo',
      'Bạn sẽ đăng ký với vai trò người cho thuê phòng trọ. Điều này cho phép bạn đăng tin cho thuê và quản lý các phòng trọ của mình.'
    );
  }
  
  // OTP handlers
  onVerifyOtp(otpString: string): void {
    
    if (this.otpMode === 'forgotPassword') {
      this.loadingService.show('Đang đặt lại mật khẩu...');
      
      // Handle forgot password verification
      if (!this.currentForgotPasswordData) {
        this.loadingService.hide();
        this.showAlertModal('error', 'Lỗi', 'Dữ liệu không hợp lệ. Vui lòng thử lại.');
        return;
      }
      
      this.loginService.resetPassword(
        { 
          email: this.currentForgotPasswordData.email, 
          password: this.currentForgotPasswordData.newPassword 
        }, 
        otpString
      ).subscribe({
        next: (response) => {
          this.loadingService.hide();
          this.showAlertModal('success', 'Đặt lại mật khẩu thành công', 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.');
          
          setTimeout(() => {
            this.showOtpInput = false;
            this.showForgotPassword = false;
            this.isSignUp = false; // Switch to sign in
            this.currentForgotPasswordData = null;
          }, 2000);
        },
        error: (error) => {
          this.loadingService.hide();
          console.error('Reset password error:', error);
          const message = error.error?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã OTP và thử lại.';
          this.showAlertModal('error', 'Đặt lại mật khẩu thất bại', message);
        }
      });
    } else {
      this.loadingService.show('Đang đăng ký tài khoản...');
      
      // Handle sign up verification
      if (!this.currentSignUpData) {
        this.loadingService.hide();
        this.showAlertModal('error', 'Lỗi', 'Dữ liệu không hợp lệ. Vui lòng thử lại.');
        return;
      }
      
      // Determine role based on lookingFor
      const role = this.currentLookingFor === 'roommate' ? 'ROLE_LANDLORD' : 'ROLE_SEEKER';
      
      this.loginService.signup(
        {
          fullName: this.currentSignUpData.fullName,
          email: this.currentSignUpData.email,
          password: this.currentSignUpData.password,
          phoneNumber: this.currentSignUpData.phoneNumber,
          role: role
        },
        otpString
      ).subscribe({
        next: (response) => {
          this.loadingService.hide();
          this.showAlertModal('success', 'Xác thực thành công', 'Tài khoản của bạn đã được tạo thành công!');
          
          setTimeout(() => {
            this.showOtpInput = false;
            this.closeModal();
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          this.loadingService.hide();
          console.error('Signup error:', error);
          const message = error.error?.message || 'Đăng ký thất bại. Vui lòng kiểm tra mã OTP và thử lại.';
          this.showAlertModal('error', 'Đăng ký thất bại', message);
        }
      });
    }
  }
  
  onResendOtp(): void {
    this.loadingService.show('Đang gửi lại mã OTP...');
    
    if (this.otpMode === 'forgotPassword') {
      this.loginService.sendResetPasswordOtp(this.currentEmail).subscribe({
        next: () => {
          this.loadingService.hide();
          this.showAlertModal('success', 'Thành công', `Mã OTP mới đã được gửi đến email ${this.currentEmail}.`);
        },
        error: (error) => {
          this.loadingService.hide();
          console.error('Resend reset password OTP error:', error);
          const message = error.error?.message || 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
          this.showAlertModal('error', 'Gửi OTP thất bại', message);
        }
      });
    } else {
      this.loginService.sendSignupOtp(this.currentEmail).subscribe({
        next: () => {
          this.loadingService.hide();
          this.showAlertModal('success', 'Thành công', `Mã OTP mới đã được gửi đến email ${this.currentEmail}.`);
        },
        error: (error) => {
          this.loadingService.hide();
          console.error('Resend signup OTP error:', error);
          const message = error.error?.message || 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
          this.showAlertModal('error', 'Gửi OTP thất bại', message);
        }
      });
    }
  }
  
  onBackToSignUp(): void {
    this.showOtpInput = false;
    if (this.otpMode === 'forgotPassword') {
      // Back to forgot password form
      this.showForgotPassword = true;
    }
  }
  
  // Social login handlers
  onSignInWithGoogle(): void {
    this.showFeatureAlert(
      'Đăng nhập Google',
      'Tính năng đăng nhập bằng Google đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.'
    );
  }
  
  onSignInWithFacebook(): void {
    this.showFeatureAlert(
      'Đăng nhập Facebook',
      'Tính năng đăng nhập bằng Facebook đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.'
    );
  }
  
  onShowTerms(): void {
    this.showFeatureAlert(
      'Điều khoản sử dụng',
      'Tôi lười viết điều khoản sử dung. Hãy cứ ấn đồng ý đi.'
    );
  }
  
  showFeatureAlert(title: string, message: string): void {
    this.featureNotDevelopedTitle = title;
    this.featureNotDevelopedMessage = message;
    this.showFeatureNotDeveloped = true;
  }
  
  closeFeatureAlert(): void {
    this.showFeatureNotDeveloped = false;
  }
  
  showAlertModal(type: AlertType, title: string, message: string, confirmText: string = 'OK'): void {
    this.alertService.show(type, title, message, confirmText);
  }
}
