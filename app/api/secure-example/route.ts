/**
 * Example of a secure API route using the SecureApiWrapper
 * This demonstrates production-ready security patterns
 */

import { NextRequest } from "next/server";
import { SecureApiWrapper, ApiConfigs } from "@/lib/api-wrapper";
import { SecurityUtils } from "@/lib/security";
import { ErrorHandler } from "@/lib/error-handler";
import { getServerSupabaseClient } from "@/lib/supabase-server";

// GET - Public endpoint with rate limiting
export const GET = SecureApiWrapper.wrap(
  async (request: NextRequest, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get("q");

      // Validate and sanitize input
      if (query) {
        const sanitizedQuery = SecurityUtils.sanitizeText(query, 100);
        
        if (SecurityUtils.detectSuspiciousActivity(sanitizedQuery)) {
          throw ErrorHandler.validationError("Invalid search query");
        }

        // Use sanitized query for search
        console.log("Searching for:", sanitizedQuery);
      }

      // Example data response
      const data = {
        message: "This is a secure public endpoint",
        query: query ? SecurityUtils.sanitizeText(query, 100) : null,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
      };

      return SecureApiWrapper.success(data, "Data retrieved successfully");

    } catch (error) {
      throw ErrorHandler.serverError("Failed to fetch data");
    }
  },
  ApiConfigs.public
);

// POST - User-only endpoint with validation
export const POST = SecureApiWrapper.wrap(
  async (request: NextRequest, context) => {
    try {
      // Body is already parsed and sanitized by the wrapper
      const { title, description, tags } = context.body;

      // Validate required fields
      if (!title || !description) {
        throw ErrorHandler.validationError("Title and description are required");
      }

      // Validate field lengths and content
      const sanitizedTitle = SecurityUtils.sanitizeText(title, 200);
      const sanitizedDescription = SecurityUtils.sanitizeText(description, 1000);

      if (!sanitizedTitle || !sanitizedDescription) {
        throw ErrorHandler.validationError("Title and description cannot be empty after sanitization");
      }

      // Validate tags if provided
      let sanitizedTags: string[] = [];
      if (tags && Array.isArray(tags)) {
        sanitizedTags = tags
          .map((tag: any) => SecurityUtils.sanitizeText(String(tag), 50))
          .filter(Boolean)
          .slice(0, 10); // Limit to 10 tags
      }

      // Database operation with Supabase
      const supabase = await getServerSupabaseClient();
      
      const { data, error } = await supabase
        .from("example_table")
        .insert({
          title: sanitizedTitle,
          description: sanitizedDescription,
          tags: sanitizedTags,
          user_id: context.session.user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw ErrorHandler.databaseError("Failed to create record");
      }

      return SecureApiWrapper.success(data, "Record created successfully", 201);

    } catch (error) {
      if (error instanceof Error && error.message.includes("Database")) {
        throw error; // Re-throw database errors
      }
      throw ErrorHandler.serverError("Failed to process request");
    }
  },
  ApiConfigs.user
);

// PUT - Reviewer-only endpoint with CSRF protection
export const PUT = SecureApiWrapper.wrap(
  async (request: NextRequest, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      // Validate ID parameter
      if (!id || !SecurityUtils.validateUuid(id)) {
        throw ErrorHandler.validationError("Valid ID is required");
      }

      const { title, status } = context.body;

      // Validate input
      if (!title) {
        throw ErrorHandler.validationError("Title is required");
      }

      const sanitizedTitle = SecurityUtils.sanitizeText(title, 200);
      
      // Validate status enum
      const allowedStatuses = ["draft", "published", "archived"];
      if (status && !allowedStatuses.includes(status)) {
        throw ErrorHandler.validationError(`Status must be one of: ${allowedStatuses.join(", ")}`);
      }

      // Database operation
      const supabase = await getServerSupabaseClient();
      
      const { data, error } = await supabase
        .from("example_table")
        .update({
          title: sanitizedTitle,
          status: status || "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", context.session.user.id) // Ensure user owns the record
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") { // No rows returned
          throw ErrorHandler.notFoundError("Record not found or access denied");
        }
        console.error("Database error:", error);
        throw ErrorHandler.databaseError("Failed to update record");
      }

      return SecureApiWrapper.success(data, "Record updated successfully");

    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      throw ErrorHandler.serverError("Failed to update record");
    }
  },
  {
    ...ApiConfigs.reviewer,
    validateCSRF: true, // Enable CSRF protection for state-changing operations
  }
);

// DELETE - Admin-only endpoint
export const DELETE = SecureApiWrapper.wrap(
  async (request: NextRequest, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id || !SecurityUtils.validateUuid(id)) {
        throw ErrorHandler.validationError("Valid ID is required");
      }

      const supabase = await getServerSupabaseClient();
      
      // First check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from("example_table")
        .select("id, title")
        .eq("id", id)
        .single();

      if (fetchError || !existing) {
        throw ErrorHandler.notFoundError("Record not found");
      }

      // Delete the record
      const { error } = await supabase
        .from("example_table")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Database error:", error);
        throw ErrorHandler.databaseError("Failed to delete record");
      }

      return SecureApiWrapper.success(
        { id, title: existing.title }, 
        "Record deleted successfully"
      );

    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      throw ErrorHandler.serverError("Failed to delete record");
    }
  },
  ApiConfigs.admin
);

// Health check endpoint (no authentication required)
export const HEAD = SecureApiWrapper.wrap(
  async (request: NextRequest, context) => {
    return new Response(null, { status: 200 });
  },
  {
    requiresAuth: false,
    rateLimit: { requests: 1000, windowMs: 60 * 1000 }, // High limit for health checks
  }
);
