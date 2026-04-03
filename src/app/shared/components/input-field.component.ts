import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  template: `
    <div *ngIf="formControl" class="input-field-container ">
      <label class="form-label" *ngIf="label">
        {{ label }}
        <span *ngIf="required" class="text-danger">*</span>
      </label>

      <div
        class="input-wrapper"
        [class.is-invalid]="isInvalid"
        [class.disabled]="disabled"
        [class.read-only]="readOnly"
        [class.has-before]="!!beforeInput"
      >
        <span
          *ngIf="beforeInput"
          class="before-input text-muted small"
        >
          {{ beforeInput }}
        </span>
        <ng-container *ngIf="!multiline; else textareaTpl">
          <input
            [type]="nativeType"
            [min]="min"
            [max]="max"
            class="flex-input"
            [placeholder]="placeholder"
            [ngClass]="{
              'is-invalid': formControl.invalid && formControl.touched
            }"
            [value]="displayValue"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (blur)="onBlur($event)"
            (focus)="onFocus($event)"
            [disabled]="disabled"
            [readOnly]="readOnly"
            [attr.maxlength]="maxLength || null"
          />
        </ng-container>
        <ng-template #textareaTpl>
          <textarea
            class="flex-input textarea-input"
            [placeholder]="placeholder"
            [ngClass]="{
              'is-invalid': formControl.invalid && formControl.touched
            }"
            [value]="displayValue"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (blur)="onBlur($event)"
            (focus)="onFocus($event)"
            [disabled]="disabled"
            [readOnly]="readOnly"
            [attr.maxlength]="maxLength || null"
            [attr.rows]="rows"
          ></textarea>
        </ng-template>

        <span
          class="char-count text-muted small"
          *ngIf="showCharCount && maxLength"
        >
          {{ currentLength }} / {{ maxLength }}
        </span>

        <span
          *ngIf="afterInput && !(showCharCount && maxLength)"
          class="after-input text-muted small"
        >
          {{ afterInput }}
        </span>
      </div>

      <div
        *ngIf="formControl.invalid && formControl.touched"
        class="invalid-feedback"
        style="display: block;"
      >
        <div
          *ngFor="let errorKey of objectKeys(formControl.errors)"
          style="text-align: end"
        >
          <ng-container *ngIf="errorKey === 'min'">
            Giá trị phải lớn hơn hoặc bằng {{ min }}
          </ng-container>

          <ng-container *ngIf="errorKey === 'max'">
            Giá trị phải nhỏ hơn hoặc bằng {{ max }}
          </ng-container>

          <ng-container *ngIf="errorKey === 'required'">
            Trường này là bắt buộc
          </ng-container>

          <ng-container *ngIf="customErrors[errorKey]">
            {{ customErrors[errorKey]}}
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .input-field-container{
        position: relative;
        width: 100%;
        & .invalid-feedback {
          margin-top: 4px;
          width: 100%;
          font-size: 12px;
          line-height: 1.4;
        }
      }

      .form-label {
        font-size: 14px;
        line-height: 20px;
        font-weight: 400;
        color: var(--text-label);
      }

      .input-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background-color: white;
        transition: border-color 0.2s ease;
        padding-right: 12px;

        &:hover {
          border-color: var(--primary-hover);
        }

        &:focus-within {
          border-color: #0d6efd;
          outline: none;
        }

        &.is-invalid {
          border-color: var(--danger-color);
        }

        &.disabled {
          background-color: var(--light-color);
          border-color: var(--border-color);
          cursor: not-allowed;
          opacity: 1;
        }

        &.read-only {
          border-color: var(--border-color) !important;
          background-color: transparent !important;
          cursor: default !important;
        }
      }

      .flex-input {
        flex: 1;
        border: none;
        outline: none;
        padding: 10px 14px;
        font-size: 14px;
        background: transparent;
        min-width: 0;

        &::placeholder {
          color: #6c757d;
        }

        &[disabled] {
          background-color: var(--light-color) !important;
          color: var(--text-muted);
          cursor: not-allowed;
        }

        &[type='number'] {
          padding-right: 8px;
        }
      }

      .char-count,
      .after-input {
        padding: 0 8px;
        font-size: 0.875em;
        color: #6c757d;
        white-space: nowrap;
        pointer-events: none;
        flex-shrink: 0;
      }

      .before-input {
        padding: 0 8px 0 12px;
        font-size: 0.875em;
        color: #6c757d;
        white-space: nowrap;
        pointer-events: none;
        flex-shrink: 0;
      }

      .input-wrapper.has-before .flex-input {
        padding-left: 0;
      }

      .textarea-input {
        min-height: 96px;
        resize: vertical;
      }

      .input-wrapper.is-invalid {
        border-color: var(--danger-color);
      }
    `,
  ],
})
export class InputFieldComponent {
  @Input({ required: true }) control!: AbstractControl<any, any>;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() maxLength?: number;
  @Input() afterInput = '';
  @Input() beforeInput = '';
  @Input() customErrors: { [key: string]: string } = {};
  @Input() showCharCount = false;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() multiline = false;
  @Input() rows = 3;
  @Input() inputMode?: 'numeric';
  @Input() hiddenInfo?: string;

  @Input() type:
    | 'text'
    | 'email'
    | 'password'
    | 'date'
    | 'number'
    | 'decimal'
    | 'currency' = 'text';

  @Input() decimalFormat: { integer: number; decimal: number } = {
    integer: 1000,
    decimal: 2,
  };

  @Input() thousandSeparator: string = ',';
  @Input() decimalSeparator: string = '.';
  @Input() autoFormatOnBlur = true;
  @Output() onBlurInput = new EventEmitter<Event>();
  @Output() onChange = new EventEmitter<any>();

  private isFocusing = false;
  private rawValue: string | null = null;

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  get formControl(): FormControl {
    return this.control as FormControl;
  }

  get nativeType(): string {
    if (['text', 'email', 'password', 'date', 'number'].includes(this.type))
      return this.type;
    return 'text';
  }

  get displayValue(): string {
    const value = this.formControl.value;
    if (value === null || value === undefined || value === '') return '';

    if (!['decimal', 'currency'].includes(this.type)) return value;

    if (this.isFocusing && this.rawValue !== null) {
      return this.rawValue;
    }

    if (this.autoFormatOnBlur) {
      return this.formatNumberCustom(value);
    }

    return value;
  }

  get currentLength(): number {
    const value = this.formControl.value;
    return value ? String(value).length : 0;
  }

  get isInvalid(): boolean {
    return this.formControl.invalid && this.formControl.touched;
  }

  onFocus(_: Event) {
    this.isFocusing = true;
    if (['decimal', 'currency'].includes(this.type)) {
      this.rawValue = this.formControl.value ?? '';
    }
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value;

    if (this.inputMode === 'numeric') {
      val = val.replace(/[^0-9]/g, '');
    } else if (['number', 'decimal', 'currency'].includes(this.type)) {
      const cleaned = val.replace(/[^0-9.,]/g, '');
      const decimalsAllowed = this.decimalFormat.decimal > 0;
      const separator = cleaned.includes(',') ? ',' : '.';
      let displayValue = '';
      let keepTrailingSeparator = false;

      if (!decimalsAllowed) {
        displayValue = cleaned.replace(/[.,]/g, '');
      } else {
        const sepIndex = cleaned.search(/[.,]/);
        if (sepIndex >= 0) {
          const head = cleaned.slice(0, sepIndex).replace(/[.,]/g, '');
          const tail = cleaned.slice(sepIndex + 1).replace(/[.,]/g, '');
          keepTrailingSeparator = sepIndex === cleaned.length - 1;
          displayValue = `${head}${separator}${tail}`;
        } else {
          displayValue = cleaned;
        }
      }

      const normalized = displayValue.replace(/,/g, '.');
      const [intPart, decPart = ''] = normalized.split('.');
      const integer = intPart.slice(0, this.decimalFormat.integer);
      const decimal = decPart.slice(0, this.decimalFormat.decimal);
      val = decimal ? `${integer}.${decimal}` : integer;
      displayValue = decimal
        ? `${integer}${separator}${decimal}`
        : integer;

      if (decimalsAllowed && keepTrailingSeparator && decimal.length === 0) {
        displayValue = `${integer}${separator}`;
      }

      this.rawValue = displayValue;
      input.value = displayValue;
    }

    if (this.min !== undefined || this.max !== undefined) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (this.min !== undefined && num < this.min) {
          input.value = this.formControl.value || '';
          return;
        }
        if (this.max !== undefined && num > this.max) {
          input.value = this.formControl.value || '';
          return;
        }
      }
    }

    this.formControl.setValue(val);
    if (!['number', 'decimal', 'currency'].includes(this.type)) {
      input.value = val;
    }
    this.onChange.emit(val);
  }

  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (this.step && ['number', 'decimal', 'currency'].includes(this.type)) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const rawValue = this.formControl.value ?? '0';
        const normalized = String(rawValue).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
        const currentValue = Number(normalized) || 0;
        const stepValue = this.step ?? 1;

        let nextValue = event.key === 'ArrowUp'
          ? currentValue + stepValue
          : currentValue - stepValue;

        if (this.min !== undefined) {
          nextValue = Math.max(this.min, nextValue);
        }
        if (this.max !== undefined) {
          nextValue = Math.min(this.max, nextValue);
        }

        const decimals = ['decimal', 'currency'].includes(this.type)
          ? this.decimalFormat.decimal
          : 0;
        const fixedValue = decimals > 0
          ? Number(nextValue.toFixed(decimals))
          : Math.round(nextValue);

        this.formControl.setValue(fixedValue);
        const displayValue = ['decimal', 'currency'].includes(this.type)
          ? this.formatNumberCustom(fixedValue)
          : String(fixedValue);
        (event.target as HTMLInputElement).value = displayValue;
        this.onChange.emit(fixedValue);
        return;
      }
    }

    if (this.inputMode === 'numeric') {
      if (!/\d/.test(event.key)) {
        event.preventDefault();
      }
      return;
    }

    if (['number', 'decimal', 'currency'].includes(this.type)) {
      const decimalsAllowed = this.decimalFormat.decimal > 0;
      const isSeparator = event.key === '.' || event.key === ',';
      if (!/\d/.test(event.key) && !(decimalsAllowed && isSeparator)) {
        event.preventDefault();
      }
    }
  }

  onBlur(event: Event) {
    this.isFocusing = false;
    this.rawValue = null;
    this.onBlurInput.emit(event);
    this.formControl.markAsTouched();

    const shouldFormat = ['number', 'decimal'].includes(this.type);
    if (!shouldFormat) return;

    const value = this.formControl.value;
    if (value === null || value === undefined || value === '' || value === '0')
      return;

    const num = Number(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return;

    const fixed = num.toFixed(this.decimalFormat.decimal);
    this.formControl.setValue(Number(fixed));

    if (this.autoFormatOnBlur) {
      const formatted = this.formatNumberCustom(fixed);
      (event.target as HTMLInputElement).value = formatted;
    }
  }

  private formatNumberCustom(value: any): string {
    if (value === '' || value === null || value === undefined) return '';
    let s = String(value).replace(/[^0-9.]/g, '');
    const [rawInt, rawDec = ''] = s.split('.');

    const intPart = rawInt.slice(0, this.decimalFormat.integer);
    const decPart = rawDec.slice(0, this.decimalFormat.decimal);

    const intWithSep = intPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      this.thousandSeparator
    );

    if (decPart.length > 0) {
      return `${intWithSep}${this.decimalSeparator}${decPart}`;
    }
    return intWithSep;
  }
}

// USE
// <app-input-field
//   [control]="form.controls['email']"
//   label="Email"
//   type="email"
//   placeholder="example@gmail.com"
// ></app-input-field>
// <app-input-field
//   [control]="form.controls['password']"
//   label="Mật khẩu"
//   placeholder="Nhập mật khẩu"
//   type="password"
// ></app-input-field>
// <app-input-field
//   [control]="form.controls['price']"
//   label="Giá tiền"
//   type="currency"
//   afterInput="₫"
//   placeholder="Nhập giá tiền"
// ></app-input-field>
// <app-input-field
//   [control]="form.controls['percent']"
//   label="Tỷ lệ"
//   type="decimal"
//   afterInput="%"
//   placeholder="Nhập tỉ lệ"
//   [decimalFormat]="{ integer: 3, decimal: 2 }"
// ></app-input-field>
