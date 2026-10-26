import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import { createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!admin) {
      return NextResponse.json(
        { error:  "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    const isCorrect = await bcrypt.compare(password, admin.passwordHash);
    if (!isCorrect) {
      return NextResponse.json(
        { error:  "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    const token = await createToken({
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}