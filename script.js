const CONFIG = {
  owner: "whittte169",
  links: [
    {
      name: "UUID Generator",
      description: "Generate UUIDs for your server, plugins and configs.",
      url: "https://whittte169.github.io/K3wty-UUID-generator/"
    },
    {
      name: "Image Encryptor",
      description: "Encrypt images before using them in your project.",
      url: "https://whittte169.github.io/K3wty-image-encrypter/"
    }
  ],
  cores: [
    { id: "PaperMC", color: "#ff4d6d" },
    { id: "PurpurMC", color: "#b45cff" },
    { id: "Nukkit-MOT", color: "#00f0ff" },
    { id: "EndstoneMC", color: "#f4f06a" },
    { id: "PumpkinMC", color: "#ff9a1f" }
  ],
  plugins: [
    {
      name: "K3wtyChatManager",
      repo: "K3wtyChatManager",
      tag: "plugin",
      version: "1.0.0",
      file: "ChatManagerSystem-{version}.jar",
      description: "Customizable chat with prefixes, colors and formatting.",
      cores: ["Nukkit-MOT"]
    },
    {
      name: "K3wtyEconomy",
      repo: "K3wtyEconomy",
      tag: "endstone",
      version: "1.0.0",
      file: "endstone_k3wty_economy-1.0.0-py2.py3-none-any.whl",
      description: "Economy with balances, a shop and player-to-player transfers.",
      cores: ["EndstoneMC"]
    }
  ]
};
const coresEl = document.getElementById("cores");
const gridEl = document.getElementById("plugins");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const searchEl = document.getElementById("search");
const termEl = document.getElementById("term");
const popularEl = document.getElementById("popular");
const colorOf = id => (CONFIG.cores.find(c => c.id === id) || {}).color || "#ff7a18";
const state = { core: null, query: "" };
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
const repoBase = p => `https://github.com/${p.owner || CONFIG.owner}/${p.repo}/releases`;
const fileOf = (p, core) => ((p.files && core && p.files[core]) || p.file).replaceAll("{version}", p.version);
const downloadUrl = (p, core) => `${repoBase(p)}/${p.tag}/`;
const releaseUrl = p => `${repoBase(p)}/tag/${p.tag}`;
const visible = () => CONFIG.plugins.filter(p =>
  (!state.core || p.cores.includes(state.core)) &&
  (p.name + " " + p.description).toLowerCase().includes(state.query)
).sort((a, b) => a.name.localeCompare(b.name));
const selectCore = id => {
  state.core = state.core === id ? null : id;
  renderCores();
  renderPlugins();
};
const renderCores = () => {
  coresEl.replaceChildren();
  const make = (id, label, count, color) => {
    const b = el("button", "core");
    b.type = "button";
    b.style.setProperty("--c", color);
    b.setAttribute("aria-pressed", String(state.core === id));
    b.append(el("i"), document.createTextNode(label), el("b", "", count));
    b.addEventListener("click", () => {
      state.core = id;
      renderCores();
      renderPlugins();
    });
    coresEl.append(b);
  };
  make(null, "All cores", CONFIG.plugins.length, "#ff7a18");
  CONFIG.cores.forEach(c => make(c.id, c.id, CONFIG.plugins.filter(p => p.cores.includes(c.id)).length, c.color));
};
const renderCard = p => {
  const main = state.core || p.cores[0];
  const card = el("article", "card");
  card.style.setProperty("--c", colorOf(main));
  const head = el("div", "head");
  let icon;
  if (p.icon) {
    icon = el("img", "icon");
    icon.src = p.icon;
    icon.alt = "";
  } else {
    icon = el("div", "icon", p.name[0].toUpperCase());
  }
  const titles = el("div");
  titles.append(el("h3", "", p.name), el("div", "ver", "v" + p.version));
  head.append(icon, titles);
  const tags = el("div", "tags");
  CONFIG.cores.filter(c => p.cores.includes(c.id)).forEach(c => {
    const t = el("span", "tag" + (c.id === state.core ? " on" : ""), "#" + c.id);
    t.style.setProperty("--c", c.color);
    tags.append(t);
  });
  const actions = el("div", "actions");
  const dl = el("a", "btn", "Download");
  dl.href = downloadUrl(p, state.core);
  dl.rel = "noopener";
  actions.append(dl);
  const rel = el("a", "btn alt", "Release");
  rel.href = releaseUrl(p);
  rel.target = "_blank";
  rel.rel = "noopener";
  actions.append(rel);
  card.append(head, el("p", "desc", p.description), tags, actions);
  return card;
};
const renderTerm = list => {
  termEl.replaceChildren();
  const line = (cls, text) => {
    termEl.append(el("span", cls, text), document.createTextNode("\n"));
  };
  line("d", "selected core: " + (state.core || "any"));
  if (!list.length) {
    line("p", "$ no plugins found");
    return;
  }
  const p = list[0];
  line("p", "$ curl -L -o " + fileOf(p, state.core) + " \\");
  line("", "    " + downloadUrl(p, state.core));
  line("ok", "✓ " + p.name + " " + ("v" + p.version) + " ready");
  line("d", "move the file into your server's plugins folder");
};
const renderPlugins = () => {
  const list = visible();
  gridEl.replaceChildren(...list.map(renderCard));
  emptyEl.hidden = list.length > 0;
  countEl.textContent = `${list.length} plugin${list.length === 1 ? "" : "s"} found`;
  renderTerm(list);
};
const renderStatic = () => {
  document.getElementById("stat-plugins").textContent = CONFIG.plugins.length;
  document.getElementById("stat-cores").textContent = CONFIG.cores.length;
  const items = [
    `<b>▶ LATEST:</b> ${CONFIG.plugins.length} plugins available`,
    `${CONFIG.cores.length} server cores supported`,
    "Direct downloads from GitHub Releases",
    "Open source"
  ];
  const track = document.getElementById("ticker");
  [0, 1, 2, 3].forEach(() => items.forEach(html => {
    const s = el("span");
    s.innerHTML = html;
    track.append(s);
  }));
  const ghUrl = "https://github.com/" + CONFIG.owner;
  document.getElementById("gh").href = ghUrl;
  document.getElementById("gh2").href = ghUrl;
  const toolLinks = document.getElementById("tool-links");
  const toolGrid = document.getElementById("utils");
  CONFIG.links.forEach(l => {
    const a = el("a", "tbtn", l.name);
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener";
    toolLinks.append(a);
    const card = el("article", "util");
    const open = el("a", "btn", "Open");
    open.href = l.url;
    open.target = "_blank";
    open.rel = "noopener";
    card.append(el("h3", "", l.name), el("p", "", l.description), open);
    toolGrid.append(card);
  });
  CONFIG.cores.forEach(c => {
    const b = el("button", "pop", "#" + c.id);
    b.type = "button";
    b.addEventListener("click", () => selectCore(c.id));
    popularEl.append(b);
  });
};
searchEl.addEventListener("input", () => {
  state.query = searchEl.value.trim().toLowerCase();
  renderPlugins();
});
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchEl.focus();
    searchEl.select();
  }
});
renderStatic();
renderCores();
renderPlugins();
