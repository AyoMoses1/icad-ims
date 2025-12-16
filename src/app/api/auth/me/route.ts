import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, getUserFullName } from "@/lib/mock-data";
import { UserWithFullName } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // In a real app, validate the JWT token from Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // Mock: Extract user ID from token (format: mock-token-{userId}-{timestamp})
    const token = authHeader.replace("Bearer ", "");
    const tokenParts = token.split("-");

    if (tokenParts.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid authentication token",
          },
        },
        { status: 401 }
      );
    }

    const userId = `${tokenParts[2]}-${tokenParts[3]}`;
    const user = mockDataStore.users.find((u) => u.id === userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    const userWithFullName: UserWithFullName = {
      ...user,
      fullName: getUserFullName(user),
    };

    return NextResponse.json({
      success: true,
      data: userWithFullName,
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







