// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Video Generation Types
export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  prompt: string;
  url?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  quality: 'standard' | 'hd' | 'premium';
  style?: string;
  createdAt: string;
  updatedAt: string;
  cost: number;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  quality: 'standard' | 'hd' | 'premium';
  style?: string;
}

// Credit System Types
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'referral';
  description: string;
  videoId?: string;
  createdAt: string;
}

// Subscription and Payment Types
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  creditsIncluded: number;
  price: number;
  currency: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  features: string[];
  isPopular?: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// Component Props Types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Locale and Internationalization
export type Locale = 'en' | 'zh' | 'de' | 'fr';

export interface LocaleParams {
  locale: Locale;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Configuration Types
export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  kieApiUrl?: string;
  kieApiKey?: string;
  r2Endpoint?: string;
  r2AccessKey?: string;
  r2SecretKey?: string;
  r2BucketName?: string;
  creemApiKey?: string;
  creemEnvironment: 'test' | 'production';
}