import {
  Component, Output, EventEmitter, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { RoomSearchRequest, Province, District, Ward } from '../../../../core/models/post.interface';
import { ApiService } from '../../../../core/services/api.service';
import {
  FilterPopupComponent,
  AmenityChip, AppliedFilters
} from './filter-popup/filter-popup.component';

interface FilterTag { key: string; label: string; }

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPopupComponent],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<RoomSearchRequest>();

  // Applied filters (shown in tags, sent to parent)
  filters: RoomSearchRequest = {};
  isRoommateMode = false;

  showFilterPopup = false;
  activeFilterTags: FilterTag[] = [];

  private keywordSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  userAvatar = 'assets/images/avatar_default.jpg';
  searchPlaceholder = 'Bạn đang tìm phòng như thế nào?';

  // Location data (for label display after apply)
  provinces: Province[] = [];
  districts: District[] = [];
  wards: Ward[] = [];

  amenityChips: AmenityChip[] = this.buildAmenityChips();

  // Used to build the AppliedFilters object passed to popup as initialFilters
  get appliedFilters(): AppliedFilters {
    return {
      ...this.filters,
      isRoommateMode: this.isRoommateMode,
      amenityCodes: this.amenityChips.filter(c => c.active).map(c => c.code),
    };
  }

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.keywordSubject.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.emitSearch());
    this.loadUserAvatar();
    this.loadProvinces();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ======= Chip build =======
  private buildAmenityChips(): AmenityChip[] {
    return [
      { label: 'Điều hoà', code: 'AC', icon: 'assets/icons/ic_amenity_ac.svg', active: false },
      { label: 'Tủ lạnh', code: 'refrigerator', icon: 'assets/icons/ic_amenity_refrigerator.svg', active: false },
      { label: 'Bếp riêng', code: 'kitchen', icon: 'assets/icons/ic_kitchen.svg', active: false },
      { label: 'Chỗ để xe', code: 'parking', icon: 'assets/icons/ic_amenity_parking.svg', active: false },
      { label: 'An ninh 24/7', code: 'security', icon: 'assets/icons/ic_amenity_security.svg', active: false },
      { label: 'Wifi', code: 'wifi', icon: 'assets/icons/ic_amenity_wifi.svg', active: false },
      { label: 'Máy giặt', code: 'washing_machine', icon: 'assets/icons/ic_amenity_washing_machine.svg', active: false },
      { label: 'Ban công', code: 'balcony', icon: 'assets/icons/ic_amenity_balcony.svg', active: false },
      { label: 'Khu phơi đồ', code: 'drying_area', icon: 'assets/icons/ic_amenity_drying_area.svg', active: false },
      { label: 'Tủ quần áo', code: 'wardrobe', icon: 'assets/icons/ic_amenity_wardrobe.svg', active: false },
    ];
  }

  get previewChips(): AmenityChip[] { return this.amenityChips.slice(0, 3); }
  get hiddenChipsCount(): number { return this.amenityChips.length - 3; }

  // ======= User avatar =======
  private loadUserAvatar(): void {
    try {
      const s = localStorage.getItem('user');
      if (s) {
        const u = JSON.parse(s);
        if (u.avatarUrl) this.userAvatar = u.avatarUrl;
        if (u.name) this.searchPlaceholder = `Bạn đang tìm phòng như thế nào, ${u.name.split(' ').pop()}?`;
      }
    } catch { }
  }

  private loadProvinces(): void {
    this.api.get<Province[]>('/location/provinces').subscribe({
      next: (d) => { this.provinces = d; },
      error: () => { }
    });
  }

  // ======= Display label helpers =======
  getProvinceLabel(): string {
    if (!this.filters.provinceCode) return 'Tỉnh';
    return this.provinces.find(x => x.code === this.filters.provinceCode)?.name ?? 'Tỉnh';
  }
  getDistrictLabel(): string {
    if (!this.filters.districtCode) return 'Quận / Huyện';
    return this.districts.find(x => x.code === this.filters.districtCode)?.name ?? 'Quận / Huyện';
  }
  getWardLabel(): string {
    if (!this.filters.wardCode) return 'Phường / Xã';
    return this.wards.find(x => x.code === this.filters.wardCode)?.name ?? 'Phường / Xã';
  }
  getPriceLabel(): string {
    if (this.filters.minPrice == null && this.filters.maxPrice == null) return 'Khoảng giá';
    const min = this.filters.minPrice != null ? (this.filters.minPrice / 1_000_000).toFixed(0) + 'tr' : '0';
    const max = this.filters.maxPrice != null ? (this.filters.maxPrice / 1_000_000).toFixed(0) + 'tr' : '+';
    return `${min} – ${max}`;
  }

  // ======= Popup =======
  openFilterPopup(): void { this.showFilterPopup = true; }

  onFilterApply(result: AppliedFilters): void {
    // Sync filters
    this.filters = {
      keyword: result.keyword,
      provinceCode: result.provinceCode,
      districtCode: result.districtCode,
      wardCode: result.wardCode,
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
    };
    this.isRoommateMode = result.isRoommateMode ?? false;
    // Sync amenity active states
    const activeCodes = new Set(result.amenityCodes ?? []);
    this.amenityChips = this.buildAmenityChips().map(c => ({ ...c, active: activeCodes.has(c.code) }));
    // Build tags
    this.buildActiveFilterTags();
    // Emit search
    this.emitSearch();
  }

  private buildActiveFilterTags(): void {
    const tags: FilterTag[] = [];
    if (this.filters.provinceCode) {
      const p = this.provinces.find(x => x.code === this.filters.provinceCode);
      if (p) tags.push({ key: 'province', label: p.name });
    }
    if (this.filters.districtCode) {
      tags.push({ key: 'district', label: this.getDistrictLabel() });
    }
    if (this.filters.wardCode) {
      tags.push({ key: 'ward', label: this.getWardLabel() });
    }
    if (this.filters.minPrice != null || this.filters.maxPrice != null) {
      tags.push({ key: 'price', label: this.getPriceLabel() });
    }
    this.amenityChips.filter(c => c.active).forEach(c =>
      tags.push({ key: 'amenity_' + c.code, label: c.label })
    );
    if (this.isRoommateMode) tags.push({ key: 'roommate', label: 'Ở ghép' });
    this.activeFilterTags = tags;
  }

  removeFilterTag(tag: FilterTag): void {
    switch (tag.key) {
      case 'province':
        this.filters.provinceCode = undefined;
        this.filters.districtCode = undefined;
        this.filters.wardCode = undefined;
        this.activeFilterTags = this.activeFilterTags.filter(t => !['province', 'district', 'ward'].includes(t.key));
        break;
      case 'district':
        this.filters.districtCode = undefined;
        this.filters.wardCode = undefined;
        this.activeFilterTags = this.activeFilterTags.filter(t => !['district', 'ward'].includes(t.key));
        break;
      case 'ward':
        this.filters.wardCode = undefined;
        this.activeFilterTags = this.activeFilterTags.filter(t => t.key !== 'ward');
        break;
      case 'price':
        this.filters.minPrice = undefined;
        this.filters.maxPrice = undefined;
        this.activeFilterTags = this.activeFilterTags.filter(t => t.key !== 'price');
        break;
      case 'roommate':
        this.isRoommateMode = false;
        this.activeFilterTags = this.activeFilterTags.filter(t => t.key !== 'roommate');
        break;
      default:
        if (tag.key.startsWith('amenity_')) {
          const code = tag.key.replace('amenity_', '');
          const chip = this.amenityChips.find(c => c.code === code);
          if (chip) chip.active = false;
          this.activeFilterTags = this.activeFilterTags.filter(t => t.key !== tag.key);
        }
    }
    this.emitSearch();
  }

  // ======= Keyword =======
  onKeywordChange(v: string): void { this.keywordSubject.next(v); }
  clearKeyword(): void { this.filters.keyword = ''; this.emitSearch(); }
  applyFilters(): void { this.emitSearch(); }

  private emitSearch(): void { this.search.emit({ ...this.filters }); }
}
