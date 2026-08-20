/* ================= سودیار — نمونه‌ی مرجع بک‌اند محلی =================
   این سرور دقیقاً همون چیزیه که قبلاً توضیح داده شد: توکن گوگل رو
   سمت سرور تأیید می‌کنه (نه فقط توی مرورگر)، کاربر رو در یک دیتابیس
   ذخیره می‌کنه، و یک نشست (session) واقعی با کوکی امن می‌سازه.

   اجرا: npm install && npm start
   بعدش کل سایت (نه فقط API) روی http://localhost:3000 در دسترسه.
   -----------------------------------------------------------------------
   این یک نمونه‌ی مرجع برای توسعه‌ی محلیه. قبل از استفاده‌ی واقعی
   (پروداکشن): دیتابیس فایل JSON رو با یک دیتابیس واقعی (Postgres/
   MySQL/MongoDB) عوض کنید، حتماً از HTTPS استفاده کنید، و مقدار
   GOOGLE_CLIENT_ID رو زیر پر کنید تا سرور مطمئن بشه توکن واقعاً برای
   همین سایت صادر شده (الان به‌صورت پیش‌فرض این چک رد می‌شه چون هنوز
   دامنه‌ی نهایی و Client ID واقعی مشخص نیست). */

const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const SITE_ROOT = path.join(__dirname, '..'); // پوشه‌ی اصلی سایت (index.html و بقیه)

// TODO: بعد از ساخت Client ID واقعی توی Google Cloud Console، همون مقدار
// را که در js/auth.js هم گذاشتید، اینجا هم قرار بدید تا سرور چک کنه توکن
// واقعاً برای همین سایت صادر شده (جلوگیری از سوءاستفاده‌ی توکن‌های دیگر).
const GOOGLE_CLIENT_ID = "692492580918-n1nq57i2j01c8e8c8erbdh8v6vd763ld.apps.googleusercontent.com"; // مثال: "xxxxxxxx.apps.googleusercontent.com"

app.use(express.json());
app.use(cookieParser());
app.use(express.static(SITE_ROOT));

function readDb(){
  if (!fs.existsSync(DB_FILE)){
    return { users: [], sessions: {} };
  }
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch (e){ return { users: [], sessions: {} }; }
}
function writeDb(db){
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// ---------- POST /api/auth/google : تأیید واقعی توکن گوگل سمت سرور ----------
app.post('/api/auth/google', async (req, res) => {
  const credential = req.body && req.body.credential;
  if (!credential){
    return res.status(400).json({ ok: false, error: 'credential is missing' });
  }

  try {
    // آدرس رسمی خود گوگل برای تأیید امضا، انقضا و صادرکننده‌ی توکن —
    // ساده‌ترین راه برای تأیید سمت سرور بدون نیاز به کتابخونه‌ی جداگانه.
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok){
      return res.status(401).json({ ok: false, error: 'invalid google token' });
    }
    const payload = await verifyRes.json();

    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID){
      return res.status(401).json({ ok: false, error: 'client id mismatch' });
    }
    if (!payload.email){
      return res.status(401).json({ ok: false, error: 'token has no email' });
    }

    const db = readDb();
    let user = db.users.find(u => u.googleId === payload.sub || u.email === payload.email);
    if (!user){
      user = {
        id: crypto.randomUUID(),
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || '',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      // اطلاعات پروفایل (اسم/عکس) رو به‌روز نگه می‌داریم
      user.name = payload.name || user.name;
      user.picture = payload.picture || user.picture;
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    db.sessions[sessionToken] = user.id;
    writeDb(db);

    res.cookie('sudyar_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // ۳۰ روز
    });
    res.json({
      ok: true,
      user: { name: user.name, email: user.email, picture: user.picture }
    });
  } catch (err){
    console.error('google auth error:', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// ---------- GET /api/auth/me : کاربر فعلاً واردشده (بر اساس کوکی) ----------
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.sudyar_session;
  const db = readDb();
  const userId = token && db.sessions[token];
  const user = userId && db.users.find(u => u.id === userId);
  if (!user){
    return res.status(401).json({ ok: false });
  }
  res.json({ ok: true, user: { name: user.name, email: user.email, picture: user.picture } });
});

// ---------- POST /api/auth/logout ----------
app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies.sudyar_session;
  if (token){
    const db = readDb();
    delete db.sessions[token];
    writeDb(db);
  }
  res.clearCookie('sudyar_session');
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`سرور سودیار روی http://localhost:${PORT} در حال اجراست`);
});
