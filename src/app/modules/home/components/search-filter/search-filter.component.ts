import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { RoomSearchRequest } from '../../../../core/models/post.interface';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Tìm kiếm phòng trọ theo tiêu đề, khu vực..."
          [(ngModel)]="filters.keyword"
          (ngModelChange)="onKeywordChange($event)"
        />
        <button class="clear-btn" *ngIf="filters.keyword" (click)="clearKeyword()">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <button class="filter-toggle-btn" (click)="showFilters = !showFilters" [class.active]="showFilters || hasActiveFilters">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="20" y2="12"/>
          <line x1="12" y1="18" x2="20" y2="18"/>
          <circle cx="6" cy="6" r="2" fill="currentColor"/>
          <circle cx="10" cy="12" r="2" fill="currentColor"/>
          <circle cx="14" cy="18" r="2" fill="currentColor"/>
        </svg>
        Bộ lọc
        <span class="filter-count" *ngIf="activeFilterCount > 0">{{ activeFilterCount }}</span>
      </button>
    </div>

    <!-- Expandable Filters -->
    <div class="filters-panel" [class.expanded]="showFilters">
      <div class="filters-grid">
        <!-- Price Range -->
        <div class="filter-group">
          <label class="filter-label">Khoảng giá</label>
          <div class="price-range">
            <div class="price-input-wrapper">
              <input
                type="number"
                class="filter-input"
                placeholder="Từ"
                [(ngModel)]="filters.minPrice"
                (ngModelChange)="onFilterChange()"
                min="0"
              />
              <span class="price-unit">đ</span>
            </div>
            <span class="range-separator">—</span>
            <div class="price-input-wrapper">
              <input
                type="number"
                class="filter-input"
                placeholder="Đến"
                [(ngModel)]="filters.maxPrice"
                (ngModelChange)="onFilterChange()"
                min="0"
              />
              <span class="price-unit">đ</span>
            </div>
          </div>
          <!-- Quick price buttons -->
          <div class="quick-prices">
            <button
              *ngFor="let range of priceRanges"
              class="quick-price-btn"
              [class.active]="filters.minPrice === range.min && filters.maxPrice === range.max"
              (click)="setPriceRange(range.min, range.max)"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <!-- Area -->
        <div class="filter-group">
          <label class="filter-label">Diện tích (m²)</label>
          <div class="area-buttons">
            <button
              *ngFor="let area of areaOptions"
              class="area-btn"
              [class.active]="filters.targetArea === area.value"
              (click)="setArea(area.value)"
            >
              {{ area.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Actions -->
      <div class="filter-actions">
        <button class="btn-reset" (click)="resetFilters()">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Xóa bộ lọc
        </button>
        <button class="btn-apply" (click)="applyFilters()">
          Áp dụng
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Search Bar */
    .search-bar {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--text-muted, #6b7280);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 12px 40px 12px 44px;
      border: 1.5px solid var(--border-color, #e5e7eb);
      border-radius: var(--radius-lg, 16px);
      font-size: 0.95rem;
      color: var(--text-main, #1f2937);
      background: #fff;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--primary-color, #3179c7);
      box-shadow: 0 0 0 3px rgba(49, 121, 199, 0.12);
    }
    .search-input::placeholder {
      color: var(--text-muted, #6b7280);
    }
    .clear-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted, #6b7280);
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .clear-btn:hover { background: var(--bg-light, #f3f4f6); }

    /* Filter Toggle */
    .filter-toggle-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border: 1.5px solid var(--border-color, #e5e7eb);
      border-radius: var(--radius-lg, 16px);
      background: #fff;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-secondary, #4b5563);
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .filter-toggle-btn:hover { border-color: var(--primary-color, #3179c7); color: var(--primary-color, #3179c7); }
    .filter-toggle-btn.active {
      border-color: var(--primary-color, #3179c7);
      color: var(--primary-color, #3179c7);
      background: rgba(49, 121, 199, 0.05);
    }
    .filter-count {
      background: var(--primary-color, #3179c7);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    /* Filters Panel */
    .filters-panel {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.35s ease, padding 0.35s ease, margin 0.35s ease;
      background: #fff;
      border-radius: var(--radius-md, 8px);
    }
    .filters-panel.expanded {
      max-height: 500px;
      padding: 20px;
      margin-top: 16px;
      border: 1px solid var(--border-color, #e5e7eb);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .filter-group { display: flex; flex-direction: column; gap: 8px; }
    .filter-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main, #1f2937);
    }

    /* Price Range */
    .price-range {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .price-input-wrapper {
      flex: 1;
      position: relative;
    }
    .filter-input {
      width: 100%;
      padding: 8px 30px 8px 12px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--radius-sm, 4px);
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .filter-input:focus { border-color: var(--primary-color, #3179c7); }

    /* Remove spinner for number inputs */
    .filter-input[type="number"]::-webkit-outer-spin-button,
    .filter-input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .filter-input[type="number"] { -moz-appearance: textfield; }

    .price-unit {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: var(--text-muted, #6b7280);
    }
    .range-separator {
      color: var(--text-muted, #6b7280);
      font-size: 0.85rem;
    }

    /* Quick Prices */
    .quick-prices {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .quick-price-btn {
      padding: 4px 10px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 20px;
      background: #fff;
      font-size: 0.75rem;
      color: var(--text-secondary, #4b5563);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .quick-price-btn:hover { border-color: var(--primary-color, #3179c7); color: var(--primary-color, #3179c7); }
    .quick-price-btn.active {
      background: var(--primary-color, #3179c7);
      color: #fff;
      border-color: var(--primary-color, #3179c7);
    }

    /* Area Buttons */
    .area-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .area-btn {
      padding: 6px 14px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 20px;
      background: #fff;
      font-size: 0.8rem;
      color: var(--text-secondary, #4b5563);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .area-btn:hover { border-color: var(--primary-color, #3179c7); color: var(--primary-color, #3179c7); }
    .area-btn.active {
      background: var(--primary-color, #3179c7);
      color: #fff;
      border-color: var(--primary-color, #3179c7);
    }

    /* Filter Actions */
    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .btn-reset {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      background: #fff;
      font-size: 0.85rem;
      color: var(--text-secondary, #4b5563);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-reset:hover { background: var(--bg-light, #f3f4f6); }
    .btn-apply {
      padding: 8px 24px;
      border: none;
      border-radius: var(--radius-md, 8px);
      background: var(--primary-color, #3179c7);
      color: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-apply:hover { background: #2563c0; }

    @media (max-width: 768px) {
      .search-bar { flex-direction: column; }
      .filter-toggle-btn { width: 100%; justify-content: center; }
      .filters-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<RoomSearchRequest>();

  filters: RoomSearchRequest = {};
  showFilters = false;

  private keywordSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  priceRanges = [
    { label: '< 2 triệu', min: 0, max: 2_000_000 },
    { label: '2 - 4 triệu', min: 2_000_000, max: 4_000_000 },
    { label: '4 - 6 triệu', min: 4_000_000, max: 6_000_000 },
    { label: '6 - 10 triệu', min: 6_000_000, max: 10_000_000 },
    { label: '> 10 triệu', min: 10_000_000, max: undefined as unknown as number },
  ];

  areaOptions = [
    { label: '< 20m²', value: 15 },
    { label: '20 - 30m²', value: 25 },
    { label: '30 - 50m²', value: 40 },
    { label: '50 - 70m²', value: 60 },
    { label: '> 70m²', value: 80 },
  ];

  ngOnInit(): void {
    this.keywordSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.emitSearch();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onKeywordChange(value: string): void {
    this.keywordSubject.next(value);
  }

  clearKeyword(): void {
    this.filters.keyword = '';
    this.emitSearch();
  }

  onFilterChange(): void {
    // Called by ngModelChange on inputs — does NOT auto-emit.
    // User must click "Áp dụng" or we debounce keyword.
  }

  setPriceRange(min: number, max: number): void {
    if (this.filters.minPrice === min && this.filters.maxPrice === max) {
      this.filters.minPrice = undefined;
      this.filters.maxPrice = undefined;
    } else {
      this.filters.minPrice = min;
      this.filters.maxPrice = max || undefined;
    }
  }

  setArea(value: number): void {
    this.filters.targetArea = this.filters.targetArea === value ? undefined : value;
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.minPrice != null || this.filters.maxPrice != null) count++;
    if (this.filters.targetArea != null) count++;
    if (this.filters.provinceCode) count++;
    return count;
  }

  applyFilters(): void {
    this.emitSearch();
  }

  resetFilters(): void {
    this.filters = {};
    this.emitSearch();
  }

  private emitSearch(): void {
    this.search.emit({ ...this.filters });
  }
}
