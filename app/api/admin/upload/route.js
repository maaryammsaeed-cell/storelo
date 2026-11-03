import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Only logged-in admin can upload
async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension or fallback to .jpg
    const originalExt = path.extname(file.name || "") || ".jpg";
    const cleanExt = originalExt.toLowerCase().match(/^\.[a-z0-9]+$/)
      ? originalExt.toLowerCase()
      : ".jpg";

    const uniqueName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${cleanExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${uniqueName}` }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Image upload failed. Dobara try karein." },
      { status: 500 }
    );
  }
}
