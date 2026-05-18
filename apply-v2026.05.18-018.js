// İzleKazan otomatik güncelleme betiği
// Sürüm: v2026.05.18-018
// Kullanım: Bu dosyayı proje ana klasörüne koyup `node apply-v2026.05.18-018.js` çalıştırın.

const fs = require("fs");
const path = require("path");

const VERSION = "v2026.05.18-018";
const CACHE = "v20260518018";
const SCRIPT_DIR = __dirname;

function filePath(name) { return path.join(process.cwd(), name); }
function srcPath(name) { return path.join(SCRIPT_DIR, name); }
function exists(name) { return fs.existsSync(filePath(name)); }
function srcExists(name) { return fs.existsSync(srcPath(name)); }
function read(name) { return fs.readFileSync(filePath(name), "utf8"); }
function readSrc(name) { return fs.readFileSync(srcPath(name), "utf8"); }
function write(name, content) { fs.writeFileSync(filePath(name), content, "utf8"); }
function backup(name) {
  if (!exists(name)) return;
  const backupName = `${name}.bak-${VERSION}`;
  if (!exists(backupName)) fs.copyFileSync(filePath(name), filePath(backupName));
}
function replaceOrInsert(content, pattern, replacement, label) {
  if (pattern.test(content)) return content.replace(pattern, replacement);
  throw new Error(`${label} bulunamadı; dosya yapısı beklenenden farklı olabilir.`);
}
function requireSource(name) {
  if (!srcExists(name)) throw new Error(`${name} kaynak dosyası bulunamadı. Zip içindeki tüm dosyaları aynı klasörde tutun.`);
  return readSrc(name);
}

function patchServer() {
  if (!exists("server.js")) throw new Error("server.js bulunamadı.");
  backup("server.js");
  let s = read("server.js");
  const packagesCode = requireSource("server-packages-block.js").trim();
  const leaderboardCode = requireSource("server-leaderboards-endpoint.js").trim();

  s = s.replace(/const APP_VERSION = [^;]+;\n/g, "");
  if (/(const PUBLIC_URL = [^;]+;\n)/.test(s)) {
    s = s.replace(/(const PUBLIC_URL = [^;]+;\n)/, `$1const APP_VERSION = "${VERSION}";\n`);
  }

  s = replaceOrInsert(
    s,
    /const PACKAGES = \[[\s\S]*?\n\];\n\nfunction id\(\)/,
    `${packagesCode}\n\nfunction id()`,
    "PACKAGES bloğu"
  );

  if (!s.includes("function isCeoPackage(")) {
    const premiumPattern = /function isPremium\(u\) \{ return !!\(u && Number\(u\.packageId \|\| 0\) > 0 && u\.premiumUntil && new Date\(u\.premiumUntil\) > new Date\(\)\); \}/;
    if (premiumPattern.test(s)) {
      s = s.replace(premiumPattern, `function isPremium(u) { return !!(u && Number(u.packageId || 0) > 0 && u.premiumUntil && new Date(u.premiumUntil) > new Date()); }\nfunction isCeoPackage(packageId) { return Number(packageId || 0) === 3 || Number(packageId || 0) === 5; }`);
    }
  }

  s = s.replace(/function findPackage\(packageId\) \{ return PACKAGES\.find\(p => p\.id === Number\(packageId\)\); \}/, "function findPackage(packageId) { const normalizedId = isCeoPackage(packageId) ? 3 : Number(packageId); return PACKAGES.find(p => p.id === normalizedId); }");
  s = s.replace(/packageId: 5/g, "packageId: 3");
  s = s.replace(/Number\(u\.packageId\) === 5/g, "isCeoPackage(u.packageId)");
  s = s.replace(/Number\(req\.user\.packageId\) === 5/g, "isCeoPackage(req.user.packageId)");
  s = s.replace(/pack\.id === 5/g, "pack.id === 3");

  s = s.replace(
    /app\.get\("\/api\/health", \(req, res\) => res\.json\(\{ ok: true, storage: supabase \? "supabase" : "db\.json", time: now\(\) \}\)\);/,
    'app.get("/api/health", (req, res) => res.json({ ok: true, storage: supabase ? "supabase" : "db.json", version: APP_VERSION, time: now() }));'
  );

  if (!s.includes('app.get("/api/version"')) {
    s = s.replace(
      /app\.get\("\/api\/health"[\s\S]*?\);\n/,
      (m) => m + 'app.get("/api/version", (req, res) => {\n  try { return res.json(JSON.parse(fs.readFileSync(path.join(__dirname, "VERSION.json"), "utf8"))); }\n  catch (e) { return res.json({ currentVersion: APP_VERSION, project: "İzleKazan" }); }\n});\n'
    );
  }

  if (!s.includes('app.get("/api/public/leaderboards"')) {
    const marker = 'app.get("/api/admin/all", auth, adminOnly, (req, res) => {';
    if (!s.includes(marker)) throw new Error("/api/admin/all işaretçisi bulunamadı; liderlik endpointi eklenemedi.");
    s = s.replace(marker, leaderboardCode + "\n\n" + marker);
  }

  write("server.js", s);
}

function patchIndex() {
  if (!exists("index.html")) throw new Error("index.html bulunamadı.");
  backup("index.html");
  let h = read("index.html");

  if (/<meta name="app-version" content="[^"]*">/.test(h)) h = h.replace(/<meta name="app-version" content="[^"]*">/, `<meta name="app-version" content="${VERSION}">`);
  else h = h.replace(/<title>[\s\S]*?<\/title>/, (m) => `${m}\n  <meta name="app-version" content="${VERSION}">`);

  h = h.replace(/style\.css\?v=[^"]+/g, `style.css?v=${CACHE}`);
  h = h.replace(/app\.js\?v=[^"]+/g, `app.js?v=${CACHE}`);
  h = h.replace(/site-update\.js\?v=[^"]+/g, `site-update.js?v=${CACHE}`);
  h = h.replace(/<strong>v\d{4}\.\d{2}\.\d{2}-\d+<\/strong>/g, `<strong>${VERSION}</strong>`);

  write("index.html", h);
}

function patchVersionFiles() {
  backup("site-update.js");
  write("site-update.js", requireSource("site-update.js"));

  backup("VERSION.json");
  write("VERSION.json", requireSource("VERSION.json"));

  const entry = requireSource("SURUM-GECMISI-EK.md");
  if (exists("SURUM-GECMISI.md")) {
    backup("SURUM-GECMISI.md");
    let old = read("SURUM-GECMISI.md");
    if (!old.includes(VERSION)) {
      if (old.startsWith("#")) {
        const firstNewline = old.indexOf("\n");
        old = old.slice(0, firstNewline + 1) + "\n" + entry + old.slice(firstNewline + 1);
      } else {
        old = `# İzleKazan Sürüm Geçmişi\n\n${entry}${old}`;
      }
      write("SURUM-GECMISI.md", old);
    }
  } else {
    write("SURUM-GECMISI.md", `# İzleKazan Sürüm Geçmişi\n\n${entry}`);
  }
}

function main() {
  patchServer();
  patchIndex();
  patchVersionFiles();
  console.log(`Tamamlandı: ${VERSION} güncellemesi uygulandı.`);
  console.log("Oluşturulan/yenilenen dosyalar: server.js, index.html, site-update.js, VERSION.json, SURUM-GECMISI.md");
  console.log("Yedek dosyalar .bak-" + VERSION + " uzantısıyla bırakıldı.");
}

try { main(); } catch (err) { console.error("Güncelleme uygulanamadı:", err.message); process.exit(1); }
