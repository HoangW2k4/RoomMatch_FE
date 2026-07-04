import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { RePostResponse, RoomPostResponse } from '../../../../core/models/post.interface';
import { AlertService } from '../../../../core/services/alert.service';
import { DropdownFieldComponent } from '../../../../shared/components/dropdown-field/dropdown-field.component';
import { InputFieldComponent } from '../../../../shared/components/input-field.component';
import { PopupComponent } from '../../../../shared/components/popup';
import { PostService } from '../../post.service';

@Component({
  selector: 'app-repost-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopupComponent, InputFieldComponent, DropdownFieldComponent],
  templateUrl: './repost-popup.component.html',
  styleUrls: ['./repost-popup.component.css']
})
export class RepostPopupComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() post: RoomPostResponse | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() repostCreated = new EventEmitter<RePostResponse>();
  @Output() alreadyReposted = new EventEmitter<void>();

  readonly genders: Array<'MALE' | 'FEMALE' | 'OTHER'> = ['MALE', 'FEMALE', 'OTHER'];
  readonly occupations = ['Sinh viên', 'Nhân viên văn phòng', 'Kinh doanh', 'Lao động tự do', 'Khác'];
  isChecking = false;
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    caption: ['', [Validators.required, this.trimmedLengthValidator(10, 500)]],
    age: [18, [Validators.required, Validators.min(18), Validators.max(100)]],
    gender: ['' as '' | 'MALE' | 'FEMALE' | 'OTHER', Validators.required],
    occupation: ['', Validators.required]
  });

  constructor(private postService: PostService, private alertService: AlertService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) this.checkExistingRepost();
  }

  genderLabel = (gender: string): string => ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }[gender] ?? gender);
  occupationLabel = (occupation: string): string => occupation;

  setGender(value: string | string[]): void {
    this.form.controls.gender.setValue(value as 'MALE' | 'FEMALE' | 'OTHER');
    this.form.controls.gender.markAsTouched();
  }

  setOccupation(value: string | string[]): void {
    this.form.controls.occupation.setValue(value as string);
    this.form.controls.occupation.markAsTouched();
  }

  close(): void {
    if (!this.isSubmitting) this.closed.emit();
  }

  submit(): void {
    const post = this.post;
    const trimmedCaption = this.form.controls.caption.value.trim();
    this.form.controls.caption.setValue(trimmedCaption);
    this.form.controls.caption.updateValueAndValidity();
    if (!post || this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isSubmitting = true;
    this.postService.createRepost({
      originalPostId: post.id,
      caption: value.caption,
      seekerInfo: {
        age: value.age,
        gender: value.gender as 'MALE' | 'FEMALE' | 'OTHER',
        occupation: value.occupation
      }
    }).pipe(finalize(() => this.isSubmitting = false)).subscribe({
      next: res => {
        if (!res.data) return;
        post.statistics.shareCount += 1;
        this.repostCreated.emit(res.data);
        this.form.reset({ caption: '', age: 18, gender: '', occupation: '' });
        this.alertService.show('success', 'Đăng lại thành công', 'Bạn có thể quản lý bài đăng lại trong trang cá nhân.');
        this.closed.emit();
      },
      error: (error: HttpErrorResponse) => {
        if (this.errorCode(error) === 3009) {
          this.closed.emit();
          this.alreadyReposted.emit();
          return;
        }
        this.alertService.show('error', 'Không thể đăng lại', this.errorMessage(error));
      }
    });
  }

  private checkExistingRepost(): void {
    this.isChecking = true;
    this.postService.getMyRepost().pipe(finalize(() => this.isChecking = false)).subscribe({
      next: res => {
        if (res.data) {
          this.closed.emit();
          this.alreadyReposted.emit();
        }
      },
      error: () => this.alertService.show('error', 'Lỗi', 'Không thể kiểm tra bài đăng lại hiện tại.')
    });
  }

  private trimmedLengthValidator(min: number, max: number) {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const length = String(control.value ?? '').trim().length;
      if (length > 0 && length < min) return { minlength: { requiredLength: min, actualLength: length } };
      if (length > max) return { maxlength: { requiredLength: max, actualLength: length } };
      return null;
    };
  }

  private errorCode(error: HttpErrorResponse): number | undefined {
    return Number(error.error?.status ?? error.error?.code) || undefined;
  }

  private errorMessage(error: HttpErrorResponse): string {
    switch (this.errorCode(error)) {
      case 1001: return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại biểu mẫu.';
      case 3001: return 'Bài phòng không còn tồn tại.';
      case 3010: return 'Phòng này không còn khả dụng.';
      case 4002: return 'Chỉ người tìm phòng mới có thể dùng tính năng này.';
      default: return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
  }
}
