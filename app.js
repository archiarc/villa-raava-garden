(function () {
  const G = window.GARDEN;
  const plants = G.plants;
  const fmt = n => n == null ? "RFQ" : "Rp " + Math.round(n).toLocaleString("id-ID");
  const sum = xs => xs.reduce((a, b) => a + b, 0);
  const unique = xs => [...new Set(xs)];

  const itemRange = item => {
    const p = plants[item.plant];
    return {
      min: p.priceMin == null ? null : p.priceMin * item.qty,
      max: p.priceMax == null ? null : p.priceMax * item.qty
    };
  };
  const rangeFor = list => {
    const ranges = list.map(itemRange);
    return {
      min: sum(ranges.filter(r => r.min != null).map(r => r.min)),
      max: sum(ranges.filter(r => r.max != null).map(r => r.max)),
      unknown: list.filter(i => plants[i.plant].priceMin == null).reduce((a, i) => a + i.qty, 0)
    };
  };
  const rangeText = r => `${fmt(r.min)}–${fmt(r.max)}${r.unknown ? ` + ${r.unknown} plants pending RFQ` : ""}`;
  const allSpecs = G.zones.flatMap(z => z.buy);
  const fixedBuy = allSpecs.filter(i => i.qty > 0);
  const plantCount = G.zones.reduce((s, z) => s + sum(z.buy.map(i => i.qty || 0)), 0);
  const totalRange = rangeFor(fixedBuy);

  const shopping = {};
  G.zones.forEach(z => z.buy.filter(item => item.qty > 0).forEach(item => {
    if (!shopping[item.plant]) shopping[item.plant] = { plant: item.plant, qty: 0, zones: [], bases: [] };
    shopping[item.plant].qty += item.qty;
    shopping[item.plant].zones.push(`Z${z.id}`);
    shopping[item.plant].bases.push(item.basis);
  }));
  const shopList = Object.values(shopping).sort((a, b) => {
    const ap = plants[a.plant], bp = plants[b.plant];
    return ((bp.priceMax || 0) * b.qty) - ((ap.priceMax || 0) * a.qty);
  });

  const sourceShot = (before, label) => `
    <figure class="shot source-shot">
      <img src="assets/before/${before}" alt="Source photograph: ${label}">
      <figcaption>${label} · source-condition evidence</figcaption>
    </figure>`;

  const comparison = (p, z) => `<figure class="visual-card">
    <div class="compare" data-compare>
      <img class="before" src="assets/before/${p.before}" alt="Zone ${z.id} ${p.label} before landscaping">
      <img class="after" src="assets/after/${p.after}" alt="Zone ${z.id} ${p.label} landscape design visualisation">
      <span class="tag left">Before</span><span class="tag right">Visualisation</span>
      <span class="handle" aria-hidden="true"></span>
      <input type="range" min="0" max="100" value="50" aria-label="Drag to compare before and visualisation for ${p.label}">
    </div>
    <figcaption><b>${p.label}</b><span>Drag the slider to compare</span></figcaption>
  </figure>`;

  const bindCompares = root => root.querySelectorAll("[data-compare]").forEach(box => {
    const range=box.querySelector("input"), after=box.querySelector(".after"), handle=box.querySelector(".handle");
    const update=()=>{const v=range.value;after.style.clipPath=`inset(0 0 0 ${v}%)`;handle.style.left=`${v}%`;};
    range.addEventListener("input",update); update();
  });

  const priceLabel = p => p.priceMin == null ? "Price required" : p.priceMin === p.priceMax ? fmt(p.priceMin) : `${fmt(p.priceMin)}–${fmt(p.priceMax)}`;
  const statusClass = p => p.priceMin == null ? "risk" : p.priceStatus.includes("quoted") ? "ok" : "warn";

  const buyRows = list => list.map(item => {
    const p = plants[item.plant], r = itemRange(item), formulaOnly = !item.qty;
    return `<div class="buy-row procurement-row">
      <img src="assets/plants/${p.photo}" alt="${p.name}">
      <div>
        <b>${formulaOnly ? "Measure ×" : `${item.qty} ×`} ${p.name}</b>
        <div class="small"><i>${p.latin}</i> · ${p.idn}</div>
        <div class="detail-line"><b>${item.station}</b> · ${item.basis}</div>
        ${formulaOnly ? `<div class="formula">${item.formula}</div>` : ""}
        <div class="small">Supply: ${p.supplySpec}<br>Availability: ${p.availability}</div>
      </div>
      <div class="price">${formulaOnly ? `<span class="status risk">Not released</span>Measure first` : `<span class="status ${statusClass(p)}">${p.priceStatus}</span>${r.min == null ? "RFQ" : r.min === r.max ? fmt(r.min) : `${fmt(r.min)}–${fmt(r.max)}`}`}</div>
    </div>`;
  }).join("");

  const mixChips = z => (z.mix || []).map(id => {
    const p = plants[id];
    return p ? `<span class="mix-chip"><img src="assets/plants/${p.photo}" alt="">${p.name}</span>` : "";
  }).join("");

  const wallMap = z => `<ol class="wall-map">
    <p class="wall-axis">${z.map.axis}</p>
    ${z.map.stations.map(s => `<li><b>${s.n}</b><div><span>${s.at}</span><p>${s.plants}</p></div></li>`).join("")}
  </ol>`;

  const zoneShowcase = z => `<section class="showcase" aria-labelledby="zone-title-${z.id}">
    <header class="showcase-head">
      <div><div class="kicker">Zone ${z.id} of 9</div><h2 id="zone-title-${z.id}">${z.name}</h2><p>${z.goal}</p></div>
      <button class="details-button" data-open-zone="${z.id}">Planting plan →</button>
    </header>
    <div class="visual-grid">${z.photos.map(p=>comparison(p,z)).join("")}</div>
  </section>`;

  const zonePage = z => {
    const fixed = z.buy.filter(i => i.qty > 0), count = sum(fixed.map(i => i.qty)), r = rangeFor(fixed), formulaOnly = z.buy.some(i => !i.qty);
    return `<a class="back" href="#zones">← All zones</a>
      <article class="zone-page">
        <header class="zone-head">
          <div class="kicker">Zone ${z.id} of 9</div><h2>${z.name}</h2><p>${z.goal}</p>
          <div class="chip-row"><span class="chip">${z.size}</span><span class="chip">${z.light}</span><span class="chip">${z.water}</span><span class="chip">Seen from: ${z.seen}</span>${formulaOnly ? '<span class="chip status risk">Measure-to-release · no fixed order</span>' : ''}</div>
        </header>
        <section class="plan-card">
          <div class="kicker">Authoritative planting map</div>
          <p class="wall-line">${z.wall}</p><p>${z.plan}</p>${wallMap(z)}
          <div class="confidence"><b>Evidence confidence</b><br>${z.confidence}</div>
          <dl class="layers"><dt>Tall order</dt><dd>${z.layers.tall}</dd><dt>Middle order</dt><dd>${z.layers.mid}</dd><dt>Low order</dt><dd>${z.layers.low}</dd><dt>Retain / reuse</dt><dd>${z.keep}</dd></dl>
          <div class="mix-row">${mixChips(z)}</div>
        </section>
        <section class="control-card"><h3>Before the contractor orders</h3><ul>${z.holdPoints.map(x => `<li>${x}</li>`).join("")}</ul><h3>Maintenance intent</h3><p>${z.maintenance}</p></section>
        <section class="buy-card"><h3>${formulaOnly && !count ? "Measure-to-release schedule" : `Zone order · ${count} plants`}</h3><p class="small">${formulaOnly && !count ? "No purchase quantity or budget is released until the listed field measurements are returned." : `Plant-only allowance: ${rangeText(r)}. Existing retained plants are excluded. Supplied grade must match each row.`}</p>${buyRows(z.buy)}</section>
        <section class="shots"><div class="visual-note"><b>Design visualisations are on the front page.</b> They communicate the intended atmosphere; this source photography, station map and schedule control species, quantity, supplied size and placement.</div>${z.photos.map(p=>sourceShot(p.before,p.label)).join("")}</section>
      </article>`;
  };

  const home = () => G.zones.map(zoneShowcase).join("");

  const plantsPage = () => {
    const used = unique(allSpecs.map(x => x.plant));
    return `<section class="release-card"><div class="kicker">Plant evidence</div><h2>${used.length} specified supply grades</h2><p>Photos identify the intended plant, not the delivered grade. The nursery must quote and supply the botanical name, stated size and habit shown in each specification.</p></section>
    <div class="grid plant-grid">${used.map(id => {
      const p=plants[id];
      return `<article class="plant-card"><img src="assets/plants/${p.photo}" alt="${p.name}"><div class="body"><h3>${p.name}</h3><div class="small"><i>${p.latin}</i><br>${p.idn} · ${p.layer} · ${p.light}</div><p class="small"><b>Supply:</b> ${p.supplySpec}<br><b>Spacing:</b> ${p.spacing}<br><b>Mature:</b> ${p.mature}<br><b>Availability:</b> ${p.availability}</p><div class="price">${priceLabel(p)} <span class="status ${statusClass(p)}">${p.priceStatus}</span></div></div></article>`;
    }).join("")}</div>`;
  };

  const shopPage = () => `
    <section class="totals"><div class="kicker">Consolidated procurement schedule</div><h2>${plantCount} plants</h2><p class="budget">${rangeText(totalRange)}</p><p class="small">Fixed plant-only allowance for Zones 1–7 and 9. Zone 8 is excluded until measured. Unknown-price supplier items are excluded from the rupiah range until quoted.</p><div class="download-row"><a class="download" href="procurement.csv" download>Download CSV</a><a class="download secondary" href="INSTALLATION-SPEC.md" download>Installation specification</a></div></section>
    <div class="note">${G.note}</div>
    <p class="table-cue" id="procurement-scroll-hint">Swipe table sideways to compare every column →</p>
    <div class="table-wrap" role="region" tabindex="0" aria-label="Consolidated procurement schedule" aria-describedby="procurement-scroll-hint"><table><thead><tr><th>Plant</th><th>Qty</th><th>Zones</th><th>Supply / spacing</th><th>Unit allowance</th><th>Total allowance</th></tr></thead><tbody>
      ${shopList.map(item => { const p=plants[item.plant], r=itemRange(item); return `<tr><td><b>${p.name}</b><div class="small"><i>${p.latin}</i><br>${p.availability}</div></td><td>${item.qty}</td><td>${unique(item.zones).join(", ")}</td><td><div class="small">${p.supplySpec}<br>${p.spacing}</div></td><td>${priceLabel(p)}<br><span class="status ${statusClass(p)}">${p.priceStatus}</span></td><td class="price">${r.min==null?"RFQ":r.min===r.max?fmt(r.min):`${fmt(r.min)}–${fmt(r.max)}`}</td></tr>`; }).join("")}
    </tbody></table></div>
    <section class="control-card"><div class="kicker">Zone 8 · not released</div><h3>Field-measure formulas</h3>${buyRows(G.zones.find(z=>z.id===8).buy)}</section>
    <section class="control-card"><h3>RFQ award rules</h3><ol><li>Nursery returns botanical name, current stock, supplied height/spread, pot/polybag size, unit price and a current batch photo for every row.</li><li>Contractor verifies every zone hold point and field dimension before award; any changed quantity must retain the spacing formula and map station.</li><li>No substitutions without written approval. Proposed alternatives must match light, water, mature size, habit and design role.</li><li>Reject root-bound, pest-damaged, sun-scorched, unstable or mislabelled stock. Existing retained plants are not reordered.</li></ol></section>`;

  const nav = document.getElementById("nav");
  const tabs = [["zones","Visual tour"],["plants","Plant details"],["shop","Procurement"]];
  nav.innerHTML = tabs.map(([id,label])=>`<button data-tab="${id}">${label}</button>`).join("");
  const app = document.getElementById("app");
  let currentTab="zones", currentZone=null;

  const openCards = () => app.querySelectorAll("[data-open-zone]").forEach(card => {
    const open=()=>{ currentZone=Number(card.dataset.openZone); location.hash="zone-"+currentZone; render(); window.scrollTo(0,0); };
    card.addEventListener("click",open);
    card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  });
  const render = () => {
    nav.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.tab===currentTab&&!currentZone));
    if(currentTab==="plants") app.innerHTML=plantsPage();
    else if(currentTab==="shop") app.innerHTML=shopPage();
    else if(currentZone){ const z=G.zones.find(x=>x.id===currentZone); app.innerHTML=zonePage(z); }
    else { app.innerHTML=home(); openCards(); bindCompares(app); }
  };
  nav.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;currentTab=b.dataset.tab;currentZone=null;location.hash=currentTab;render();});
  window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(h.startsWith("zone-")){currentTab="zones";currentZone=Number(h.split("-")[1]);}else if(["zones","plants","shop"].includes(h)){currentTab=h;currentZone=null;}render();});
  const start=location.hash.slice(1);if(start.startsWith("zone-"))currentZone=Number(start.split("-")[1]);else if(["plants","shop"].includes(start))currentTab=start;
  render();
})();
