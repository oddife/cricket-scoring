import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MAX_SIZE = 2 * 1024 * 1024;
const MAINTENANCE_PIN = process.env.MAINTENANCE_PIN ?? "2580";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const EXTENSION_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

async function findLogoFile() {
  try {
    const files = await fs.readdir(DATA_DIR);
    const logo = files.find((file) => /^app-logo\.(png|jpg|webp)$/i.test(file));
    return logo ? path.join(DATA_DIR, logo) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const logoPath = await findLogoFile();

  if (!logoPath) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const extension = path.extname(logoPath).slice(1).toLowerCase();
    const data = await fs.readFile(logoPath);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": EXTENSION_TO_MIME[extension] ?? "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body?.pin !== MAINTENANCE_PIN) {
      return NextResponse.json({ error: "Invalid maintenance PIN." }, { status: 403 });
    }

    if (typeof body?.logo !== "string") {
      return NextResponse.json({ error: "No logo supplied." }, { status: 400 });
    }

    const match = body.logo.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Only PNG, JPG and WebP images are supported." },
        { status: 400 },
      );
    }

    const mime = match[1];
    const extension = MIME_TO_EXTENSION[mime];
    const buffer = Buffer.from(match[2], "base64");

    if (!extension || !buffer.length) {
      return NextResponse.json({ error: "Invalid logo image." }, { status: 400 });
    }

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "App logo must be 2 MB or smaller." },
        { status: 400 },
      );
    }

    await fs.mkdir(DATA_DIR, { recursive: true });

    const existingFiles = await fs.readdir(DATA_DIR).catch(() => []);
    await Promise.all(
      existingFiles
        .filter((file) => /^app-logo\.(png|jpg|webp)$/i.test(file))
        .map((file) => fs.unlink(path.join(DATA_DIR, file)).catch(() => undefined)),
    );

    await fs.writeFile(path.join(DATA_DIR, `app-logo.${extension}`), buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save app logo:", error);
    return NextResponse.json({ error: "Failed to save app logo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body?.pin !== MAINTENANCE_PIN) {
      return NextResponse.json({ error: "Invalid maintenance PIN." }, { status: 403 });
    }

    const logoPath = await findLogoFile();
    if (logoPath) {
      await fs.unlink(logoPath).catch(() => undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove app logo:", error);
    return NextResponse.json({ error: "Failed to remove app logo." }, { status: 500 });
  }
}
