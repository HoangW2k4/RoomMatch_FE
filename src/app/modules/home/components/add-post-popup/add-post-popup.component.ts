import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl } from '@angular/forms';
import { PopupComponent } from '../../../../shared/components/popup';
import { InputFieldComponent } from '../../../../shared/components/input-field.component';
import { DropdownFieldComponent } from '../../../../shared/components/dropdown-field/dropdown-field.component';
import { DetailListMediasComponent } from '../../../../shared/components/detail-list-medias/detail-list-medias.component';
import { RoomPostRequest, Amenity, Province, District, Ward } from '../../../../core/models/post.interface';
import { ApiService } from '../../../../core/services/api.service';
import { AlertService } from '../../../../core/services/alert.service';
import { PostService } from '../../post.service';

interface AmenityOption {
  name: string;
  label: string;
  iconUrl?: string;
  active: boolean;
}

@Component({
  selector: 'app-add-post-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupComponent, InputFieldComponent, DropdownFieldComponent, DetailListMediasComponent],
  templateUrl: './add-post-popup.component.html',
  styleUrls: ['./add-post-popup.component.css']
})
export class AddPostPopupComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<void>();

  isSubmitting = false;

  // Form Data
  title = '';
  description = '';
  price: number | null = null;
  deposit: number | null = null;
  area: number | null = null;
  peoples: number | null = 1;
  street = '';

  priceControl = new FormControl('');
  depositControl = new FormControl('');
  areaControl = new FormControl('');
  peoplesControl = new FormControl('1');
  titleControl = new FormControl('');
  descriptionControl = new FormControl('');
  streetControl = new FormControl('');

  // Location Data
  provinces: Province[] = [];
  districts: District[] = [];
  wards: Ward[] = [];

  selectedProvinceCode = '';
  selectedDistrictCode = '';
  selectedWardCode = '';
  selectedProvince: Province | null = null;
  selectedDistrict: District | null = null;
  selectedWard: Ward | null = null;

  readonly provinceLabel = (item: Province) => item?.name ?? '';
  readonly districtLabel = (item: District) => item?.name ?? '';
  readonly wardLabel = (item: Ward) => item?.name ?? '';

  readonly provinceCompare = (a: Province, b: Province) => a?.code === b?.code;
  readonly districtCompare = (a: District, b: District) => a?.code === b?.code;
  readonly wardCompare = (a: Ward, b: Ward) => a?.code === b?.code;

  // Media Data
  selectedFiles: File[] = [];
  mediaPreviews: Array<{ url: string; type: 'image' | 'video' }> = [];

  get orderedMediaPreviews(): Array<{ url: string; type: 'image' | 'video' }> {
    if (!this.mediaPreviews.length) return [];
    const videos = this.mediaPreviews.filter((item) => item.type === 'video');
    const images = this.mediaPreviews.filter((item) => item.type === 'image');
    return [...videos, ...images];
  }

  isMediaViewerOpen = false;
  mediaViewerIndex = 0;

  openMediaViewer(preview: { url: string; type: 'image' | 'video' }): void {
    const index = this.orderedMediaPreviews.indexOf(preview);
    this.mediaViewerIndex = index >= 0 ? index : 0;
    this.isMediaViewerOpen = true;
  }

  closeMediaViewer(): void {
    this.isMediaViewerOpen = false;
  }

  // Amenities Data
  amenitiesList: AmenityOption[] = [
    { name: 'AIR_CONDITIONER', label: 'Điều hoà', iconUrl: 'assets/icons/ic_air_condition.svg', active: false },
    { name: 'REFRIGERATOR', label: 'Tủ lạnh', iconUrl: 'assets/icons/ic_amenity_refrigerator.svg', active: false },
    { name: 'KITCHEN', label: 'Bếp riêng', iconUrl: 'assets/icons/ic_kitchen.svg', active: false },
    { name: 'PARKING', label: 'Chỗ để xe', iconUrl: 'assets/icons/ic_amenity_parking.svg', active: false },
    { name: 'SECURITY', label: 'An ninh 24/7', iconUrl: 'assets/icons/ic_amenity_security.svg', active: false },
    { name: 'WIFI', label: 'Wifi', iconUrl: 'assets/icons/ic_amenity_wifi.svg', active: false },
    { name: 'WASHING_MACHINE', label: 'Máy giặt', iconUrl: 'assets/icons/ic_amenity_washing_machine.svg', active: false },
    { name: 'BALCONY', label: 'Ban công', iconUrl: 'assets/icons/ic_amenity_balcony.svg', active: false },
    { name: 'DRYING_AREA', label: 'Khu phơi đồ', iconUrl: 'assets/icons/ic_amenity_drying_area.svg', active: false },
    { name: 'WARDROBE', label: 'Tủ quần áo', iconUrl: 'assets/icons/ic_amenity_wardrobe.svg', active: false },
    { name: 'GYM', label: 'Phòng Gym', iconUrl: 'assets/icons/ic_gym.svg', active: false },
    { name: 'ELEVATOR', label: 'Thang máy', iconUrl: 'assets/icons/ic_elevator.svg', active: false },
    { name: 'FIRE_ALARM', label: 'Báo cháy / Nội thất', iconUrl: 'assets/icons/ic_amenity_fire_alarm.svg', active: false },
    { name: 'BED', label: 'Giường ngủ', iconUrl: 'assets/icons/ic_bed.svg', active: false },
    { name: 'CAMERA', label: 'Camera an ninh', iconUrl: 'assets/icons/ic_camera.svg', active: false },
    { name: 'PET_FRIENDLY', label: 'Cho phép thú cưng', iconUrl: 'assets/icons/ic_pet.svg', active: false },
    { name: 'WATER_HEATER', label: 'Bình nóng lạnh', iconUrl: 'assets/icons/ic_heater.svg', active: false }
  ];

  constructor(
    private api: ApiService,
    private postService: PostService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    if (this.visible) {
      this.loadProvinces();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue) {
      this.ensureProvincesLoaded();
    }
  }

  close(): void {
    this.closed.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.title = '';
    this.description = '';
    this.price = null;
    this.deposit = null;
    this.area = null;
    this.peoples = 1;
    this.street = '';
    this.priceControl.setValue('');
    this.depositControl.setValue('');
    this.areaControl.setValue('');
    this.peoplesControl.setValue('1');
    this.titleControl.setValue('');
    this.descriptionControl.setValue('');
    this.streetControl.setValue('');
    this.selectedProvinceCode = '';
    this.selectedDistrictCode = '';
    this.selectedWardCode = '';
    this.selectedProvince = null;
    this.selectedDistrict = null;
    this.selectedWard = null;
    this.clearMediaPreviews();
    this.selectedFiles = [];
    this.mediaPreviews = [];
    this.amenitiesList.forEach(a => a.active = false);
    this.districts = [];
    this.wards = [];
    this.isSubmitting = false;
  }

  // --- Location Loading ---
  private loadProvinces(): void {
    this.api.get<Province[]>('/location/provinces').subscribe({
      next: (data) => { this.provinces = data; },
      error: (e) => console.error(e)
    });
  }

  private ensureProvincesLoaded(): void {
    if (!this.provinces.length) {
      this.loadProvinces();
    }
  }

  onProvinceChange(province: Province | Province[] | null): void {
    const nextProvince = Array.isArray(province) ? province[0] ?? null : province;
    this.selectedProvince = nextProvince;
    this.selectedProvinceCode = nextProvince?.code ?? '';
    this.selectedDistrict = null;
    this.selectedWard = null;
    this.selectedDistrictCode = '';
    this.selectedWardCode = '';
    this.districts = [];
    this.wards = [];
    if (this.selectedProvinceCode) {
      this.api.get<District[]>('/location/districts', {
        params: { provinceCode: this.selectedProvinceCode }
      }).subscribe({
        next: (data) => { this.districts = data; },
        error: (e) => console.error(e)
      });
    }
  }

  onDistrictChange(district: District | District[] | null): void {
    const nextDistrict = Array.isArray(district) ? district[0] ?? null : district;
    this.selectedDistrict = nextDistrict;
    this.selectedDistrictCode = nextDistrict?.code ?? '';
    this.selectedWard = null;
    this.selectedWardCode = '';
    this.wards = [];
    if (this.selectedDistrictCode) {
      this.api.get<Ward[]>('/location/wards', {
        params: { districtCode: this.selectedDistrictCode }
      }).subscribe({
        next: (data) => { this.wards = data; },
        error: (e) => console.error(e)
      });
    }
  }

  onWardChange(ward: Ward | Ward[] | null): void {
    const nextWard = Array.isArray(ward) ? ward[0] ?? null : ward;
    this.selectedWard = nextWard;
    this.selectedWardCode = nextWard?.code ?? '';
  }

  // --- Image Handling ---
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      const maxFileSize = 10 * 1024 * 1024;
      const maxTotalSize = 25 * 1024 * 1024;
      let totalSize = this.selectedFiles.reduce((sum, f) => sum + f.size, 0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          this.alertService.show('warning', 'Lưu ý', 'Chỉ hỗ trợ ảnh hoặc video.');
          continue;
        }

        if (file.size > maxFileSize) {
          this.alertService.show('warning', 'Lưu ý', 'Mỗi file tối đa 10MB.');
          continue;
        }

        if (totalSize + file.size > maxTotalSize) {
          this.alertService.show('warning', 'Lưu ý', 'Tổng dung lượng tối đa 25MB.');
          break;
        }

        this.selectedFiles.push(file);
        totalSize += file.size;

        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.mediaPreviews.push({ url: e.target.result, type: 'image' });
          };
          reader.readAsDataURL(file);
        } else {
          const url = URL.createObjectURL(file);
          this.mediaPreviews.push({ url, type: 'video' });
        }
      }
    }
  }

  removeMedia(index: number): void {
    const preview = this.mediaPreviews[index];
    if (preview?.url && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
    this.selectedFiles.splice(index, 1);
    this.mediaPreviews.splice(index, 1);
  }

  private clearMediaPreviews(): void {
    this.mediaPreviews.forEach((preview) => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });
  }

  private parseNumericValue(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = String(value).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    if (!normalized) {
      return null;
    }

    const numericValue = Number(normalized);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  // --- Amenity Handling ---
  toggleAmenity(amenity: AmenityOption): void {
    amenity.active = !amenity.active;
  }

  // --- Submit ---
  submit(): void {
    if (!this.isValidForm()) {
      return;
      // Ideally show a toast error for missing required fields
    }

    this.isSubmitting = true;

    const priceValue = this.parseNumericValue(this.priceControl.value);
    const depositValue = this.parseNumericValue(this.depositControl.value);
    const areaValue = this.parseNumericValue(this.areaControl.value);
    const peoplesValue = this.parseNumericValue(this.peoplesControl.value);
    const titleValue = (this.titleControl.value || '').toString().trim();
    const descriptionValue = (this.descriptionControl.value || '').toString().trim();
    const streetValue = (this.streetControl.value || '').toString().trim();

    const requestData: any = {
      title: titleValue,
      description: descriptionValue,
      price: priceValue,
      deposit: depositValue,
      peoples: peoplesValue,
      area: areaValue,
      addressRequest: {
        provinceCode: this.selectedProvinceCode,
        districtCode: this.selectedDistrictCode,
        wardCode: this.selectedWardCode,
        detail: streetValue
      },
      medias: [], // Ignored since we use files
      amenities: this.amenitiesList
        .filter(a => a.active)
        .map(a => ({ name: a.name, iconUrl: a.iconUrl || '' }))
    };

    this.postService.createPost(requestData, this.selectedFiles).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Ideally display toast success
        this.postCreated.emit();
        this.close();
      },
      error: (err) => {
        console.error('Failed to create post', err);
        this.isSubmitting = false;
      }
    });
  }

  isValidForm(): boolean {
    const priceValue = this.parseNumericValue(this.priceControl.value);
    const depositValue = this.parseNumericValue(this.depositControl.value);
    const areaValue = this.parseNumericValue(this.areaControl.value);
    const peoplesValue = this.parseNumericValue(this.peoplesControl.value);
    const titleValue = (this.titleControl.value || '').toString().trim();
    const descriptionValue = (this.descriptionControl.value || '').toString().trim();
    const streetValue = (this.streetControl.value || '').toString().trim();

    return !!titleValue && !!descriptionValue &&
      priceValue != null && depositValue != null &&
      areaValue != null && peoplesValue != null &&
      !!this.selectedProvinceCode && !!this.selectedDistrictCode && !!this.selectedWardCode &&
      !!streetValue;
  }
}
