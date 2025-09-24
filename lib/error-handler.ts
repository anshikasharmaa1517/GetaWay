import { NextResponse } from "next/server";

// Error types for better categorization
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  SERVER = "SERVER_ERROR",
  DATABASE = "DATABASE_ERROR",
  EXTERNAL_API = "EXTERNAL_API_ERROR",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    requestId?: string
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.severity = severity;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Production-safe error responses
export class ErrorHandler {
  /**
   * Create a production-safe error response
   */
  static createErrorResponse(
    error: Error | AppError,
    isDevelopment: boolean = process.env.NODE_ENV === "development"
  ): NextResponse {
    let statusCode = 500;
    let message = "Internal server error";
    let type = ErrorType.SERVER;

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      message = error.message;
      type = error.type;
    }

    // Log error for monitoring
    this.logError(error);

    // Production response (don't expose internal details)
    const productionResponse = {
      error: this.getPublicErrorMessage(type, message),
      type,
      timestamp: new Date().toISOString(),
    };

    // Development response (include more details)
    const developmentResponse = {
      ...productionResponse,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
      details: error instanceof AppError ? {
        severity: error.severity,
        requestId: error.requestId,
      } : undefined,
    };

    return NextResponse.json(
      isDevelopment ? developmentResponse : productionResponse,
      { status: statusCode }
    );
  }

  /**
   * Get user-friendly error messages
   */
  private static getPublicErrorMessage(type: ErrorType, originalMessage: string): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return "Invalid input provided";
      case ErrorType.AUTHENTICATION:
        return "Authentication required";
      case ErrorType.AUTHORIZATION:
        return "Access denied";
      case ErrorType.NOT_FOUND:
        return "Resource not found";
      case ErrorType.RATE_LIMIT:
        return "Too many requests. Please try again later";
      case ErrorType.DATABASE:
        return "Database operation failed";
      case ErrorType.EXTERNAL_API:
        return "External service unavailable";
      case ErrorType.SERVER:
      default:
        return "Internal server error";
    }
  }

  /**
   * Log errors for monitoring
   */
  private static logError(error: Error | AppError): void {
    const logData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error instanceof AppError ? error.type : ErrorType.SERVER,
      severity: error instanceof AppError ? error.severity : ErrorSeverity.HIGH,
      requestId: error instanceof AppError ? error.requestId : undefined,
    };

    // In production, you'd send this to your logging service
    if (process.env.NODE_ENV === "production") {
      console.error("PRODUCTION_ERROR:", JSON.stringify(logData));
      // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    } else {
      console.error("DEV_ERROR:", error);
    }
  }

  /**
   * Handle async errors in API routes
   */
  static asyncHandler(handler: Function) {
    return async (request: Request, context?: any) => {
      try {
        return await handler(request, context);
      } catch (error) {
        return this.createErrorResponse(error as Error);
      }
    };
  }

  /**
   * Create validation error
   */
  static validationError(message: string, requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION,
      400,
      ErrorSeverity.LOW,
      true,
      requestId
    );
  }

  /**
   * Create authentication error
   */
  static authenticationError(message: string = "Authentication required", requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.AUTHENTICATION,
      401,
      ErrorSeverity.MEDIUM,
      true,
      requestId
    );
  }

  /**
   * Create authorization error
   */
  static authorizationError(message: string = "Access denied", requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.AUTHORIZATION,
      403,
      ErrorSeverity.MEDIUM,
      true,
      requestId
    );
  }

  /**
   * Create not found error
   */
  static notFoundError(message: string = "Resource not found", requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.NOT_FOUND,
      404,
      ErrorSeverity.LOW,
      true,
      requestId
    );
  }

  /**
   * Create rate limit error
   */
  static rateLimitError(message: string = "Rate limit exceeded", requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.RATE_LIMIT,
      429,
      ErrorSeverity.MEDIUM,
      true,
      requestId
    );
  }

  /**
   * Create database error
   */
  static databaseError(message: string = "Database operation failed", requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.DATABASE,
      500,
      ErrorSeverity.HIGH,
      true,
      requestId
    );
  }

  /**
   * Create server error
   */
  static serverError(message: string = "Internal server error", requestId?: string): AppError {
    return new AppError(
      message,
      ErrorType.SERVER,
      500,
      ErrorSeverity.HIGH,
      false,
      requestId
    );
  }
}

// Request ID generator for tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Global error handler for unhandled rejections
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to restart the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // In production, you should restart the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}
