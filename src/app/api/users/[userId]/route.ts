import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, getUserById, getUserFullName } from "@/lib/mock-data";

// GET /api/users/[userId]
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = getUserById(params.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...user, fullName: getUserFullName(user) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch user" },
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = getUserById(params.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      country,
      dateOfBirth,
      status,
    } = body;

    // Check for duplicate email (excluding current user)
    if (email && email !== user.email) {
      const existing = mockDataStore.users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.id !== params.userId
      );
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_EMAIL",
              message: "A user with this email already exists",
            },
          },
          { status: 409 }
        );
      }
    }

    mockDataStore.updateUser(params.userId, {
      ...(email && { email }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(middleName !== undefined && { middleName }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(country && { country }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    });

    const updatedUser = getUserById(params.userId);

    return NextResponse.json({
      success: true,
      data: updatedUser
        ? { ...updatedUser, fullName: getUserFullName(updatedUser) }
        : null,
      message: "User updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update user" },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = getUserById(params.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    mockDataStore.deleteUser(params.userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete user" },
      },
      { status: 500 }
    );
  }
}







