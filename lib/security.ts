import { NextRequest } from "next/server";

// Input validation schemas
export const ValidationSchemas = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  slug: /^[a-z0-9-]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  filename: /^[a-zA-Z0-9._-]+\.(pdf|jpg|jpeg|png)$/i,
  url: /^https?:\/\/[^\s<>'"]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
};

// Sanitization functions
export class SecurityUtils {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (!input) return "";
    
    return input
      .replace(/[<>]/g, "") // Remove < and >
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .replace(/script/gi, "") // Remove script tags
      .trim();
  }

  /**
   * Sanitize SQL input to prevent injection
   */
  static sanitizeSql(input: string): string {
    if (!input) return "";
    
    return input
      .replace(/[';-]|--/g, "") // Remove SQL injection characters
      .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UNION|UPDATE)\b)/gi, "") // Remove SQL keywords
      .trim();
  }

  /**
   * Validate and sanitize email
   */
  static validateEmail(email: string): { isValid: boolean; sanitized: string } {
    const sanitized = email.toLowerCase().trim();
    return {
      isValid: ValidationSchemas.email.test(sanitized),
      sanitized,
    };
  }

  /**
   * Validate and sanitize slug
   */
  static validateSlug(slug: string): { isValid: boolean; sanitized: string } {
    const sanitized = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    return {
      isValid: ValidationSchemas.slug.test(sanitized),
      sanitized,
    };
  }

  /**
   * Validate UUID
   */
  static validateUuid(uuid: string): boolean {
    return ValidationSchemas.uuid.test(uuid);
  }

  /**
   * Validate file upload
   */
  static validateFile(filename: string, maxSize: number = 10 * 1024 * 1024): { 
    isValid: boolean; 
    error?: string;
    sanitizedName: string;
  } {
    if (!filename) {
      return { isValid: false, error: "Filename is required", sanitizedName: "" };
    }

    const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    
    if (!ValidationSchemas.filename.test(sanitizedName)) {
      return { 
        isValid: false, 
        error: "Invalid file type. Only PDF, JPG, JPEG, PNG allowed",
        sanitizedName 
      };
    }

    return { isValid: true, sanitizedName };
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): { isValid: boolean; sanitized: string } {
    const sanitized = url.trim();
    return {
      isValid: ValidationSchemas.url.test(sanitized),
      sanitized,
    };
  }

  /**
   * Rate limit key generation
   */
  static generateRateLimitKey(ip: string, endpoint: string, userId?: string): string {
    return userId ? `${ip}:${userId}:${endpoint}` : `${ip}:${endpoint}`;
  }

  /**
   * Secure headers for API responses
   */
  static getSecureHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };
  }

  /**
   * Validate request body size
   */
  static validateRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > maxSize) {
      return false;
    }
    return true;
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const array = new Uint8Array(length);
    
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Validate and sanitize text input
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input) return "";
    
    return this.sanitizeHtml(input)
      .substring(0, maxLength)
      .trim();
  }

  /**
   * Check for suspicious patterns
   */
  static detectSuspiciousActivity(input: string): boolean {
    const suspiciousPatterns = [
      /script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload/gi,
      /onerror/gi,
      /onclick/gi,
      /eval\(/gi,
      /expression\(/gi,
      /url\(/gi,
      /import\(/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    if (password.length < 8) {
      issues.push("Password must be at least 8 characters long");
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      issues.push("Password must contain at least one lowercase letter");
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      issues.push("Password must contain at least one uppercase letter");
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      issues.push("Password must contain at least one number");
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      issues.push("Password must contain at least one special character");
    } else {
      score += 1;
    }

    return {
      isValid: issues.length === 0,
      score,
      issues,
    };
  }
}

// CSRF Token utilities
export class CSRFUtils {
  private static readonly TOKEN_HEADER = "x-csrf-token";
  private static readonly TOKEN_COOKIE = "csrf-token";

  static generateToken(): string {
    return SecurityUtils.generateSecureToken(32);
  }

  static validateToken(request: NextRequest, expectedToken: string): boolean {
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value;

    return headerToken === expectedToken || cookieToken === expectedToken;
  }
}

// Environment validation
export class EnvValidator {
  static validateProductionEnv(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      }
    }

    // Check for development keys in production
    if (process.env.NODE_ENV === "production") {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost")) {
        issues.push("Using localhost Supabase URL in production");
      }

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://")) {
        issues.push("Supabase URL must use HTTPS in production");
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
