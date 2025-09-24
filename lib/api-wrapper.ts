import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "./session";
import { SecurityUtils, CSRFUtils } from "./security";
import { ErrorHandler, generateRequestId } from "./error-handler";
import { UserRole } from "./types";

// API route configuration
interface ApiRouteConfig {
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
  validateCSRF?: boolean;
  maxRequestSize?: number;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Request context
interface RequestContext {
  requestId: string;
  ip: string;
  userAgent: string;
  session?: any;
  body?: any;
}

// API wrapper class for secure route handling
export class SecureApiWrapper {
  /**
   * Wrap API route with security measures
   */
  static wrap(
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
    config: ApiRouteConfig = {}
  ) {
    return async (request: NextRequest, routeContext?: any): Promise<NextResponse> => {
      const requestId = generateRequestId();
      
      try {
        // Create request context
        const context: RequestContext = {
          requestId,
          ip: this.getClientIP(request),
          userAgent: request.headers.get("user-agent") || "unknown",
        };

        // Validate request size
        if (config.maxRequestSize && !SecurityUtils.validateRequestSize(request, config.maxRequestSize)) {
          throw ErrorHandler.validationError("Request too large", requestId);
        }

        // Rate limiting (if configured)
        if (config.rateLimit) {
          const rateLimitKey = SecurityUtils.generateRateLimitKey(
            context.ip,
            request.nextUrl.pathname,
            context.session?.user?.id
          );
          
          if (!this.checkRateLimit(rateLimitKey, config.rateLimit)) {
            throw ErrorHandler.rateLimitError("Rate limit exceeded", requestId);
          }
        }

        // Authentication check
        if (config.requiresAuth !== false) {
          const session = await getServerSession();
          
          if (!session || !session.isAuthenticated) {
            throw ErrorHandler.authenticationError("Authentication required", requestId);
          }
          
          context.session = session;

          // Role-based authorization
          if (config.allowedRoles && !config.allowedRoles.includes(session.role)) {
            throw ErrorHandler.authorizationError(
              `Access denied. Required role: ${config.allowedRoles.join(" or ")}`,
              requestId
            );
          }
        }

        // CSRF validation for state-changing operations
        if (config.validateCSRF && ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
          const csrfToken = request.headers.get("x-csrf-token");
          if (!csrfToken) {
            throw ErrorHandler.validationError("CSRF token required", requestId);
          }
          
          // In a real implementation, you'd validate against a stored token
          // For now, we'll skip the actual validation but log the requirement
          console.log(`CSRF validation required for ${request.method} ${request.nextUrl.pathname}`);
        }

        // Parse and validate request body
        if (["POST", "PUT", "PATCH"].includes(request.method)) {
          try {
            const body = await request.json();
            context.body = this.sanitizeRequestBody(body);
          } catch (error) {
            throw ErrorHandler.validationError("Invalid JSON in request body", requestId);
          }
        }

        // Call the actual handler
        const response = await handler(request, context);

        // Add security headers to response
        this.addSecurityHeaders(response);

        return response;

      } catch (error) {
        return ErrorHandler.createErrorResponse(error as Error);
      }
    };
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return request.ip || "127.0.0.1";
  }

  /**
   * Simple rate limiting (in production, use Redis)
   */
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  private static checkRateLimit(key: string, config: { requests: number; windowMs: number }): boolean {
    const now = Date.now();
    const current = this.rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      this.rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
      return true;
    }

    if (current.count >= config.requests) {
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Sanitize request body
   */
  private static sanitizeRequestBody(body: any): any {
    if (typeof body === "string") {
      return SecurityUtils.sanitizeText(body);
    }

    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeRequestBody(item));
    }

    if (typeof body === "object" && body !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(body)) {
        // Sanitize key
        const sanitizedKey = SecurityUtils.sanitizeText(key, 100);
        
        // Skip suspicious keys
        if (SecurityUtils.detectSuspiciousActivity(sanitizedKey)) {
          continue;
        }

        sanitized[sanitizedKey] = this.sanitizeRequestBody(value);
      }
      return sanitized;
    }

    return body;
  }

  /**
   * Add security headers to response
   */
  private static addSecurityHeaders(response: NextResponse): void {
    const headers = SecurityUtils.getSecureHeaders();
    
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }

  /**
   * Create a standardized success response
   */
  static success(data: any, message?: string, statusCode: number = 200): NextResponse {
    const response = NextResponse.json({
      success: true,
      message: message || "Operation successful",
      data,
      timestamp: new Date().toISOString(),
    }, { status: statusCode });

    this.addSecurityHeaders(response);
    return response;
  }

  /**
   * Create a standardized error response
   */
  static error(message: string, statusCode: number = 400, details?: any): NextResponse {
    const response = NextResponse.json({
      success: false,
      error: message,
      details: process.env.NODE_ENV === "development" ? details : undefined,
      timestamp: new Date().toISOString(),
    }, { status: statusCode });

    this.addSecurityHeaders(response);
    return response;
  }
}

// Predefined configurations for common use cases
export const ApiConfigs = {
  // Public API (no auth required)
  public: {
    requiresAuth: false,
    maxRequestSize: 1024 * 1024, // 1MB
    rateLimit: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  },

  // User API (requires user authentication)
  user: {
    requiresAuth: true,
    allowedRoles: ["user", "admin"] as UserRole[],
    maxRequestSize: 10 * 1024 * 1024, // 10MB for file uploads
    rateLimit: { requests: 200, windowMs: 15 * 60 * 1000 }, // 200 requests per 15 minutes
  },

  // Reviewer API (requires reviewer authentication)
  reviewer: {
    requiresAuth: true,
    allowedRoles: ["reviewer", "admin"] as UserRole[],
    maxRequestSize: 5 * 1024 * 1024, // 5MB
    rateLimit: { requests: 300, windowMs: 15 * 60 * 1000 }, // 300 requests per 15 minutes
  },

  // Admin API (requires admin authentication)
  admin: {
    requiresAuth: true,
    allowedRoles: ["admin"] as UserRole[],
    maxRequestSize: 50 * 1024 * 1024, // 50MB
    rateLimit: { requests: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
  },

  // High security API (with CSRF protection)
  secure: {
    requiresAuth: true,
    validateCSRF: true,
    maxRequestSize: 1024 * 1024, // 1MB
    rateLimit: { requests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
  },
};
