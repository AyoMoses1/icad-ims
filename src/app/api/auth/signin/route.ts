import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, getUserFullName } from "@/lib/mock-data";
import { UserWithFullName, AuthSession } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required",
          },
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = mockDataStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // Simulate authentication check (in real app, check password hash)
    if (!user || password !== "password123") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "Your account is not active. Please contact support.",
          },
        },
        { status: 403 }
      );
    }

    // Create session
    const userWithFullName: UserWithFullName = {
      ...user,
      fullName: getUserFullName(user),
    };

    const session: AuthSession = {
      user: userWithFullName,
      token: `mock-token-${user.id}-${Date.now()}`,
      refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    return NextResponse.json({
      success: true,
      data: session,
      message: "Successfully signed in",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during sign in",
        },
      },
      { status: 500 }
    );
  }
}







