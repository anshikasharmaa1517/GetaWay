// Production environment configuration and validation

export interface SecurityConfig {
  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: {
      api: number;
      pages: number;
      auth: number;
    };
  };

  // CORS settings
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };

  // File upload security
  fileUpload: {
    maxSize: number; // bytes
    allowedTypes: string[];
    virusScanning: boolean;
  };

  // Session security
  session: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none";
    maxAge: number; // seconds
  };

  // Content Security Policy
  csp: {
    enabled: boolean;
    reportOnly: boolean;
    directives: Record<string, string[]>;
  };

  // Logging and monitoring
  monitoring: {
    enabled: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
    sensitiveDataMasking: boolean;
  };
}

// Get security configuration based on environment
export function getSecurityConfig(): SecurityConfig {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: {
        api: isProduction ? 100 : 1000,
        pages: isProduction ? 200 : 2000,
        auth: isProduction ? 10 : 100,
      },
    },

    cors: {
      enabled: isProduction,
      origins: isProduction 
        ? [process.env.NEXT_PUBLIC_APP_URL || ""] 
        : ["http://localhost:3000"],
      credentials: true,
    },

    fileUpload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ],
      virusScanning: isProduction,
    },

    session: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    },

    csp: {
      enabled: isProduction,
      reportOnly: false,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "'unsafe-eval'", // Required for Next.js dev
          "https://vercel.live",
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind
          "https://fonts.googleapis.com",
        ],
        "font-src": [
          "'self'",
          "https://fonts.gstatic.com",
          "data:",
        ],
        "img-src": [
          "'self'",
          "data:",
          "https:",
          "blob:",
        ],
        "connect-src": [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          isProduction ? "" : "http://localhost:*",
        ].filter(Boolean),
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": [],
      },
    },

    monitoring: {
      enabled: isProduction,
      logLevel: isProduction ? "error" : "debug",
      sensitiveDataMasking: true,
    },
  };
}

// Environment validation
export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Required environment variables
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  // Production-specific required variables
  if (isProduction) {
    required.push(
      "NEXT_PUBLIC_APP_URL",
      "NEXTAUTH_SECRET",
    );
  }

  // Check required variables
  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    if (!supabaseUrl.startsWith("https://")) {
      if (isProduction) {
        errors.push("NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production");
      } else {
        warnings.push("NEXT_PUBLIC_SUPABASE_URL should use HTTPS");
      }
    }

    if (supabaseUrl.includes("localhost") && isProduction) {
      errors.push("Cannot use localhost Supabase URL in production");
    }
  }

  // Validate app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && isProduction) {
    if (!appUrl.startsWith("https://")) {
      errors.push("NEXT_PUBLIC_APP_URL must use HTTPS in production");
    }
  }

  // Check for development secrets in production
  if (isProduction) {
    const devPatterns = [
      /localhost/i,
      /127\.0\.0\.1/,
      /development/i,
      /dev/i,
      /test/i,
    ];

    for (const [key, value] of Object.entries(process.env)) {
      if (key.includes("SECRET") || key.includes("KEY")) {
        const stringValue = String(value);
        for (const pattern of devPatterns) {
          if (pattern.test(stringValue)) {
            errors.push(`Development value detected in production for ${key}`);
            break;
          }
        }
      }
    }
  }

  // Validate key lengths
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseAnonKey && supabaseAnonKey.length < 100) {
    warnings.push("NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && serviceRoleKey.length < 100) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY seems too short");
  }

  // Check for admin emails
  if (!process.env.ADMIN_EMAILS && isProduction) {
    warnings.push("ADMIN_EMAILS not set - no admin users will be available");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Security headers configuration
export function getSecurityHeaders(): Record<string, string> {
  const config = getSecurityConfig();
  const headers: Record<string, string> = {};

  // Basic security headers
  headers["X-Content-Type-Options"] = "nosniff";
  headers["X-Frame-Options"] = "DENY";
  headers["X-XSS-Protection"] = "1; mode=block";
  headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

  // HSTS for production
  if (process.env.NODE_ENV === "production") {
    headers["Strict-Transport-Security"] = 
      "max-age=31536000; includeSubDomains; preload";
  }

  // Content Security Policy
  if (config.csp.enabled) {
    const cspDirectives = Object.entries(config.csp.directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(" ")}`;
      })
      .join("; ");

    headers[config.csp.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"] = cspDirectives;
  }

  // Remove server information
  headers["Server"] = "";
  
  return headers;
}

// Initialize security configuration on startup
export function initializeSecurity(): void {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === "production") {
      console.error("Exiting due to invalid production configuration");
      process.exit(1);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log("✅ Environment validation passed");
  }

  // Log security configuration in development
  if (process.env.NODE_ENV === "development") {
    console.log("🔒 Security configuration loaded");
  }
}

// Database connection security
export function getSecureSupabaseConfig() {
  const config = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };

  // Validate configuration
  if (!config.url || !config.anonKey || !config.serviceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }

  return config;
}
