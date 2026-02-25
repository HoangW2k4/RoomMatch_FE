import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserRole } from '../models/enums';

/**
 * Auth Guard - Kiểm tra người dùng đã đăng nhập chưa
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  if (token) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Role Guard Factory - Tạo guard kiểm tra role cụ thể
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    // Check if user is authenticated
    if (!token) {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Check user role
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userRole = user.role as UserRole;

        if (allowedRoles.includes(userRole)) {
          return true;
        }

        // User doesn't have required role
        console.error('Access denied: User role not allowed', {
          userRole,
          allowedRoles
        });
        router.navigate(['/']);
        return false;
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        router.navigate(['/auth/login']);
        return false;
      }
    }

    router.navigate(['/auth/login']);
    return false;
  };
}

/**
 * ROLE_LANDLORD Guard - Chỉ cho phép ROLE_LANDLORD truy cập
 */
export const ROLE_LANDLORDGuard: CanActivateFn = roleGuard(UserRole.ROLE_LANDLORD);

/**
 * ROLE_SEEKER Guard - Chỉ cho phép ROLE_SEEKER truy cập
 */
export const ROLE_SEEKERGuard: CanActivateFn = roleGuard(UserRole.ROLE_SEEKER);

/**
 * ROLE_ADMIN Guard - Chỉ cho phép ROLE_ADMIN truy cập
 */
export const ROLE_ADMINGuard: CanActivateFn = roleGuard(UserRole.ROLE_ADMIN);

/**
 * ROLE_LANDLORD or ROLE_SEEKER Guard - Cho phép cả ROLE_LANDLORD và ROLE_SEEKER
 */
export const ROLE_LANDLORDOrROLE_SEEKERGuard: CanActivateFn = roleGuard(UserRole.ROLE_LANDLORD, UserRole.ROLE_SEEKER);
