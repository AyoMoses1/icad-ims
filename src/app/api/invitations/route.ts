import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// GET /api/invitations - Proxy to backend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get("authorization");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/iam/api/v1/invitations${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch invitations",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Proxy to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get("authorization");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const url = `${API_BASE_URL}/iam/api/v1/invitations`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create invitation",
        },
      },
      { status: 500 }
    );
  }
}
