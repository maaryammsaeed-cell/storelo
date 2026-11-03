import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Setting from "@/lib/models/Setting";
import Admin from "@/lib/models/Admin";
import { verifyToken } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Sirf logged-in admin hi settings dekh/save kar sakta hai
async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return null;

  return verifyToken(token);
}

// Text fields ko trim karta hai aur lambai ki hadd me rakhta hai
function cleanField(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET() {
  await connection();

  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Pehli baar page khulne par default settings bana do.
    // upsert use kar rahe hain taake do requests ek saath aayein to duplicate
    // document na bane (pehle yahi bug hua tha).
    const existing = await Setting.findOne({ key: "store" }).lean();
    if (!existing) {
      await Setting.updateOne(
        { key: "store" },
        { $setOnInsert: { key: "store" } },
        { upsert: true }
      );
    }

    // Form me wohi text dikhe jo site par chal raha hai — khali field ki
    // jagah default text (lib/settings.js ka fallback).
    const settings = await getSettings();

    const adminDoc = await Admin.findById(admin.sub).lean();

    return NextResponse.json({
      settings,
      admin: adminDoc
        ? { name: adminDoc.name || "Admin", email: adminDoc.email }
        : { name: "Admin", email: admin.email },
    });
  } catch (error) {
    console.error("Settings load error:", error?.message);
    return NextResponse.json(
      { error: "Settings load nahi hui" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  await connection();

  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const update = {};
    const contentUpdate = {};

    if (body.storeName !== undefined) {
      const storeName = String(body.storeName).trim();
      if (!storeName) {
        return NextResponse.json(
          { error: "Store name khali nahi ho sakta" },
          { status: 400 }
        );
      }
      update.storeName = storeName;
    }

    if (body.logo !== undefined) {
      const logo = String(body.logo).trim();
      if (logo && !logo.startsWith("/uploads/") && !logo.startsWith("/images/")) {
        return NextResponse.json(
          { error: "Logo path sahi nahi hai" },
          { status: 400 }
        );
      }
      update.logo = logo;
    }

    if (body.locale !== undefined) {
      update.locale = String(body.locale).trim() || "en-US";
    }

    // Landing page ka hero section.
    // Sirf wohi fields badalte hain jo request me aaye hain — baaki text
    // jaisa tha waisa rehta hai (adhoora PATCH poora hero na uda de).
    if (body.hero !== undefined) {
      const hero = body.hero || {};
      contentUpdate.hero = {};

      if (hero.before !== undefined) {
        contentUpdate.hero.before = cleanField(hero.before, 120);
      }
      if (hero.accent !== undefined) {
        contentUpdate.hero.accent = cleanField(hero.accent, 120);
      }
      if (hero.after !== undefined) {
        contentUpdate.hero.after = cleanField(hero.after, 120);
      }
      if (hero.text !== undefined) {
        contentUpdate.hero.text = cleanField(hero.text, 600);
      }
      if (hero.buttonLabel !== undefined) {
        contentUpdate.hero.buttonLabel = cleanField(hero.buttonLabel, 40);
      }
      if (hero.buttonHref !== undefined) {
        contentUpdate.hero.buttonHref =
          cleanField(hero.buttonHref, 200) || "#products";
      }
    }

    // Landing page ka footer section
    if (body.footer !== undefined) {
      const footer = body.footer || {};
      contentUpdate.footer = {};

      if (footer.heading !== undefined) {
        contentUpdate.footer.heading = cleanField(footer.heading, 120);
      }
      if (footer.text !== undefined) {
        contentUpdate.footer.text = cleanField(footer.text, 400);
      }
      if (footer.buttonLabel !== undefined) {
        contentUpdate.footer.buttonLabel = cleanField(footer.buttonLabel, 40);
      }
      if (footer.buttonHref !== undefined) {
        contentUpdate.footer.buttonHref =
          cleanField(footer.buttonHref, 200) || "#products";
      }
    }

    if (body.supportEmail !== undefined) {
      const supportEmail = String(body.supportEmail).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
        return NextResponse.json(
          { error: "Support email sahi nahi hai" },
          { status: 400 }
        );
      }
      update.supportEmail = supportEmail;
    }

    if (body.currency !== undefined) {
      update.currency = String(body.currency).trim().toUpperCase().slice(0, 3);
    }

    if (body.lowStockLimit !== undefined) {
      const lowStockLimit = Number(body.lowStockLimit);
      if (
        !Number.isInteger(lowStockLimit) ||
        lowStockLimit < 0 ||
        lowStockLimit > 1000
      ) {
        return NextResponse.json(
          { error: "Low stock limit 0 se 1000 ke darmiyan ho" },
          { status: 400 }
        );
      }
      update.lowStockLimit = lowStockLimit;
    }

    if (body.orderPrefix !== undefined) {
      const orderPrefix = String(body.orderPrefix).trim().toUpperCase();
      if (!/^[A-Z]{2,5}$/.test(orderPrefix)) {
        return NextResponse.json(
          { error: "Order prefix 2 se 5 letters ka ho" },
          { status: 400 }
        );
      }
      update.orderPrefix = orderPrefix;
    }

    if (body.emailNotifications !== undefined) {
      update.emailNotifications = Boolean(body.emailNotifications);
    }

    if (body.orderNotifications !== undefined) {
      update.orderNotifications = Boolean(body.orderNotifications);
    }

    await connectDB();

    let settings = await Setting.findOne({ key: "store" });
    if (!settings) settings = new Setting({ key: "store" });

    Object.assign(settings, update);

    // Hero/footer me purane text ke upar sirf naye fields chadhao
    if (contentUpdate.hero) {
      settings.hero = { ...(settings.hero || {}), ...contentUpdate.hero };
    }
    if (contentUpdate.footer) {
      settings.footer = { ...(settings.footer || {}), ...contentUpdate.footer };
    }

    await settings.save();

    // Admin ka display name update
    if (body.adminName !== undefined) {
      const name = String(body.adminName).trim();
      if (!name) {
        return NextResponse.json(
          { error: "Admin name khali nahi ho sakta" },
          { status: 400 }
        );
      }

      const adminDoc = await Admin.findById(admin.sub);
      if (adminDoc) {
        adminDoc.name = name;
        await adminDoc.save();
      }
    }

    const adminDoc = await Admin.findById(admin.sub).lean();

    // Form ko wohi values wapas bhejo jo site par chal rahi hain
    // (khali field ki jagah default text — GET jaisa hi).
    const saved = await getSettings();

    return NextResponse.json({
      settings: saved,
      admin: adminDoc
        ? { name: adminDoc.name || "Admin", email: adminDoc.email }
        : null,
    });
  } catch (error) {
    console.error("Settings update error:", error?.message);
    return NextResponse.json(
      { error: "Settings save nahi hui" },
      { status: 500 }
    );
  }
}