// User Role System
export type UserRole = 'user' | 'reviewer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RegularUser extends UserProfile {
  role: 'user';
  // User-specific fields
  resumes?: Resume[];
  following?: string[]; // reviewer IDs they follow
}

export interface ReviewerUser extends UserProfile {
  role: 'reviewer';
  // Reviewer-specific fields
  reviewer_profile?: ReviewerProfile;
  reviews?: Review[];
  followers?: string[]; // user IDs following them
}

export interface AdminUser extends UserProfile {
  role: 'admin';
  // Admin-specific fields
  permissions: string[];
}

export interface Resume {
  id: string;
  user_id: string;
  status: 'Pending' | 'Under Review' | 'Completed' | 'Rejected';
  score?: number;
  notes?: string;
  file_url: string;
  reviewer_id?: string; // assigned reviewer
  created_at: string;
  updated_at: string;
}

export interface ReviewerProfile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  photo_url?: string;
  company?: string;
  experience_years: number;
  headline?: string;
  country?: string;
  expertise: string[];
  rating: number;
  reviews_count: number;
  social_link?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  resume_id: string;
  score: number;
  feedback: string;
  created_at: string;
}

export interface Follow {
  follower_id: string; // user ID
  reviewer_id: string; // reviewer ID
  created_at: string;
}

// Session Management
export interface UserSession {
  user: UserProfile;
  isAuthenticated: boolean;
  role: UserRole;
  permissions: string[];
}

// Route Access Control
export interface RouteAccess {
  path: string;
  roles: UserRole[];
  requiresAuth: boolean;
  description: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
