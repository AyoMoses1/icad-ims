import { NextRequest, NextResponse } from "next/server";
import { mockDataStore } from "@/lib/mock-data";
import { UserStatus } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Verification token is required",
          },
        },
        { status: 400 }
      );
    }

    // In a real app, validate the token and find the user
    // For mock, we'll accept any token that starts with "verify-"
    if (!token.startsWith("verify-")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired verification token",
          },
        },
        { status: 400 }
      );
    }

    // Extract user ID from token (mock implementation)
    const userId = token.replace("verify-", "");
    const user = mockDataStore.users.find((u) => u.id === userId);

    if (user) {
      mockDataStore.updateUser(userId, {
        emailVerified: true,
        status: UserStatus.ACTIVE,
        updatedAt: new Date().toISOString(),
      });
    }

    console.warn("[DEV] Email verification simulated. User would be verified.");

    return NextResponse.json({
      success: true,
      message: "Email has been successfully verified",
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







