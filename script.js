const ACCENTS = ["orange", "purple", "cyan", "green", "pink", "blue", "red"];
const CATS = ["plugin", "addon", "site", "app"];
const LANGS = { en: "EN", ru: "RU", zh: "中文" };
const HTML_LANG = { en: "en", ru: "ru", zh: "zh-CN" };
const ABS = /^[a-z][a-z0-9+.-]*:/i;
const $ = id => document.getElementById(id);
const root = document.documentElement;
const store = {
  get: k => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  }
};
const detectLang = () => {
  const saved = store.get("k3-lang");
  if (LANGS[saved]) return saved;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("ru") ? "ru" : nav.startsWith("zh") ? "zh" : "en";
};
const state = {
  lang: detectLang(),
  theme: root.dataset.theme,
  accent: root.dataset.accent,
  glow: root.dataset.glow,
  core: null,
  cat: "all",
  query: "",
  d: null,
  lb: null
};
CONFIG.projects.forEach(p => {
  p.id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  p.versions = p.versions || [];
});
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
const t = (key, vars) => {
  let s = I18N[state.lang][key] ?? I18N.en[key] ?? key;
  if (vars) Object.keys(vars).forEach(k => {
    s = s.replaceAll(`{${k}}`, vars[k]);
  });
  return s;
};
const loc = v => v && typeof v === "object" ? v[state.lang] || v.en || Object.values(v)[0] || "" : v || "";
const cat = p => p.category || "plugin";
const coreMeta = id => CONFIG.cores.find(c => c.id === id) || { id, color: "var(--accent)" };
const projCores = p => p.cores || [...new Set(p.versions.flatMap(v => Object.keys(v.cores || {})))];
const verCores = (p, v) => v.cores ? Object.keys(v.cores) : projCores(p);
const pickCore = (p, v, pref) => {
  const list = verCores(p, v);
  return list.includes(pref) ? pref : list[0];
};
const asset = (v, core) => {
  const a = { tag: v.tag, file: v.file, ...(v.cores && core ? v.cores[core] : null) };
  return a.tag && a.file ? a : null;
};
const repoBase = p => `https://github.com/${p.owner || CONFIG.owner}/${p.repo}`;
const fileName = (v, a) => a.file.replaceAll("{version}", v.version);
const dlUrl = (p, v, a) => `${repoBase(p)}/releases/download/${encodeURIComponent(a.tag)}/${encodeURIComponent(fileName(v, a))}`;
const relUrl = (p, a) => `${repoBase(p)}/releases/tag/${encodeURIComponent(a.tag)}`;
const info = p => {
  const v = p.versions[0];
  if (!v || !p.repo) return null;
  const core = pickCore(p, v, state.core);
  const a = asset(v, core);
  return a && { v, core, a, file: fileName(v, a), url: dlUrl(p, v, a) };
};
const statusBadge = s => s ? el("span", "badge " + s, t(s)) : null;
const imgUrl = (p, n) => /^(https?:)?\/\//.test(n) || n.startsWith("/") ? n : `images/${p.id}/${n}`;
const dec = s => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};
const logoCache = new Map();
const probeLogo = p => {
  if (!logoCache.has(p.id)) {
    logoCache.set(p.id, new Promise(resolve => {
      const list = p.logo === false ? [] : p.logo ? [imgUrl(p, p.logo)] : [`images/${p.id}/logo.png`, `images/${p.id}/logo.jpg`];
      const next = () => {
        const u = list.shift();
        if (!u) return resolve(null);
        const im = new Image();
        im.onload = () => resolve(u);
        im.onerror = next;
        im.src = u;
      };
      next();
    }));
  }
  return logoCache.get(p.id);
};
const makeIcon = p => {
  const box = el("div", "icon", Array.from(p.name)[0].toUpperCase());
  probeLogo(p).then(u => {
    if (!u) return;
    const im = el("img");
    im.src = u;
    im.alt = "";
    box.textContent = "";
    box.classList.add("has-img");
    box.append(im);
  });
  return box;
};
const applySettings = () => {
  root.dataset.theme = state.theme;
  root.dataset.accent = state.accent;
  root.dataset.glow = state.glow;
  store.set("k3-theme", state.theme);
  store.set("k3-accent", state.accent);
  store.set("k3-glow", state.glow);
  $("glow-on").checked = state.glow === "on";
  document.querySelectorAll(".sw").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.accent === state.accent)));
};
const applyI18n = () => {
  root.lang = HTML_LANG[state.lang];
  document.title = t("title");
  $("meta-desc").content = t("metaDesc");
  document.querySelectorAll("[data-i18n]").forEach(n => {
    n.textContent = t(n.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(n => {
    n.placeholder = t(n.dataset.i18nPh);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(n => {
    const s = t(n.dataset.i18nTitle);
    n.title = s;
    n.setAttribute("aria-label", s);
  });
  document.querySelectorAll(".sw").forEach(b => {
    b.title = t("c_" + b.dataset.accent);
    b.setAttribute("aria-label", b.title);
  });
  document.querySelectorAll("#langs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
};
const matches = p => (!state.core || projCores(p).includes(state.core)) &&
  `${p.name} ${p.id} ${loc(p.description)} ${t("one_" + cat(p))}`.toLowerCase().includes(state.query);
const visible = () => CONFIG.projects
  .filter(p => matches(p) && (state.cat === "all" || cat(p) === state.cat))
  .sort((a, b) => a.name.localeCompare(b.name));
const selectCore = id => {
  state.core = id;
  renderCores();
  renderProjects();
};
const renderCores = () => {
  const box = $("cores");
  box.replaceChildren();
  const make = (id, label, count, c) => {
    const b = el("button", "core" + (c && c.status === "unsupported" ? " unsupported" : ""));
    b.type = "button";
    b.style.setProperty("--c", c ? c.color : "var(--accent)");
    b.setAttribute("aria-pressed", String(state.core === id));
    b.append(el("i"), document.createTextNode(label), el("b", "", count));
    if (c && c.status) b.append(statusBadge(c.status));
    b.addEventListener("click", () => selectCore(id));
    box.append(b);
  };
  make(null, t("allCores"), CONFIG.projects.length);
  CONFIG.cores.forEach(c => make(c.id, c.id, CONFIG.projects.filter(p => projCores(p).includes(c.id)).length, c));
};
const renderTabs = () => {
  const box = $("tabs");
  box.replaceChildren();
  const base = CONFIG.projects.filter(matches);
  ["all", ...CATS].forEach(c => {
    const b = el("button", "tab");
    b.type = "button";
    b.setAttribute("aria-pressed", String(state.cat === c));
    b.append(document.createTextNode(t("cat_" + c)), el("b", "", c === "all" ? base.length : base.filter(p => cat(p) === c).length));
    b.addEventListener("click", () => {
      state.cat = c;
      renderProjects();
    });
    box.append(b);
  });
};
const renderCard = p => {
  const v = p.versions[0];
  const inf = info(p);
  const st = p.status || (v && v.status);
  const card = el("article", "card" + (st === "unsupported" ? " unsupported" : ""));
  card.tabIndex = 0;
  card.style.setProperty("--c", coreMeta(inf ? inf.core : state.core || projCores(p)[0]).color);
  const head = el("div", "head");
  const titles = el("div");
  const sub = el("div", "sub");
  if (v) sub.append(document.createTextNode("v" + v.version));
  sub.append(el("span", "", (v ? "· " : "") + t("one_" + cat(p))));
  if (st) sub.append(statusBadge(st));
  titles.append(el("h3", "", p.name), sub);
  head.append(makeIcon(p), titles);
  const tags = el("div", "tags");
  projCores(p).forEach(id => {
    const c = coreMeta(id);
    const tag = el("span", "tag" + (id === state.core ? " on" : "") + (c.status ? " " + c.status : ""), "#" + id);
    tag.style.setProperty("--c", c.color);
    if (c.status) tag.title = t(c.status);
    tags.append(tag);
  });
  const actions = el("div", "actions");
  if (p.url) {
    const a = el("a", "btn", t("open"));
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener";
    actions.append(a);
  } else if (inf) {
    const a = el("a", "btn" + (st === "unsupported" ? " danger" : ""), t("download"));
    a.href = inf.url;
    a.setAttribute("download", inf.file);
    a.rel = "noopener";
    actions.append(a);
  }
  const more = el("button", "btn alt", t("details"));
  more.type = "button";
  actions.append(more);
  card.append(head, el("p", "desc", loc(p.description)), tags, actions);
  card.addEventListener("click", e => {
    if (!e.target.closest("a")) openProject(p.id);
  });
  card.addEventListener("keydown", e => {
    if (e.target === card && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openProject(p.id);
    }
  });
  return card;
};
const renderTerm = list => {
  const term = $("term");
  term.replaceChildren();
  const line = (cls, text) => term.append(el("span", cls, text), document.createTextNode("\n"));
  line("d", t("termCore", { v: state.core || t("termAny") }));
  const p = list.find(info);
  if (!p) {
    line("p", t("termNone"));
    return;
  }
  const i = info(p);
  line("p", "$ curl -L -o " + i.file + " \\");
  line("", "    " + i.url);
  line("ok", "✓ " + p.name + " v" + i.v.version + " " + t("termReady"));
  line("d", t("termMove"));
};
const renderProjects = () => {
  const list = visible();
  $("projects").replaceChildren(...list.map(renderCard));
  $("empty").hidden = list.length > 0;
  $("count").textContent = t("found", { n: list.length });
  renderTabs();
  renderTerm(list);
};
const renderTicker = () => {
  const items = [t("tkProjects", { n: CONFIG.projects.length }), t("tkCores", { n: CONFIG.cores.length }), t("tkDirect"), t("tkOpen")];
  const track = $("ticker");
  track.replaceChildren();
  for (let k = 0; k < 4; k++) items.forEach((txt, i) => {
    const s = el("span");
    if (i === 0) s.append(el("b", "", t("tkLatest") + " "));
    s.append(txt);
    track.append(s);
  });
};
const readmeCandidates = p => {
  const r = p.readme;
  if (r === false || (!r && !p.repo)) return [];
  const list = r && typeof r === "object" ? [r[state.lang], r.en, Object.values(r)[0]] : [r];
  list.push("README.md");
  return [...new Set(list.filter(Boolean))].filter(x => /^https?:/.test(x) || p.repo);
};
const rawUrl = (p, path) => /^https?:/.test(path) ? path : `https://raw.githubusercontent.com/${p.owner || CONFIG.owner}/${p.repo}/${p.branch || "HEAD"}/${path.replace(/^\//, "")}`;
const textCache = new Map();
const getText = async url => {
  if (!textCache.has(url)) {
    try {
      const r = await fetch(url);
      textCache.set(url, r.ok ? await r.text() : null);
    } catch {
      textCache.set(url, null);
    }
  }
  return textCache.get(url);
};
const fetchReadme = async p => {
  for (const path of readmeCandidates(p)) {
    const url = rawUrl(p, path);
    const text = await getText(url);
    if (text !== null) return { url, text };
  }
  return null;
};
const decorateCode = box => {
  box.querySelectorAll("pre > code").forEach(code => {
    const pre = code.parentElement;
    const lang = ((code.className.match(/language-([\w+#.-]+)/) || [])[1] || "").toLowerCase();
    code.classList.add("hljs");
    if (window.hljs && lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
    const wrap = el("div", "code");
    const bar = el("div", "code-bar");
    const dots = el("span", "dots");
    dots.append(el("i"), el("i"), el("i"));
    const btn = el("button", "copy", t("copy"));
    btn.type = "button";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        btn.textContent = t("copied");
        setTimeout(() => {
          btn.textContent = t("copy");
        }, 1500);
      } catch {}
    });
    bar.append(dots, el("span", "lang", lang || "text"), btn);
    pre.replaceWith(wrap);
    wrap.append(bar, pre);
  });
};
const renderMd = (text, url) => {
  const box = el("div", "md");
  if (!window.marked || !window.DOMPurify) {
    box.append(el("pre", "", text));
    return box;
  }
  box.innerHTML = DOMPurify.sanitize(marked.parse(text, { gfm: true, async: false }), { FORBID_TAGS: ["style", "form"], FORBID_ATTR: ["style"] });
  const raw = new URL(".", url).href;
  const blob = raw.replace(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\//, "https://github.com/$1/$2/blob/");
  const seen = new Map();
  box.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(h => {
    const s = h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    const n = seen.get(s) || 0;
    seen.set(s, n + 1);
    h.id = n ? `${s}-${n}` : s;
  });
  box.querySelectorAll("a[href]").forEach(a => {
    const h = a.getAttribute("href");
    if (h.startsWith("#")) {
      a.dataset.anchor = dec(h.slice(1));
      return;
    }
    if (!ABS.test(h) && !h.startsWith("//")) a.href = new URL(h, blob).href;
    if (/^https?:/i.test(a.getAttribute("href"))) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });
  const imgs = [...box.querySelectorAll("img")];
  imgs.forEach((im, i) => {
    const s = im.getAttribute("src");
    if (s && !ABS.test(s) && !s.startsWith("//")) im.src = new URL(s, raw).href;
    im.loading = "lazy";
    if (!im.closest("a")) im.addEventListener("click", () => {
      if (im.naturalWidth >= 200) openLb(imgs.map(x => x.src), i);
    });
  });
  box.querySelectorAll("table").forEach(tb => {
    const w = el("div", "tbl");
    tb.replaceWith(w);
    w.append(tb);
  });
  decorateCode(box);
  box.addEventListener("click", e => {
    const a = e.target.closest("a[data-anchor]");
    if (!a) return;
    e.preventDefault();
    const target = box.querySelector("#" + CSS.escape(a.dataset.anchor));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return box;
};
const buildReadme = p => {
  if (!readmeCandidates(p).length) return null;
  const box = el("section", "readme");
  const head = el("div", "readme-head", "");
  head.append(el("span", "", "README.md"));
  if (p.repo) {
    const a = el("a", "", t("openGithub") + " ↗");
    a.href = repoBase(p);
    a.target = "_blank";
    a.rel = "noopener";
    head.append(a);
  }
  const body = el("div", "readme-state", t("readmeLoading"));
  box.append(head, body);
  fetchReadme(p).then(res => {
    if (!box.isConnected || !state.d || state.d.p !== p) return;
    body.replaceWith(res ? renderMd(res.text, res.url) : el("div", "readme-state", t("readmeError")));
  });
  return box;
};
const buildGallery = p => {
  const names = p.images || [];
  if (!names.length) return null;
  const box = el("div", "shots");
  names.forEach((n, i) => {
    const im = el("img");
    im.loading = "lazy";
    im.alt = `${p.name} ${i + 1}`;
    im.src = imgUrl(p, n);
    im.addEventListener("error", () => {
      im.remove();
      if (!box.children.length) box.remove();
    });
    im.addEventListener("click", () => {
      const all = [...box.children];
      openLb(all.map(x => x.src), all.indexOf(im));
    });
    box.append(im);
  });
  return box;
};
const renderSide = focusKey => {
  const d = state.d;
  const p = d.p;
  const v = p.versions[d.vi];
  const parts = [];
  const main = el("section", "panel");
  const core = v ? pickCore(p, v, d.core) : null;
  d.core = core;
  const cm = coreMeta(core);
  main.style.setProperty("--c", cm.color);
  main.append(el("h4", "", t("download")));
  if (v) {
    const cores = verCores(p, v);
    const a = asset(v, core);
    if (cores.length) {
      const f = el("div", "field");
      const chips = el("div", "chips");
      cores.forEach(id => {
        const c = coreMeta(id);
        const b = el("button", "chip", id);
        b.type = "button";
        b.dataset.k = "c:" + id;
        b.style.setProperty("--c", c.color);
        b.setAttribute("aria-pressed", String(id === core));
        b.prepend(el("i"));
        if (c.status) b.append(statusBadge(c.status));
        b.addEventListener("click", () => {
          d.core = id;
          renderSide("c:" + id);
        });
        chips.append(b);
      });
      f.append(el("span", "", t("core")), chips);
      main.append(f);
    }
    const kv = el("dl", "kv");
    kv.append(el("dt", "", t("version")), el("dd", "", "v" + v.version));
    if (a) kv.append(el("dt", "", t("tag")), el("dd", "", a.tag), el("dt", "", t("file")), el("dd", "", fileName(v, a)));
    main.append(kv);
    const statuses = [["project", p.status], ["version", v.status], ["core", cm.status]].filter(x => x[1]);
    statuses.forEach(([scope, s]) => {
      const w = el("div", "warn " + s);
      w.append(el("b", "", t("scope_" + scope) + ": " + t(s)), document.createTextNode(" — " + t("hint_" + s)));
      main.append(w);
    });
    const acts = el("div", "side-actions");
    if (a && p.repo) {
      const dl = el("a", "btn" + (statuses.some(x => x[1] === "unsupported") ? " danger" : ""), t("download"));
      dl.href = dlUrl(p, v, a);
      dl.setAttribute("download", fileName(v, a));
      dl.rel = "noopener";
      const rel = el("a", "btn alt", t("release"));
      rel.href = relUrl(p, a);
      rel.target = "_blank";
      rel.rel = "noopener";
      acts.append(dl, rel);
    } else {
      main.append(el("div", "warn", t("noFile")));
    }
    main.append(acts);
  }
  if (p.url) {
    const open = el("a", "btn", t("open"));
    open.href = p.url;
    open.target = "_blank";
    open.rel = "noopener";
    const acts = el("div", "side-actions");
    acts.append(open);
    main.append(acts);
  }
  if (v || p.url) parts.push(main);
  if (p.versions.length) {
    const panel = el("section", "panel");
    const list = el("div", "vlist");
    panel.append(el("h4", "", t("versions")));
    p.versions.forEach((x, i) => {
      const b = el("button", "vrow", "v" + x.version);
      b.type = "button";
      b.dataset.k = "v" + i;
      b.setAttribute("aria-pressed", String(i === d.vi));
      if (x.status) b.append(statusBadge(x.status));
      if (i === 0) b.append(el("em", "", t("latest")));
      b.addEventListener("click", () => {
        d.vi = i;
        renderSide("v" + i);
      });
      list.append(b);
    });
    panel.append(list);
    parts.push(panel);
  }
  if (p.repo || p.url) {
    const panel = el("section", "panel");
    const links = el("div", "plinks");
    const add = (label, href) => {
      const a = el("a", "", label + " ↗");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      links.append(a);
    };
    if (p.repo) {
      add(t("repository"), repoBase(p));
      add(t("releases"), repoBase(p) + "/releases");
    }
    if (p.url) add(t("website"), p.url);
    panel.append(el("h4", "", t("links")), links);
    parts.push(panel);
  }
  d.side.replaceChildren(...parts);
  if (focusKey) {
    const f = [...d.side.querySelectorAll("[data-k]")].find(n => n.dataset.k === focusKey);
    if (f) f.focus();
  }
};
const buildDetail = () => {
  const d = state.d;
  const p = d.p;
  const wrap = el("div", "d-wrap");
  const back = el("button", "back", "← " + t("back"));
  back.type = "button";
  back.addEventListener("click", closeDetail);
  const head = el("div", "d-head");
  const icon = makeIcon(p);
  icon.classList.add("lg");
  const titles = el("div");
  const h = el("h1", "", p.name);
  h.id = "d-title";
  const meta = el("div", "meta");
  meta.append(el("span", "", t("one_" + cat(p))), el("span", "", "· ID: " + p.id));
  if (p.status) meta.append(statusBadge(p.status));
  titles.append(h, meta);
  head.append(icon, titles);
  const grid = el("div", "d-grid");
  const main = el("div", "d-main");
  main.append(...[buildGallery(p), buildReadme(p)].filter(Boolean));
  d.side = el("aside", "d-side");
  grid.append(main, d.side);
  wrap.append(back, head, el("p", "d-desc", loc(p.description)), grid);
  $("d-body").replaceChildren(wrap);
  renderSide();
};
const showDetail = p => {
  const fresh = !state.d || state.d.p !== p;
  if (fresh) state.d = { p, vi: 0, core: p.versions[0] ? pickCore(p, p.versions[0], state.core) : null, side: null };
  document.body.classList.add("lock");
  $("detail").hidden = false;
  if (fresh) $("detail").scrollTop = 0;
  buildDetail();
};
const hideDetail = () => {
  state.d = null;
  $("detail").hidden = true;
  document.body.classList.remove("lock");
  closeLb();
};
const route = () => {
  const m = location.hash.match(/^#project\/(.+)$/);
  const p = m && CONFIG.projects.find(x => x.id === dec(m[1]));
  if (p) showDetail(p);
  else if (state.d) hideDetail();
};
const openProject = id => {
  location.hash = "project/" + encodeURIComponent(id);
};
const closeDetail = () => {
  if (location.hash.startsWith("#project/")) history.pushState(null, "", location.pathname + location.search);
  route();
};
const lbShow = () => {
  $("lb-img").src = state.lb.list[state.lb.i];
  $("lb-prev").hidden = $("lb-next").hidden = state.lb.list.length < 2;
};
const openLb = (list, i) => {
  state.lb = { list, i };
  lbShow();
  $("lightbox").hidden = false;
};
const closeLb = () => {
  state.lb = null;
  $("lightbox").hidden = true;
};
const stepLb = delta => {
  const n = state.lb.list.length;
  state.lb.i = (state.lb.i + delta + n) % n;
  lbShow();
};
const setLang = l => {
  state.lang = l;
  store.set("k3-lang", l);
  applyI18n();
  renderCores();
  renderProjects();
  renderTicker();
  if (state.d) buildDetail();
};
const setMenu = open => {
  $("glow-menu").hidden = !open;
  $("glow-btn").setAttribute("aria-expanded", String(open));
};
const init = () => {
  $("stat-projects").textContent = CONFIG.projects.length;
  $("stat-cores").textContent = CONFIG.cores.length;
  const ghUrl = "https://github.com/" + CONFIG.owner;
  $("gh").href = ghUrl;
  $("gh2").href = ghUrl;
  const toolLinks = $("tool-links");
  CONFIG.projects.filter(p => cat(p) === "site" && p.url).forEach(p => {
    const a = el("a", "tbtn", p.name);
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener";
    toolLinks.append(a);
  });
  CONFIG.cores.forEach(c => {
    const b = el("button", "pop", "#" + c.id);
    b.type = "button";
    b.addEventListener("click", () => selectCore(state.core === c.id ? null : c.id));
    $("popular").append(b);
  });
  Object.keys(LANGS).forEach(l => {
    const b = el("button", "", LANGS[l]);
    b.type = "button";
    b.dataset.lang = l;
    b.addEventListener("click", () => setLang(l));
    $("langs").append(b);
  });
  ACCENTS.forEach(k => {
    const b = el("button", "sw");
    b.type = "button";
    b.dataset.accent = k;
    b.addEventListener("click", () => {
      state.accent = k;
      applySettings();
    });
    $("swatches").append(b);
  });
  $("theme-btn").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applySettings();
  });
  $("glow-on").addEventListener("change", e => {
    state.glow = e.target.checked ? "on" : "off";
    applySettings();
  });
  $("glow-btn").addEventListener("click", e => {
    e.stopPropagation();
    setMenu($("glow-menu").hidden);
  });
  $("glow-menu").addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => setMenu(false));
  $("lb-close").addEventListener("click", closeLb);
  $("lb-prev").addEventListener("click", () => stepLb(-1));
  $("lb-next").addEventListener("click", () => stepLb(1));
  $("lightbox").addEventListener("click", e => {
    if (e.target === $("lightbox")) closeLb();
  });
  $("search").addEventListener("input", e => {
    state.query = e.target.value.trim().toLowerCase();
    renderProjects();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (state.lb) closeLb();
      else if (!$("glow-menu").hidden) setMenu(false);
      else if (state.d) closeDetail();
    } else if (state.lb && e.key === "ArrowLeft") {
      stepLb(-1);
    } else if (state.lb && e.key === "ArrowRight") {
      stepLb(1);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (state.d) closeDetail();
      $("search").focus();
      $("search").select();
    }
  });
  window.addEventListener("hashchange", route);
  applySettings();
  applyI18n();
  renderCores();
  renderProjects();
  renderTicker();
  route();
};
init();
