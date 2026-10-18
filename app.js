(function () {
  const G = window.GARDEN;
  const plants = G.plants;
  const fmt = n => "Rp " + Math.round(n).toLocaleString("id-ID");
  const plantCost = item => plants[item.plant].price * item.qty;
  const zoneCost = z => z.buy.reduce((s, i) => s + plantCost(i), 0);
  const totalCost = G.zones.reduce((s, z) => s + zoneCost(z), 0);
  const plantCount = G.zones.reduce((s, z) => s + z.buy.reduce((a, i) => a + i.qty, 0), 0);

  const shopping = {};
  G.zones.forEach(z => {
    z.buy.forEach(item => {
      if (!shopping[item.plant]) shopping[item.plant] = { plant: item.plant, qty: 0, zones: [] };
      shopping[item.plant].qty += item.qty;
      shopping[item.plant].zones.push("Z" + z.id);
    });
  });
  const shopList = Object.values(shopping).sort((a, b) => plants[b.plant].price * b.qty - plants[a.plant].price * a.qty);

  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  const compare = (before, after, label) => `
    <div class="compare" data-compare>
      <img src="assets/before/${before}" alt="Before ${label}">
      <img class="after" src="assets/after/${after}" alt="After ${label}">
      <div class="tag left">Now</div>
      <div class="tag right">After</div>
      <div class="handle"></div>
      <input type="range" min="0" max="100" value="50" aria-label="Before after slider">
    </div>`;

  const bindCompares = (root) => {
    root.querySelectorAll("[data-compare]").forEach(box => {
      const input = box.querySelector("input");
      const after = box.querySelector(".after");
      const handle = box.querySelector(".handle");
      const set = (v) => {
        after.style.clipPath = `inset(0 0 0 ${v}%)`;
        handle.style.left = v + "%";
      };
      set(50);
      input.addEventListener("input", () => set(input.value));
    });
  };

  const buyRows = (list) => list.map(item => {
    const p = plants[item.plant];
    return `<div class="buy-row">
      <img src="assets/plants/${p.photo}" alt="${p.name}">
      <div>
        <b>${item.qty} × ${p.name}</b>
        <div class="small">${p.latin} · ${p.idn}<br>${item.why}</div>
      </div>
      <div class="price">${fmt(plantCost(item))}</div>
    </div>`;
  }).join("");

  const zoneCard = (z) => `
    <article class="card" data-open-zone="${z.id}">
      <div class="zone-hero"><img src="assets/after/${z.photos[0].after}" alt="${z.name}"></div>
      <div class="body">
        <h3>${z.id}. ${z.name}</h3>
        <div class="meta">${z.size} · ${z.light}</div>
        <div class="chip-row">
          <span class="chip">${z.photos.length} views</span>
          <span class="chip">${z.buy.reduce((s,i)=>s+i.qty,0)} plants</span>
          <span class="chip">${fmt(zoneCost(z))}</span>
        </div>
        <p class="small">${z.goal}</p>
      </div>
    </article>`;

  const zonePage = (z) => {
    const first = z.photos[0];
    return `<a class="back" href="#zones">← All zones</a>
      <article class="card">
        ${compare(first.before, first.after, first.label)}
        <div class="photo-nav">${z.photos.map((p,i)=>`<button data-photo="${i}" class="${i===0?"active":""}">${p.label}</button>`).join("")}</div>
        <div class="body">
          <h2>${z.id}. ${z.name}</h2>
          <p>${z.goal}</p>
          <div class="chip-row">
            <span class="chip">${z.size}</span>
            <span class="chip">${z.light}</span>
            <span class="chip">${z.water}</span>
            <span class="chip">Seen from: ${z.seen}</span>
          </div>
          <dl class="layers">
            <dt>Tall</dt><dd>${z.layers.tall}</dd>
            <dt>Middle</dt><dd>${z.layers.mid}</dd>
            <dt>Low</dt><dd>${z.layers.low}</dd>
            <dt>Keep</dt><dd>${z.keep}</dd>
          </dl>
          ${z.drawing ? `<p class="small">Plan drawing</p><img src="assets/drawings/${z.drawing}" alt="Plan drawing for ${z.name}">` : ""}
          <h3>Buy for this zone · ${fmt(zoneCost(z))}</h3>
          ${buyRows(z.buy)}
        </div>
      </article>`;
  };

  const home = () => `
    <div class="grid zone-grid">${G.zones.map(zoneCard).join("")}</div>`;

  const plantsPage = () => `
    <p class="lede">Every plant used in the plan, with a photo. Quoted prices from TNT Household ServiceZ. Estimates are typical Bali nursery range — confirm before buying.</p>
    <div class="grid plant-grid">${Object.values(plants).map(p => `
      <article class="plant-card">
        <img src="assets/plants/${p.photo}" alt="${p.name}">
        <div class="body">
          <h3>${p.name}</h3>
          <div class="small">${p.latin}<br>${p.idn} · ${p.layer} · ${p.light}${p.flowers ? " · flowers" : ""}</div>
          <div class="price">${fmt(p.price)} <span class="small">${p.source}</span></div>
        </div>
      </article>`).join("")}</div>`;

  const shopPage = () => `
    <div class="totals">
      <div class="kicker">One shopping list</div>
      <h2>${fmt(totalCost)}</h2>
      <p class="small">${plantCount} plants across 9 zones. Soil, compost, planters, bin enclosure, wall bars and labour not included.</p>
    </div>
    <div class="note">${G.note}</div>
    <table>
      <thead><tr><th></th><th>Plant</th><th>Qty</th><th>Each</th><th>Total</th></tr></thead>
      <tbody>
        ${shopList.map(item => {
          const p = plants[item.plant];
          return `<tr>
            <td><img src="assets/plants/${p.photo}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px"></td>
            <td><b>${p.name}</b><div class="small">${p.latin}<br>Zones ${[...new Set(item.zones)].join(", ")}</div></td>
            <td>${item.qty}</td>
            <td>${fmt(p.price)}</td>
            <td class="price">${fmt(p.price * item.qty)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;

  const stats = document.getElementById("stats");
  stats.innerHTML = `
    <div class="stat"><b>9</b><span>zones</span></div>
    <div class="stat"><b>${plantCount}</b><span>plants to buy</span></div>
    <div class="stat"><b>${fmt(totalCost)}</b><span>plants only</span></div>`;

  const nav = document.getElementById("nav");
  const tabs = [
    ["zones", "Zones"],
    ["plants", "Plant photos"],
    ["shop", "Buy list"]
  ];
  nav.innerHTML = tabs.map(([id, label]) => `<button data-tab="${id}">${label}</button>`).join("");

  const app = document.getElementById("app");
  let currentTab = "zones";
  let currentZone = null;

  const render = () => {
    nav.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.tab === currentTab && !currentZone));
    if (currentTab === "plants") app.innerHTML = plantsPage();
    else if (currentTab === "shop") app.innerHTML = shopPage();
    else if (currentZone) {
      const z = G.zones.find(x => x.id === currentZone);
      app.innerHTML = zonePage(z);
      bindCompares(app);
      app.querySelectorAll("[data-photo]").forEach(btn => {
        btn.addEventListener("click", () => {
          const p = z.photos[Number(btn.dataset.photo)];
          const box = app.querySelector("[data-compare]");
          box.querySelector("img").src = "assets/before/" + p.before;
          box.querySelector(".after").src = "assets/after/" + p.after;
          app.querySelectorAll("[data-photo]").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    } else {
      app.innerHTML = home();
      app.querySelectorAll("[data-open-zone]").forEach(card => {
        card.addEventListener("click", () => {
          currentZone = Number(card.dataset.openZone);
          location.hash = "zone-" + currentZone;
          render();
          window.scrollTo(0, 0);
        });
      });
    }
  };

  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    currentTab = b.dataset.tab;
    currentZone = null;
    location.hash = currentTab;
    render();
  });

  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#", "");
    if (h.startsWith("zone-")) {
      currentTab = "zones";
      currentZone = Number(h.split("-")[1]);
    } else if (["zones", "plants", "shop"].includes(h)) {
      currentTab = h;
      currentZone = null;
    }
    render();
  });

  const start = location.hash.replace("#", "");
  if (start.startsWith("zone-")) currentZone = Number(start.split("-")[1]);
  else if (["plants", "shop"].includes(start)) currentTab = start;
  render();
})();
