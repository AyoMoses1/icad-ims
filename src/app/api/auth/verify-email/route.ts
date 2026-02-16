import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api-client";

/**
 * GET /api/auth/verify-email
 * Handles email verification via GET request (redirect from email link)
 * The backend will handle the verification and redirect back to frontend
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  if (!userId || !token) {
    // Redirect to frontend with error
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${frontendUrl}/auth/verify-email?error=${encodeURIComponent("Invalid verification link. Please request a new one.")}`
    );
  }

  try {
    // Call backend API to verify email
    const result = await apiPost<boolean>("/api/auth/verify-email", {
      userId,
      token,
    });

    if (result.success && result.data) {
      // Redirect to frontend with success
      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${frontendUrl}/auth/verify-email?success=true`
      );
    } else {
      // Redirect to frontend with error
      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      const errorMessage = result.error?.message || "Email verification failed";
      return NextResponse.redirect(
        `${frontendUrl}/auth/verify-email?error=${encodeURIComponent(errorMessage)}`
      );
    }
  } catch (error) {
    // Redirect to frontend with error
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred during verification";
    return NextResponse.redirect(
      `${frontendUrl}/auth/verify-email?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Handles email verification via POST request (JSON API)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        {
          apiVersion: "v1",
          success: false,
          code: "400",
          message: "Unsuccessful",
          requestId: null,
          data: null,
          error: {
            message: "User ID and verification token are required",
            code: "400",
          },
        },
        { status: 400 }
      );
    }

    // Ensure token is properly decoded (it should already be decoded from URL params)
    const decodedToken = decodeURIComponent(token.trim());
    const trimmedUserId = userId.trim();

    // Call backend API to verify email
    const result = await apiPost<boolean>("/api/auth/verify-email", {
      userId: trimmedUserId,
      token: decodedToken,
    });

    if (result.success && result.data) {
      return NextResponse.json({
        apiVersion: "v1",
        success: true,
        code: "200",
        message: "Successful",
        requestId: null,
        data: true,
        error: null,
      });
    } else {
      // Return the error from backend
      const errorMessage =
        result.error?.message || result.message || "Email verification failed";
      const errorCode = result.error?.code || result.code || "400";

      return NextResponse.json(
        {
          apiVersion: "v1",
          success: false,
          code: errorCode,
          message: "Unsuccessful",
          requestId: null,
          data: null,
          error: {
            message: errorMessage,
            code: errorCode,
          },
        },
        { status: parseInt(errorCode) || 400 }
      );
    }
  } catch (error) {
    console.error("Email verification API error:", error);
    return NextResponse.json(
      {
        apiVersion: "v1",
        success: false,
        code: "500",
        message: "Unsuccessful",
        requestId: null,
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "An error occurred during verification. Please try again or contact support.",
          code: "500",
        },
      },
      { status: 500 }
    );
  }
}
