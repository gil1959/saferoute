import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}_${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, phone, password, confirm_password } = body;

    // Validasi basic
    if (!full_name || !email || !phone || !password || !confirm_password) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }
    if (password !== confirm_password) {
      return NextResponse.json(
        { error: "Password dan konfirmasi password tidak cocok." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Normalisasi phone (pastikan pakai +62 atau 08xx)
    const cleanPhone = phone.replace(/\s+/g, "").replace(/^0/, "62").replace(/^\+/, "");
    const normalizedPhone = `+${cleanPhone}`;

    // Cek duplikat email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS", message: "Akun dengan email ini sudah terdaftar." },
        { status: 409 }
      );
    }

    // Cek duplikat phone
    const existingPhone = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "PHONE_EXISTS", message: "Akun dengan nomor HP ini sudah terdaftar." },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Generate verification code
    const verify_code = generateCode();
    const verify_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Buat user
    const username = generateUsername(full_name);
    await prisma.user.create({
      data: {
        username,
        email,
        phone: normalizedPhone,
        password_hash,
        full_name,
        email_verified: false,
        verify_code,
        verify_expires,
      },
    });

    // Kirim email verifikasi
    await sendVerificationEmail(email, full_name, verify_code);

    return NextResponse.json({ success: true, email });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
