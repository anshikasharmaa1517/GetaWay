import { UserRole, RouteAccess } from './types';

// Role hierarchy and permissions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'user': 1,
  'reviewer': 2,
  'admin': 3,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'user': [
    'upload_resume',
    'view_reviewers',
    'follow_reviewer',
    'view_own_resumes',
    'edit_own_profile',
  ],
  'reviewer': [
    'upload_resume',
    'view_reviewers',
    'follow_reviewer',
    'view_own_resumes',
    'edit_own_profile',
    'create_reviewer_profile',
    'edit_reviewer_profile',
    'view_own_reviews',
    'review_resumes',
    'manage_followers',
  ],
  'admin': [
    'upload_resume',
    'view_reviewers',
    'follow_reviewer',
    'view_own_resumes',
    'edit_own_profile',
    'create_reviewer_profile',
    'edit_reviewer_profile',
    'view_own_reviews',
    'review_resumes',
    'manage_followers',
    'manage_all_users',
    'manage_all_reviewers',
    'manage_all_resumes',
    'view_analytics',
    'manage_system',
  ],
};

// Route access definitions
export const ROUTE_ACCESS: RouteAccess[] = [
  // Public routes
  { path: '/', roles: [], requiresAuth: false, description: 'Home page' },
  { path: '/login', roles: [], requiresAuth: false, description: 'Login page' },
  { path: '/become-reviewer', roles: [], requiresAuth: false, description: 'Become reviewer page' },
  { path: '/become-reviewer-auth', roles: [], requiresAuth: false, description: 'Reviewer auth page' },
  { path: '/r/[slug]', roles: [], requiresAuth: false, description: 'Public reviewer profile' },
  
  // User routes (for regular users)
  { path: '/dashboard', roles: ['user', 'admin'], requiresAuth: true, description: 'User dashboard' },
  { path: '/upload', roles: ['user', 'admin'], requiresAuth: true, description: 'Upload resume' },
  { path: '/reviewers', roles: ['user', 'admin'], requiresAuth: true, description: 'Find reviewers' },
  { path: '/settings/profile', roles: ['user', 'reviewer', 'admin'], requiresAuth: true, description: 'User profile settings' },
  
  // Reviewer routes (for reviewers)
  { path: '/creator', roles: ['reviewer', 'admin'], requiresAuth: true, description: 'Reviewer dashboard' },
  { path: '/creator/profile', roles: ['reviewer', 'admin'], requiresAuth: true, description: 'Edit reviewer profile' },
  { path: '/creator/reviews', roles: ['reviewer', 'admin'], requiresAuth: true, description: 'Manage reviews' },
  { path: '/creator/analytics', roles: ['reviewer', 'admin'], requiresAuth: true, description: 'Reviewer analytics' },
  
  // Admin routes
  { path: '/admin', roles: ['admin'], requiresAuth: true, description: 'Admin dashboard' },
  { path: '/admin/users', roles: ['admin'], requiresAuth: true, description: 'Manage users' },
  { path: '/admin/reviewers', roles: ['admin'], requiresAuth: true, description: 'Manage reviewers' },
  { path: '/admin/resumes', roles: ['admin'], requiresAuth: true, description: 'Manage resumes' },
];

// Utility functions
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function canAccessRoute(userRole: UserRole, path: string): boolean {
  const route = ROUTE_ACCESS.find(r => 
    r.path === path || 
    (r.path.includes('[') && path.match(new RegExp(r.path.replace(/\[.*?\]/g, '[^/]+'))))
  );
  
  if (!route) return false;
  if (!route.requiresAuth) return true;
  
  return route.roles.includes(userRole);
}

export function getDefaultRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case 'admin':
      return '/admin';
    case 'reviewer':
      return '/creator';
    case 'user':
    default:
      return '/dashboard';
  }
}

export function getUserRoleFromPath(path: string): UserRole | null {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/creator')) return 'reviewer';
  return 'user';
}

// Role validation
export function isValidRole(role: string): role is UserRole {
  return ['user', 'reviewer', 'admin'].includes(role);
}

// Permission checking
export function checkPermission(userRole: UserRole, permission: string): boolean {
  return hasPermission(userRole, permission);
}

// Route access checking
export function checkRouteAccess(userRole: UserRole, path: string): { allowed: boolean; reason?: string } {
  const route = ROUTE_ACCESS.find(r => 
    r.path === path || 
    (r.path.includes('[') && path.match(new RegExp(r.path.replace(/\[.*?\]/g, '[^/]+'))))
  );
  
  if (!route) {
    return { allowed: false, reason: 'Route not found' };
  }
  
  if (!route.requiresAuth) {
    return { allowed: true };
  }
  
  if (!route.roles.includes(userRole)) {
    return { allowed: false, reason: 'Insufficient permissions' };
  }
  
  return { allowed: true };
}
