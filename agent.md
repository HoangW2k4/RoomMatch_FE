# RoomMatch FE Agent Guide

Tai lieu nay mo ta quy tac lam viec, coding convention va cau truc code cho du an RoomMatch Frontend.
Muc tieu: giup bat ky AI agent/dev nao cung co the code dung style va dung kien truc hien tai cua project.

## 1. Tong quan ky thuat

- Framework: Angular 20 (standalone-first)
- Ngon ngu: TypeScript
- Styling: dang su dung hon hop CSS/SCSS, uu tien thong nhat theo huong duoc ghi ben duoi
- HTTP: `HttpClient` + `ApiService` wrapper
- Auth: JWT + interceptor + guard
- State local/share nho: RxJS (`BehaviorSubject`, `Observable`)
- Build/Test:
- `npm start` -> `ng serve`
- `npm run build` -> `ng build`
- `npm test` -> `ng test`

## 2. Nguyen tac kien truc

- Theo feature-first:
- `src/app/modules/*` cho tung nghiep vu lon (home, auth, room, chat...)
- `src/app/core/*` cho singleton va cross-cutting concern
- `src/app/shared/*` cho UI tai su dung
- Uu tien standalone components, khong them `NgModule` moi.
- Uu tien lazy loading qua `loadComponent` trong route.
- Moi API call di qua `ApiService` (trong `core/services/api.service.ts`), khong goi `HttpClient` truc tiep neu khong can dac biet.
- Guard va interceptor dung functional style (`CanActivateFn`, `HttpInterceptorFn`) nhu codebase hien tai.

## 3. Cau truc thu muc chuan

- `src/app/core/`
- `guards/`: auth guard + role guard
- `interceptors/`: JWT, error handling
- `services/`: service he thong (api, auth, loading, alert)
- `models/`: enum va interface co so
- `index.ts`: barrel export cho core

- `src/app/layout/`
- Khung giao dien tong (`navbar`, `footer`, `main-layout`)

- `src/app/modules/`
- Moi feature dat trong 1 thu muc rieng
- Feature lon co the co `components/`, `pages/`, `services/` rieng

- `src/app/shared/`
- `components/`: reusable UI units
- `module/`: reusable standalone UI blocks dang duoc dung trong app

- `src/app/services/`
- Service cap app chua du dieu kien vao `core` hoac feature

## 4. Quy uoc dat ten

- File/folder: `kebab-case`
- Component file: `*.component.ts|html|css|scss`
- Service file: `*.service.ts`
- Guard file: `*.guard.ts`
- Interceptor file: `*.interceptor.ts`
- Interface file: `*.interface.ts`
- Enum/constants: dat ten ro nghia, uu tien tach theo domain

- Class/Type/Enum: `PascalCase`
- Bien/ham/property: `camelCase`
- Observable stream: suffix `$` (`loading$`, `alert$`)
- Selector component: `app-*` (`app-home`, `app-post-card`)

## 5. Convention cho Component

- Uu tien standalone component (`standalone: true`) va khai bao `imports` ro rang.
- Tach ro 3 phan:
- UI state (bien hien thi)
- Business action handlers (`onSearch`, `onLikePost`...)
- Data loading methods (`loadPosts`, `loadMore`...)
- Neu co `subscribe` dai vong doi component, bat buoc cleanup (`takeUntil(destroy$)` + `ngOnDestroy`).
- Dung `trackBy` cho danh sach lon (`*ngFor`).
- Khong viet business logic phuc tap trong template.

## 6. Convention cho Service va API

- Service phai co trach nhiem ro rang theo domain.
- API method tra ve type co generic day du (`Observable<ApiResponse<T>>`).
- Query params dung `HttpParams`, khong noi chuoi URL thu cong.
- Side effect loading phai gan voi vong doi request (`finalize`) thay vi `show(); hide();` lien tiep.
- Khong dat ten private property bang `PascalCase` (vd `LoadingService`) - dung `loadingService`.

## 7. Convention cho Auth/Guard/Interceptor

- JWT interceptor chi lam nhiem vu gan token va bo qua endpoint can thiet (vd refresh token).
- Error interceptor xu ly loi tap trung, thong bao thong nhat qua `AlertService`.
- Guard uu tien dung `AuthService` de doc trang thai dang nhap/role.
- Han che truy cap `localStorage` truc tiep rai rac trong nhieu noi.

## 8. Convention cho RxJS

- Subject private, Observable public.
- Dat ten stream co suffix `$`.
- Khong subscribe trong service neu co the tra Observable cho component quyet dinh.
- Dung operator de xu ly side effect (`tap`, `finalize`, `catchError`) thay vi logic chen lung tung.

## 9. Convention cho Styling

- Hien tai dang tron `css` va `scss`; khi tao moi, uu tien SCSS cho component co style phuc tap.
- Inline `styles` chi dung cho reusable shared component nho, co tinh dong goi cao.
- Class name uu tien de doc, theo block/component context.
- Dam bao responsive co ban cho mobile (`@media` khi can).

## 10. Convention cho Routing

- Route level theo feature.
- Uu tien lazy load voi `loadComponent`.
- Route can xac thuc phai them guard.
- Wildcard route (`**`) redirect ve page an toan (hien tai la `home`).

## 11. Quality gates truoc khi merge

- Build pass: `npm run build`
- Test pass: `npm test` (neu co testcase lien quan)
- Khong de `any` neu co the typing duoc
- Khong de comment/debug code thua (`console.log` dev tam)
- Kiem tra import thua, duplicate logic, dead code

## 12. Checklist khi them feature moi

- Tao folder feature trong `src/app/modules/<feature-name>`
- Tao component/page/service theo domain
- Dinh nghia model/interface can thiet trong `core/models` hoac feature model
- Tich hop API qua `ApiService`
- Them route lazy load trong `app.routes.ts`
- Them guard neu route can role dac thu
- Xu ly loading + error thong qua service chung
- Kiem tra responsive + basic UX states (loading, empty, error)

## 13. Nhung diem can tranh trong codebase hien tai

- Khong duoc `show loading` roi `hide` truoc khi request ket thuc.
- Khong dat ten property sai convention (vd private PascalCase).
- Khong duplicate source-of-truth auth state o nhieu noi.
- Khong tao service/component "all-in-one" qua lon; tach theo trach nhiem.

## 14. Nguyen tac update tai lieu nay

Khi co thay doi lon ve kien truc/convention, cap nhat file nay truoc khi merge de dam bao AI agent va dev moi deu theo cung mot chuan.
