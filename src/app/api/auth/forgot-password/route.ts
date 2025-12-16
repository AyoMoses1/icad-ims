import { NextRequest, NextResponse } from "next/server";
import { mockDataStore } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email is required",
          },
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = mockDataStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // Always return success to prevent email enumeration
    // In real app, send reset email if user exists
    if (user) {
      console.warn(
        `[DEV] Password reset email not implemented. Reset token would be sent to: ${email}`
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive password reset instructions.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred",
        },
      },
      { status: 500 }
    );
  }
}







