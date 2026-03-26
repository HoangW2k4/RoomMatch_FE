import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile, ProfileService } from '../profile.service';
import { Subject, takeUntil } from 'rxjs';
import { PopupComponent } from '../../../shared/components/popup';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-edit-profile-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupComponent],
  templateUrl: './edit-profile-popup.component.html',
  styleUrls: ['./edit-profile-popup.component.css']
})
export class EditProfilePopupComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() user!: UserProfile;
  @Output() closed = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  fullName = '';
  phoneNumber = '';
  email = '';
  gender = '';

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSubmitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private alertService: AlertService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.user) {
      this.fullName = this.user.fullName || '';
      this.phoneNumber = this.user.phoneNumber || '';
      this.email = this.user.email || '';
      this.gender = this.user.gender || 'OTHER';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  close(): void {
    this.closed.emit();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.alertService.show('warning', 'Lưu ý', 'Vui lòng chọn file ảnh hợp lệ.');
        return;
      }
      this.selectedFile = file;

      // Cleanup previous object url if any
      if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  get displayAvatar(): string {
    return this.previewUrl || this.user?.avatarUrl || 'assets/images/avatar_default.jpg';
  }

  submit(): void {
    if (!this.fullName.trim() || !this.email.trim()) {
      this.alertService.show('warning', 'Lưu ý', 'Vui lòng điền các thông tin bắt buộc (Tên, Email).');
      return;
    }

    const formData = new FormData();
    let hasChanges = false;
    let emailChanged = false;

    // Check what changed
    if (this.fullName.trim() !== (this.user.fullName || '').trim()) {
      formData.append('fullName', this.fullName.trim());
      hasChanges = true;
    }

    if (this.email.trim() !== (this.user.email || '').trim()) {
      formData.append('email', this.email.trim());
      hasChanges = true;
      emailChanged = true;
    }

    if (this.phoneNumber.trim() !== (this.user.phoneNumber || '').trim()) {
      formData.append('phoneNumber', this.phoneNumber.trim());
      hasChanges = true;
    }

    const originalGender = this.user.gender || 'OTHER';
    if (this.gender !== originalGender) {
      formData.append('gender', this.gender);
      hasChanges = true;
    }

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      this.close();
      return;
    }

    this.isSubmitting = true;
    this.profileService.updateInfo(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;

          // Cập nhật thông tin trả về vào localStorage (chỉ update các trường không null)
          if (res?.data) {
            try {
              const storedUserRaw = localStorage.getItem('user');
              if (storedUserRaw) {
                const storedUser = JSON.parse(storedUserRaw);
                Object.keys(res.data).forEach(key => {
                  if (res.data[key] !== null) {
                    storedUser[key] = res.data[key];
                  }
                });
                storedUser.avatar = res.data.avatarUrl;
                localStorage.setItem('user', JSON.stringify(storedUser));
              }
            } catch (e) {
              console.error('Lỗi khi cập nhật localStorage', e);
            }
          }

          if (emailChanged) {
            this.alertService.show('info', 'Đổi Email Thành Công', 'Bạn đã đổi email. Vui lòng đăng nhập lại.');
            this.authService.logout();
          } else {
            this.alertService.show('success', 'Thành công', res?.message || 'Cập nhật thông tin thành công!');
          }
          this.profileUpdated.emit();
          this.close();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.alertService.show('error', 'Lỗi', err?.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
          console.error('Update info failed', err);
        }
      });
  }
}
