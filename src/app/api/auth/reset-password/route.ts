import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, password, confirm_password } = await req.json();

    if (!token || !password || !confirm_password) {
      return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
    }
    if (password !== confirm_password) {
      return NextResponse.json({ error: "Password dan konfirmasi tidak cocok." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { reset_token: token } });

    if (!user || !user.reset_expires) {
      return NextResponse.json({ error: "Link reset tidak valid." }, { status: 400 });
    }
    if (new Date() > user.reset_expires) {
      return NextResponse.json({ error: "EXPIRED", message: "Link reset sudah kedaluwarsa. Minta link baru." }, { status: 410 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password_hash,
        reset_token: null,
        reset_expires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RESET PASSWORD ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
