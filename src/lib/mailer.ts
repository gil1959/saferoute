import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "SafeRoute <noreply@saferoute.id>";

function createTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  code: string
) {
  const transport = createTransport();

  const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #cccccc;">
        <tr>
          <td style="height:4px;background:linear-gradient(to right,#0066b1 33%,#1c69d4 33% 66%,#c0190c 66%);"></td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#555555;text-transform:uppercase;">SAFEROUTE</p>
            <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0;">Verifikasi Akun Anda</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#2c2c2c;line-height:1.6;">Halo <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#2c2c2c;line-height:1.6;">
              Gunakan kode berikut untuk memverifikasi alamat email Anda. Kode berlaku selama <strong>15 menit</strong>.
            </p>
            <div style="background:#f5f5f0;border:2px solid #cccccc;padding:24px;text-align:center;margin:0 0 28px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0a0a0a;font-family:monospace;">${code}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
              Jika Anda tidak mendaftar di SafeRoute, abaikan email ini.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:2px solid #ebebeb;">
            <p style="margin:0;font-size:12px;color:#999999;">SafeRoute — Navigasi Kota Aman</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!transport) {
    console.log(`[MAILER FALLBACK] Verification code for ${to}: ${code}`);
    return;
  }

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject: `Kode Verifikasi SafeRoute: ${code}`,
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const transport = createTransport();

  const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #cccccc;">
        <tr>
          <td style="height:4px;background:linear-gradient(to right,#0066b1 33%,#1c69d4 33% 66%,#c0190c 66%);"></td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#555555;text-transform:uppercase;">SAFEROUTE</p>
            <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0;">Reset Password</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#2c2c2c;line-height:1.6;">Halo <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#2c2c2c;line-height:1.6;">
              Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk melanjutkan. Link berlaku <strong>1 jam</strong>.
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <a href="${resetUrl}" style="display:inline-block;background:#0a0a0a;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:14px 32px;text-decoration:none;">
                RESET PASSWORD
              </a>
            </div>
            <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
              Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:2px solid #ebebeb;">
            <p style="margin:0;font-size:12px;color:#999999;">SafeRoute — Navigasi Kota Aman</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!transport) {
    console.log(`[MAILER FALLBACK] Reset URL for ${to}: ${resetUrl}`);
    return;
  }

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject: "Reset Password SafeRoute",
    html,
  });
}
