import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, generateId } from "@/lib/mock-data";
import { User, UserStatus } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phoneNumber } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "All required fields must be provided",
          },
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = mockDataStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "An account with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser: User = {
      id: generateId("user"),
      username: email.split("@")[0],
      email,
      phoneNumber: phoneNumber || "",
      firstName,
      middleName: "",
      lastName,
      dateOfBirth: undefined,
      country: "Nigeria",
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.addUser(newUser);

    // Note: In a real app, send verification email here
    console.warn(
      "[DEV] Email verification not implemented. User created with PENDING status."
    );

    return NextResponse.json(
      {
        success: true,
        data: { id: newUser.id },
        message:
          "Account created successfully. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during sign up",
        },
      },
      { status: 500 }
    );
  }
}







