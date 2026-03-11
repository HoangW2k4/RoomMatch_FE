import {
    Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
    Province, District, Ward
} from '../../../../../core/models/post.interface';
import { ApiService } from '../../../../../core/services/api.service';
import { PopupComponent } from '../../../../../shared/components/popup';
import { DropdownFieldComponent } from '../../../../../shared/components/dropdown-field/dropdown-field.component';

// --- shared interfaces, re-exported for parent use ---
export interface AmenityChip { label: string; code: string; icon: string; active: boolean; }
export interface PriceRange { label: string; min: number; max: number | undefined; }
export interface FilterDraft {
    keyword?: string;
    provinceCode?: string;
    districtCode?: string;
    wardCode?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    // Roommate fields
    gender?: string;
    minAge?: number;
    maxAge?: number;
}
export interface AppliedFilters {
    keyword?: string;
    provinceCode?: string;
    districtCode?: string;
    wardCode?: string;
    minPrice?: number;
    maxPrice?: number;
    isRoommateMode?: boolean;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    amenityCodes?: string[];
}

@Component({
    selector: 'app-filter-popup',
    standalone: true,
    imports: [CommonModule, FormsModule, PopupComponent, DropdownFieldComponent],
    templateUrl: './filter-popup.component.html',
    styleUrls: ['./filter-popup.component.css']
})
export class FilterPopupComponent implements OnInit, OnDestroy, OnChanges {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    @Input() isRoommateMode = false;
    @Output() isRoommateModeChange = new EventEmitter<boolean>();

    @Output() apply = new EventEmitter<AppliedFilters>();

    @Input() initialFilters: AppliedFilters = {};
    @Input() allAmenityChips: AmenityChip[] = [];

    provinces: Province[] = [];
    modalDistricts: District[] = [];
    modalWards: Ward[] = [];

    selectedProvince: Province | null = null;
    selectedDistrict: District | null = null;
    selectedWard: Ward | null = null;

    draft: FilterDraft = {};
    draftAmenities: AmenityChip[] = [];
    draftMinPriceStr = '';
    draftMaxPriceStr = '';

    // Dropdown helpers
    locationDisplay = (item: Province | District | Ward) => item.name;
    locationCompare = (a: Province | District | Ward, b: Province | District | Ward) => a.code === b.code;

    private destroy$ = new Subject<void>();

    readonly GENDERS = [
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
    ];

    readonly PRICE_RANGES: PriceRange[] = [
        { label: 'Dưới 2 triệu', min: 0, max: 2_000_000 },
        { label: '2 – 4 triệu', min: 2_000_000, max: 4_000_000 },
        { label: '4 – 6 triệu', min: 4_000_000, max: 6_000_000 },
        { label: '6 – 10 triệu', min: 6_000_000, max: 10_000_000 },
        { label: 'Trên 10 triệu', min: 10_000_000, max: undefined },
    ];

    constructor(private api: ApiService) { }

    ngOnInit(): void {
        this.loadProvinces();
    }

    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    // Called by popup's (closed) event
    onPopupClosed(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    // Called whenever visible changes from parent (@Input)
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) this.initDraft();
    }

    private initDraft(): void {
        this.draft = {
            keyword: this.initialFilters.keyword,
            provinceCode: this.initialFilters.provinceCode,
            districtCode: this.initialFilters.districtCode,
            wardCode: this.initialFilters.wardCode,
            minPrice: this.initialFilters.minPrice,
            maxPrice: this.initialFilters.maxPrice,
            gender: this.initialFilters.gender,
            minAge: this.initialFilters.minAge,
            maxAge: this.initialFilters.maxAge,
        };
        this.draftMinPriceStr = this.formatVND(this.draft.minPrice);
        this.draftMaxPriceStr = this.formatVND(this.draft.maxPrice);
        // Clone amenity active states from parent chips
        this.draftAmenities = this.allAmenityChips.map(c => ({ ...c }));
        // Resolve selected location objects from codes
        this.selectedProvince = this.provinces.find(p => p.code === this.draft.provinceCode) ?? null;
        this.selectedDistrict = null;
        this.selectedWard = null;
        // Preload districts/wards if province/district already chosen
        this.modalDistricts = [];
        this.modalWards = [];
        if (this.draft.provinceCode) this.loadDistricts(this.draft.provinceCode);
    }

    private loadProvinces(): void {
        this.api.get<Province[]>('/location/provinces').subscribe({
            next: (d: Province[]) => { this.provinces = d; },
            error: () => { }
        });
    }

    onProvinceChange(province: Province | Province[]): void {
        const p = Array.isArray(province) ? province[0] : province;
        this.selectedProvince = p ?? null;
        this.draft.provinceCode = p?.code;
        this.draft.districtCode = undefined;
        this.draft.wardCode = undefined;
        this.selectedDistrict = null;
        this.selectedWard = null;
        this.modalDistricts = [];
        this.modalWards = [];
        if (p?.code) this.loadDistricts(p.code);
    }

    onWardChange(ward: Ward | Ward[]): void {
        const w = Array.isArray(ward) ? ward[0] : ward;
        this.selectedWard = w ?? null;
        this.draft.wardCode = w?.code;
    }

    private loadDistricts(code: string): void {
        this.api.get<District[]>('/location/districts', { params: { provinceCode: code } }).subscribe({
            next: (d: District[]) => {
                this.modalDistricts = d;
                this.selectedDistrict = d.find(x => x.code === this.draft.districtCode) ?? null;
                if (this.draft.districtCode) this.loadWards(this.draft.districtCode);
            },
            error: () => { }
        });
    }

    onDistrictChange(district: District | District[]): void {
        const d = Array.isArray(district) ? district[0] : district;
        this.selectedDistrict = d ?? null;
        this.draft.districtCode = d?.code;
        this.draft.wardCode = undefined;
        this.selectedWard = null;
        this.modalWards = [];
        if (d?.code) this.loadWards(d.code);
    }

    private loadWards(code: string): void {
        this.api.get<Ward[]>('/location/wards', { params: { districtCode: code } }).subscribe({
            next: (d: Ward[]) => {
                this.modalWards = d;
                this.selectedWard = d.find(x => x.code === this.draft.wardCode) ?? null;
            },
            error: () => { }
        });
    }

    // ---- Price formatting ----
    formatVND(n: number | undefined): string {
        if (n == null) return '';
        return n.toLocaleString('en-US');
    }
    private parseVND(s: string): number | undefined {
        const raw = s.replace(/,/g, '').trim();
        const n = Number(raw);
        return isNaN(n) || raw === '' ? undefined : n;
    }
    onPriceInput(field: 'min' | 'max', event: Event): void {
        const el = event.target as HTMLInputElement;
        const parsed = this.parseVND(el.value);
        if (field === 'min') {
            this.draft.minPrice = parsed;
            this.draftMinPriceStr = parsed != null ? this.formatVND(parsed) : '';
        } else {
            this.draft.maxPrice = parsed;
            this.draftMaxPriceStr = parsed != null ? this.formatVND(parsed) : '';
        }
        el.value = field === 'min' ? this.draftMinPriceStr : this.draftMaxPriceStr;
    }

    onPriceChange(field: 'min' | 'max', value: string): void {
        const parsed = this.parseVND(value);
        if (field === 'min') {
            this.draft.minPrice = parsed;
            this.draftMinPriceStr = parsed != null ? this.formatVND(parsed) : '';
        } else {
            this.draft.maxPrice = parsed;
            this.draftMaxPriceStr = parsed != null ? this.formatVND(parsed) : '';
        }
    }

    // ---- Price range chips ----
    isPriceActive(r: PriceRange): boolean {
        return this.draft.minPrice === r.min && this.draft.maxPrice === r.max;
    }
    setPriceRange(r: PriceRange): void {
        if (this.isPriceActive(r)) {
            this.draft.minPrice = undefined;
            this.draft.maxPrice = undefined;
            this.draftMinPriceStr = '';
            this.draftMaxPriceStr = '';
        } else {
            this.draft.minPrice = r.min;
            this.draft.maxPrice = r.max;
            this.draftMinPriceStr = this.formatVND(r.min);
            this.draftMaxPriceStr = r.max != null ? this.formatVND(r.max) : '';
        }
    }

    // ---- Roommate toggle (syncs bidirectionally) ----
    toggleRoommate(): void {
        this.isRoommateMode = !this.isRoommateMode;
        this.isRoommateModeChange.emit(this.isRoommateMode);
    }

    // ---- Reset ----
    resetDraft(): void {
        this.draft = {};
        this.draftMinPriceStr = '';
        this.draftMaxPriceStr = '';
        this.modalDistricts = [];
        this.modalWards = [];
        this.draftAmenities.forEach(c => c.active = false);
        this.isRoommateMode = false;
        this.isRoommateModeChange.emit(false);
    }

    // ---- Apply ----
    applyDraft(): void {
        const result: AppliedFilters = {
            keyword: this.draft.keyword,
            provinceCode: this.draft.provinceCode,
            districtCode: this.draft.districtCode,
            wardCode: this.draft.wardCode,
            minPrice: this.draft.minPrice,
            maxPrice: this.draft.maxPrice,
            isRoommateMode: this.isRoommateMode,
            gender: this.isRoommateMode ? this.draft.gender : undefined,
            minAge: this.isRoommateMode ? this.draft.minAge : undefined,
            maxAge: this.isRoommateMode ? this.draft.maxAge : undefined,
            amenityCodes: this.draftAmenities.filter(c => c.active).map(c => c.code),
        };
        this.apply.emit(result);
        this.onPopupClosed();
    }
}
