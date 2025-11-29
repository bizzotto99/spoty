import { NextRequest, NextResponse } from "next/server"

/**
 * Endpoint para validar el token de acceso a Records
 * Token hardcodeado: 123
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      )
    }

    // Token hardcodeado: solo "123" es válido
    const VALID_TOKEN = "123"

    if (token.trim() === VALID_TOKEN) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json(
        { valid: false, error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error validating access token:", error)
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

