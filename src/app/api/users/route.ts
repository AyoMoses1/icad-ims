import { NextRequest, NextResponse } from "next/server";
import { mockDataStore, generateId, getUserFullName } from "@/lib/mock-data";
import { User, UserStatus } from "@/types";

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    let users = mockDataStore.users;

    // Filter by status
    if (status) {
      users = users.filter((u) => u.status === status);
    }

    // Filter by search
    if (search) {
      users = users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search)
      );
    }

    // Add fullName to each user
    const usersWithFullName = users.map((u) => ({
      ...u,
      fullName: getUserFullName(u),
    }));

    // Paginate
    const totalCount = usersWithFullName.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = usersWithFullName.slice(
      startIndex,
      startIndex + pageSize
    );

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pageNumber: page,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch users" },
      },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      username,
      country,
      dateOfBirth,
    } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email, first name, and last name are required",
          },
        },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingEmail = mockDataStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existingEmail) {
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

    const newUser: User = {
      id: generateId("user"),
      username: username || email.split("@")[0],
      email,
      phoneNumber: phoneNumber || "",
      firstName,
      middleName: middleName || "",
      lastName,
      dateOfBirth,
      country: country || "Nigeria",
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDataStore.addUser(newUser);

    return NextResponse.json(
      {
        success: true,
        data: { ...newUser, fullName: getUserFullName(newUser) },
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create user" },
      },
      { status: 500 }
    );
  }
}







