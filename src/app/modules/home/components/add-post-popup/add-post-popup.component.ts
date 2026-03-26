import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../../../shared/components/popup';
import { RoomPostRequest, Amenity, Province, District, Ward } from '../../../../core/models/post.interface';
import { ApiService } from '../../../../core/services/api.service';
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
  imports: [CommonModule, FormsModule, PopupComponent],
  templateUrl: './add-post-popup.component.html',
  styleUrls: ['./add-post-popup.component.css']
})
export class AddPostPopupComponent implements OnInit {
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

  // Location Data
  provinces: Province[] = [];
  districts: District[] = [];
  wards: Ward[] = [];

  selectedProvinceCode = '';
  selectedDistrictCode = '';
  selectedWardCode = '';

  // Media Data
  selectedFiles: File[] = [];
  mediaPreviews: string[] = [];

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
    private postService: PostService
  ) {}

  ngOnInit(): void {
    if (this.visible) {
      this.loadProvinces();
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
    this.selectedProvinceCode = '';
    this.selectedDistrictCode = '';
    this.selectedWardCode = '';
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

  onProvinceChange(): void {
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

  onDistrictChange(): void {
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

  // --- Image Handling ---
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.mediaPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeMedia(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.mediaPreviews.splice(index, 1);
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

    const requestData: any = {
      title: this.title,
      description: this.description,
      price: this.price,
      deposit: this.deposit,
      peoples: this.peoples,
      area: this.area,
      addressRequest: {
        provinceCode: this.selectedProvinceCode,
        districtCode: this.selectedDistrictCode,
        wardCode: this.selectedWardCode,
        detail: this.street
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
    return !!this.title && !!this.description &&
      this.price != null && this.deposit != null &&
      this.area != null && this.peoples != null &&
      !!this.selectedProvinceCode && !!this.selectedDistrictCode && !!this.selectedWardCode &&
      !!this.street;
  }
}
