// Zadání vyhledávání: čte a ukládá zadani.json v repozitáři přes GitHub API (token v GITHUB_TOKEN na Vercelu, oprávnění Contents: Read and write)
const REPO = "Projektmap/luborreality", PATH = "zadani.json";
const NUM = ["plochaMin", "plochaMax", "cenaMax", "minSleva", "maxKmOdMesta", "minObyvatelMesta"];
const KRAJE = ["Pardubický", "Královéhradecký"];
function clean(z) {
  const out = {};
  for (const k of ["pozemky", "domy", "byty"]) {
    const s = (z && z[k]) || {};
    const o = { aktivni: !!s.aktivni, kraje: (Array.isArray(s.kraje) ? s.kraje : []).filter(x => KRAJE.includes(x)) };
    for (const n of NUM) o[n] = Math.max(0, Math.min(1e9, Number(s[n]) || 0));
    if (k === "pozemky") o.jenStavebni = !!s.jenStavebni;
    o.bonusy = (Array.isArray(s.bonusy) ? s.bonusy : []).map(String).filter(x => /^[a-z_]{2,20}$/.test(x)).slice(0, 10);
    for (const t of ["hledat", "vyloucit", "poznamka"]) o[t] = String(s[t] || "").slice(0, 1500);
    out[k] = o;
  }
  return out;
}
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const token = process.env.GITHUB_TOKEN, code = process.env.ZADANI_KOD || "";
  if (!token) return res.status(503).json({ error: "not_configured", requiresCode: !!code });
  const gh = (p, o = {}) => fetch(`https://api.github.com/repos/${REPO}${p}`, { ...o, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "luborreality", "Content-Type": "application/json" } });
  try {
    const cur = await gh(`/contents/${PATH}?ref=main`);
    if (!cur.ok) return res.status(502).json({ error: "github" });
    const cj = await cur.json();
    if (req.method === "GET") {
      return res.status(200).json({ zadani: JSON.parse(Buffer.from(cj.content, "base64").toString("utf8")), requiresCode: !!code });
    }
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      if (code && b.kod !== code) return res.status(403).json({ error: "bad_code" });
      const upraveno = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" });
      const data = { upraveno, ...clean(b.zadani) };
      const r = await gh(`/contents/${PATH}`, { method: "PUT", body: JSON.stringify({ message: `Zadání upraveno ${upraveno}`, content: Buffer.from(JSON.stringify(data, null, 1) + "\n").toString("base64"), sha: cj.sha, branch: "main" }) });
      if (!r.ok) return res.status(502).json({ error: "github" });
      return res.status(200).json({ ok: true, upraveno });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method" });
  } catch (e) { return res.status(500).json({ error: "server" }); }
};
