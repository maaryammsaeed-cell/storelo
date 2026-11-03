 import { NextResponse } from "next/server";
    import { promises as fs } from "fs";
    import path from "path";
    import { cookies } from "next/headers";
    import { verifyToken } from "@/lib/auth";

    // Sirf logged-in admin upload kar sake
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
          return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // File name clean aur unique banayein
        const ext = path.extname(file.name) || ".jpg";
        const uniqueName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;

        // public/uploads folder me save karein
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        // Landing page aur front-end ke liye public path
        return NextResponse.json({ url: `/uploads/${uniqueName}` });
      } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
      }
    }
    if (body.logo !== undefined) {
  const logo = String(body.logo).trim();
  if (logo && !logo.startsWith("/uploads/") && !logo.startsWith("/images/")) {
    return NextResponse.json({ error: "Logo path sahi nahi hai" }, { status: 400 });
  }
  update.logo = logo;
}