/* ================= AUTH PAGES — shared behaviour =================
   This is a FRONT-END-ONLY prototype for the marketing site. Sign-in
   here is simple email + password (plus a "Sign in with Google"
   shortcut) — no SMS/OTP panel, since that belongs to the actual
   software product, not the intro website. Every place that needs a
   real backend is marked with  TODO(API):
   ------------------------------------------------------------------
   Demo account is stored at localStorage["sudyar_demo_account"] as:
   { email, passwordHash, businessName, activityType, provider }
   passwordHash is NOT real hashing — just a placeholder so the demo
   doesn't store plaintext in an obvious field name. Real hashing
   (bcrypt/argon2, server-side) happens once the real backend/auth
   is built.
*/

function faDigits(str){
  const en = "0123456789";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(str).replace(/[0-9]/g, d => fa[en.indexOf(d)]);
}

function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

/* ---------- resend / cooldown countdown (used by "resend reset email") ---------- */
function startResendTimer(buttonEl, seconds, onExpire){
  let remaining = seconds;
  buttonEl.disabled = true;
  const label = buttonEl.dataset.label || "ارسال دوباره";
  buttonEl.textContent = `${label} (${faDigits(remaining)})`;
  const tick = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0){
      clearInterval(tick);
      buttonEl.disabled = false;
      buttonEl.textContent = label;
      if (onExpire) onExpire();
    } else {
      buttonEl.textContent = `${label} (${faDigits(remaining)})`;
    }
  }, 1000);
}

/* ---------- mocked email send (password reset link) ----------
   TODO(API): replace with a real call once the backend is ready, e.g.:
     await fetch('/api/auth/password-reset', {method:'POST', body:JSON.stringify({email})}) */
function sendResetEmail(email){
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 500));
}

/* ---------- real "Sign in with Google" (Google Identity Services) ----------
   This is the one piece of the site that genuinely cannot be self-hosted
   or work offline — Google's own identity servers must be reachable live
   at the moment someone signs in, no matter how it's implemented. That's
   true of ANY third-party sign-in (Google, Apple, GitHub, ...), not a
   Google-specific limitation, and there's no workaround for it. Everything
   else on this site stays fully self-hosted; this is the sole exception.

   The good news on cost: unlike an SMS panel, "Sign in with Google" itself
   has no per-login charge or quota — it's free and unlimited once set up.

   SETUP REQUIRED — this does nothing until you do this:
   1. Go to https://console.cloud.google.com/apis/credentials
   2. Create an OAuth 2.0 Client ID → Application type: "Web application"
   3. Under "Authorized JavaScript origins" add your real site's address
      (e.g. https://sudyar.app) — and http://localhost:PORT while testing
      locally. Google Sign-In will not work from an origin that isn't
      listed here, or from a file:// path.
   4. Replace GOOGLE_CLIENT_ID below with the client ID Google gives you.

   BACKEND: see /server for a minimal reference backend that verifies the
   Google token server-side and creates a real session — run it with
   `npm install && npm start` inside /server and it'll serve the whole
   site at http://localhost:3000, API included. Without it running, the
   code below still works for previewing the UI, but falls back to a
   browser-only (unverified) decode of the token — see the `verified`
   flag on the result passed to onSignIn(). */
const GOOGLE_CLIENT_ID = "692492580918-n1nq57i2j01c8e8c8erbdh8v6vd763ld.apps.googleusercontent.com"; // TODO: replace with your real client ID

/** Decodes the (unverified, client-side-only) payload of the Google ID
 *  token — enough to read the signed-in user's email/name/picture for this
 *  front-end demo. TODO(API): once a real backend exists, send the raw
 *  credential to it and verify the token's signature there — never trust
 *  a client-decoded token for anything security-sensitive. */
function decodeGoogleCredential(credential){
  try {
    const payload = credential.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch (e){ return null; }
}

/** Renders Google's own real sign-in button into containerEl. onSignIn is
 *  called with {ok, email, name, picture, verified} once someone actually
 *  picks a Google account. `verified: true` means a real backend checked
 *  the token server-side (see /server); `verified: false` means it was
 *  only decoded in the browser because no backend was reachable — fine
 *  for previewing the UI, but never trust that for anything real.
 *  onUnavailable is called instead if Google's script never loaded (e.g.
 *  no internet) — wire it to hide the button and show a fallback message. */
function renderGoogleButton(containerEl, onSignIn, onUnavailable){
  if (typeof google === "undefined" || !google.accounts || !google.accounts.id){
    if (onUnavailable) onUnavailable();
    return;
  }
  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        // 1) Try the real local backend first (see /server) — it verifies
        //    the token server-side and creates a real session cookie.
        try {
          const r = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
            credentials: "include"
          });
          if (r.ok){
            const data = await r.json();
            onSignIn({ ok: true, email: data.user.email, name: data.user.name, picture: data.user.picture, verified: true });
            return;
          }
        } catch (e){
          // backend not running (e.g. previewing with a plain static server
          // instead of `npm start` inside /server) — fall through below
        }
        // 2) Fallback: decode the token in the browser only. Good enough to
        //    preview the UI end-to-end without the backend running, but this
        //    is NOT verified — never treat it as a trusted login.
        const payload = decodeGoogleCredential(response.credential);
        if (!payload || !payload.email){ onSignIn({ ok: false }); return; }
        onSignIn({ ok: true, email: payload.email, name: payload.name, picture: payload.picture, verified: false });
      }
    });
    google.accounts.id.renderButton(containerEl, {
      type: "standard", theme: "outline", size: "large",
      shape: "pill", text: "continue_with", logo_alignment: "center",
      locale: "fa",
      width: Math.min(containerEl.offsetWidth || 360, 360)
    });
  } catch (e){
    if (onUnavailable) onUnavailable();
  }
}

/* ---------- demo account storage ---------- */
function getDemoAccount(){
  try { return JSON.parse(localStorage.getItem("sudyar_demo_account") || "null"); }
  catch(e){ return null; }
}
function setDemoAccount(data){
  try { localStorage.setItem("sudyar_demo_account", JSON.stringify(data)); }
  catch(e){ /* ignore (e.g. storage disabled) */ }
}

/* ---------- password rule checks ---------- */
function passwordRules(pw){
  return {
    len: pw.length >= 8,
  };
}
