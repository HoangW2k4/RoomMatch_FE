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

  // Resolved location names (returned from popup on apply)
  provinceName = '';
  districtName = '';
  wardName = '';

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
      { label: 'Điều hoà', code: 'ac', icon: 'assets/icons/ic_air_condition.svg', active: false },
      { label: 'Tủ lạnh', code: 'refrigerator', icon: 'assets/icons/ic_amenity_refrigerator.svg', active: false },
      { label: 'Bếp riêng', code: 'kitchen', icon: 'assets/icons/ic_kitchen.svg', active: false },
      { label: 'Chỗ để xe', code: 'parking', icon: 'assets/icons/ic_amenity_parking.svg', active: false },
      { label: 'An ninh 24/7', code: 'security', icon: 'assets/icons/ic_amenity_security.svg', active: false },
      { label: 'Wifi', code: 'wifi', icon: 'assets/icons/ic_amenity_wifi.svg', active: false },
      { label: 'Máy giặt', code: 'washing_machine', icon: 'assets/icons/ic_amenity_washing_machine.svg', active: false },
      { label: 'Ban công', code: 'balcony', icon: 'assets/icons/ic_amenity_balcony.svg', active: false },
      { label: 'Khu phơi đồ', code: 'drying_area', icon: 'assets/icons/ic_amenity_drying_area.svg', active: false },
      { label: 'Tủ quần áo', code: 'wardrobe', icon: 'assets/icons/ic_amenity_wardrobe.svg', active: false },
      { label: 'Phòng Gym', code: 'gym', icon: 'assets/icons/ic_gym.svg', active: false },
      { label: 'Thang máy', code: 'elevator', icon: 'assets/icons/ic_elevator.svg', active: false },
      { label: 'Báo cháy / Nội thất', code: 'fire_alarm', icon: 'assets/icons/ic_amenity_fire_alarm.svg', active: false },
      { label: 'Giường ngủ', code: 'bed', icon: 'assets/icons/ic_bed.svg', active: false },
      { label: 'Camera an ninh', code: 'camera', icon: 'assets/icons/ic_camera.svg', active: false },
      { label: 'Cho phép thú cưng', code: 'pet', icon: 'assets/icons/ic_pet.svg', active: false },
      { label: 'Bình nóng lạnh', code: 'heater', icon: 'assets/icons/ic_heater.svg', active: false }
    ];
  }

  get previewChips(): AmenityChip[] { return this.amenityChips.slice(0, 3); }
  get hiddenChipsCount(): number { return this.amenityChips.length - 3; }
  get activeAmenityChips(): AmenityChip[] { return this.amenityChips.filter(c => c.active); }
  get inactiveAmenityCount(): number { return this.amenityChips.filter(c => !c.active).length; }

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
    return this.provinceName || this.provinces.find(x => x.code === this.filters.provinceCode)?.name || 'Tỉnh';
  }
  getDistrictLabel(): string {
    if (!this.filters.districtCode) return 'Quận / Huyện';
    return this.districtName || 'Quận / Huyện';
  }
  getWardLabel(): string {
    if (!this.filters.wardCode) return 'Phường / Xã';
    return this.wardName || 'Phường / Xã';
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
    // Store resolved names from popup
    this.provinceName = result.provinceName ?? '';
    this.districtName = result.districtName ?? '';
    this.wardName = result.wardName ?? '';
    this.isRoommateMode = result.isRoommateMode ?? false;
    // Sync amenity active states
    const activeCodes = new Set(result.amenityCodes ?? []);
    this.amenityChips = this.buildAmenityChips().map(c => ({ ...c, active: activeCodes.has(c.code) }));
    // Emit search
    this.emitSearch();
  }



  // ======= Remove filter helpers =======
  removeProvince(event: Event): void {
    event.stopPropagation();
    this.filters.provinceCode = undefined;
    this.filters.districtCode = undefined;
    this.filters.wardCode = undefined;
    this.provinceName = '';
    this.districtName = '';
    this.wardName = '';
    this.emitSearch();
  }

  removeDistrict(event: Event): void {
    event.stopPropagation();
    this.filters.districtCode = undefined;
    this.filters.wardCode = undefined;
    this.districtName = '';
    this.wardName = '';
    this.emitSearch();
  }

  removeWard(event: Event): void {
    event.stopPropagation();
    this.filters.wardCode = undefined;
    this.wardName = '';
    this.emitSearch();
  }

  removePrice(event: Event): void {
    event.stopPropagation();
    this.filters.minPrice = undefined;
    this.filters.maxPrice = undefined;
    this.emitSearch();
  }

  removeAmenity(event: Event, chip: AmenityChip): void {
    event.stopPropagation();
    chip.active = false;
    this.emitSearch();
  }

  // ======= Keyword =======
  onKeywordChange(v: string): void { this.keywordSubject.next(v); }
  clearKeyword(): void { this.filters.keyword = ''; this.emitSearch(); }
  applyFilters(): void { this.emitSearch(); }

  private emitSearch(): void { this.search.emit({ ...this.filters }); }
}
