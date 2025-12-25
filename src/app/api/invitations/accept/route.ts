import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function handleAcceptInvitation(request: NextRequest) {
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

    const url = `${API_BASE_URL}/iam/api/v1/invitations/accept`;

    const response = await fetch(url, {
      method: "PUT",
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
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to accept invitation",
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/invitations/accept
export async function PUT(request: NextRequest) {
  return handleAcceptInvitation(request);
}

// POST /api/invitations/accept (kept for backward compatibility)
export async function POST(request: NextRequest) {
  return handleAcceptInvitation(request);
}
