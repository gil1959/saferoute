import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, cookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { credential, password } = await req.json();

    if (!credential || !password) {
      return NextResponse.json(
        { error: "Email/nomor HP dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email atau nomor HP
    const isEmail = credential.includes("@");
    let user;
    if (isEmail) {
      user = await prisma.user.findUnique({ where: { email: credential } });
    } else {
      // Normalisasi nomor HP
      const cleanPhone = credential.replace(/\s+/g, "").replace(/^0/, "62").replace(/^\+/, "");
      const normalizedPhone = `+${cleanPhone}`;
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan. Periksa email atau nomor HP Anda." },
        { status: 401 }
      );
    }

    // Cek password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Password salah." }, { status: 401 });
    }

    // Cek email verifikasi
    if (!user.email_verified) {
      return NextResponse.json(
        { error: "EMAIL_NOT_VERIFIED", email: user.email },
        { status: 403 }
      );
    }

    // Cek akun aktif
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Akun Anda dinonaktifkan. Hubungi admin." },
        { status: 403 }
      );
    }

    // Update last_login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    // Buat JWT session
    const token = await signToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    });

    const opts = cookieOptions();
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set(opts.name, token, {
      maxAge: opts.maxAge,
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
    });

    return response;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
