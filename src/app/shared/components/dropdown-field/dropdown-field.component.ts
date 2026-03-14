import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ElementRef,
  QueryList,
  ViewChildren,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dropdown-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-field.component.html',
  styleUrls: ['./dropdown-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownFieldComponent<T>
  implements OnInit, OnDestroy, AfterViewInit
{
  private readonly document = inject(DOCUMENT);
  constructor(private hostRef: ElementRef<HTMLElement>) {}
  @ViewChildren('itemMainText', { read: ElementRef })
  private itemMainTexts!: QueryList<ElementRef<HTMLElement>>;
  placeholder = input<string>('Chọn');
  showPlaceholder = input<boolean>(true);
  searchPlaceholder = input<string>('Tìm kiếm...');
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  error = input<boolean>(true);
  items = input<T[]>([]);
  value = input<T | T[] | null>(null);
  searchable = input<boolean>(true);
  panelMaxHeight = input<number>(256);
  direction = input<'up' | 'down'>('down');
  multiple = input<boolean>(false);
  required = input<boolean>(false);
  requiredMessage = input<string>();

  displayWith = input<(item: T) => string>((item: T) => String(item ?? ''));
  secondaryWith = input<((item: T) => string) | null>(null);
  compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);

  valueChange = output<T | T[]>();
  openedChange = output<boolean>();

  private itemTextChangeSub: Subscription | null = null;

  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  touched = signal<boolean>(false);

  isAllSelected = computed<boolean>(() => {
    if (!this.multiple()) return false;
    const selected = Array.isArray(this.value()) ? (this.value() as T[]) : [];
    const items = this.filteredItems();
    if (!selected.length || !items.length) return false;
    const compare = this.compareWith();
    return items.every((item) => selected.some((val) => compare(val, item)));
  });

  filteredItems = computed<T[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.items() || [];
    if (!term) return list;
    const display = this.displayWith();
    return list.filter((it: T) => display(it).toLowerCase().includes(term));
  });

  selectedLabel = computed<string | null>(() => {
    const current = this.value();
    if (current === null || current === undefined) return null;

    const display = this.displayWith();
    if (this.multiple()) {
      const values = Array.isArray(current) ? current : [current];
      const found = (this.items() || []).filter((it) =>
        values.some((val) => this.compareWith()(val, it))
      );
      return found.length > 0 ? found.map(display).join(', ') : null;
    } else {
      if (Array.isArray(current)) return null;
      const found = (this.items() || []).find((it) =>
        this.compareWith()(current as T, it)
      );
      return found !== undefined
        ? display(found)
        : current
        ? display(current as T)
        : null;
    }
  });

  isEmpty = computed<boolean>(() => {
    const current = this.value();
    if (current === null || current === undefined) return true;
    if (Array.isArray(current)) return current.length === 0;
    return false;
  });

  showRequiredError = computed<boolean>(() => {
    return this.required() && this.isEmpty() && this.touched();
  });

  panelDirection = computed<'up' | 'down'>(() => {
    return this.direction();
  });

  private onDocumentClick = (ev: Event) => {
    if (!this.isOpen()) return;
    const target = ev.target as Node | null;
    const host = this.hostRef.nativeElement as HTMLElement | null;
    if (host && target && !host.contains(target)) {
      this.closePanel();
    }
  };

  ngOnInit(): void {
    this.document.addEventListener('click', this.onDocumentClick, true);
  }

  ngAfterViewInit(): void {
    this.itemTextChangeSub = this.itemMainTexts.changes.subscribe(() => {
      this.scheduleScrollableLabelUpdate();
    });
    this.scheduleScrollableLabelUpdate();
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('click', this.onDocumentClick, true);
    this.itemTextChangeSub?.unsubscribe();
  }

  onToggleOpen(): void {
    if (this.disabled() || this.readonly()) return;
    this.isOpen.set(!this.isOpen());
    this.openedChange.emit(this.isOpen());
    if (!this.isOpen()) {
      this.searchTerm.set('');
    } else {
      this.scheduleScrollableLabelUpdate();
    }
  }

  closePanel(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.openedChange.emit(false);
    this.searchTerm.set('');
    this.touched.set(true);
  }

  onSelect(item: T): void {
    if (this.multiple()) {
      const currentValue = Array.isArray(this.value())
        ? (this.value() as T[])
        : [];
      const isSelected = currentValue.some((val) =>
        this.compareWith()(val, item)
      );
      let newValue: T[];
      if (isSelected) {
        newValue = currentValue.filter((val) => !this.compareWith()(val, item));
      } else {
        newValue = [...currentValue, item];
      }
      this.valueChange.emit(newValue);
    } else {
      this.valueChange.emit(item);
      this.closePanel();
    }
  }

  onCheckboxClick(item: T, event: Event): void {
    event.stopPropagation(); // Ngăn sự kiện click lan ra button
    this.onSelect(item); // Gọi hàm onSelect để xử lý logic chọn/bỏ chọn
  }

  toggleSelectAll(): void {
    if (this.readonly() || this.disabled() || !this.multiple()) return;

    const current = Array.isArray(this.value()) ? [...(this.value() as T[])] : [];
    const filtered = this.filteredItems();
    const compare = this.compareWith();

    if (this.isAllSelected()) {
      const newValue = current.filter(
        (val) => !filtered.some((item) => compare(val, item))
      );
      this.valueChange.emit(newValue);
      return;
    }

    const newValue = [...current];
    filtered.forEach((item) => {
      if (!newValue.some((val) => compare(val, item))) {
        newValue.push(item);
      }
    });
    this.valueChange.emit(newValue);
  }

  isSelected(item: T): boolean {
    const currentValue = this.value();
    if (currentValue === null || currentValue === undefined) return false;

    if (this.multiple()) {
      const values = Array.isArray(currentValue)
        ? currentValue
        : [currentValue];
      return values.some((val) => this.compareWith()(val, item));
    } else {
      try {
        return this.compareWith()(currentValue as T, item);
      } catch {
        return false;
      }
    }
  }

  private scheduleScrollableLabelUpdate(): void {
    requestAnimationFrame(() => this.updateScrollableLabels());
  }

  private updateScrollableLabels(): void {
    if (!this.itemMainTexts) return;
    this.itemMainTexts.forEach((ref) => {
      const el = ref.nativeElement;
      const canScroll = el.scrollWidth > el.clientWidth;
      el.dataset['scrollable'] = canScroll ? 'true' : 'false';
    });
  }
}
