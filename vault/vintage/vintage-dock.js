  (() => {
    const THEMES = [
      ["purple-haze","Purple Haze",["#9d4dff","#7c3cff","#c084fc","#e879f9","#a78bfa"]],
      ["neon-rainbow","Neon Rainbow",["#39ff14","#00eaff","#ff2bd6","#9d4dff","#ffe600"]],
      ["matrix","Matrix",["#39ff14","#00ff88","#b6ff00","#00c853","#d7ff00"]],
      ["cyberpunk","Cyberpunk",["#00f5ff","#ff2bd6","#9d4dff","#ffe600","#39ff14"]],
      ["electric-blue","Electric Blue",["#2684ff","#00eaff","#7df9ff","#8aa4ff","#4dffea"]],
      ["hot-pink","Hot Pink",["#ff2bd6","#ff4fa3","#c43cff","#7c3cff","#ff7ad9"]],
      ["fire","Neon Fire",["#ff5a1f","#ff1744","#ff9f0a","#ffe600","#ff3d00"]],
      ["ice","Neon Ice",["#00eaff","#7df9ff","#00b8ff","#6ee7ff","#4dffea"]],
      ["midnight","Midnight",["#5b7cff","#7c3cff","#00d9ff","#a78bfa","#39ffcc"]],
      ["native","Native",["#3b82f6","#60a5fa","#2563eb","#93c5fd","#1d4ed8"]]
    ];
    const KEY = "lddVaultTheme";
    const apply = id => {
      const t = THEMES.find(x => x[0] === id) || THEMES[0];
      document.documentElement.dataset.vaultTheme = t[0];
      try { localStorage.setItem(KEY, t[0]); } catch (_) {}
      document.querySelectorAll("#ldd-vt-grid .ldd-vt-card").forEach(c => c.classList.toggle("is-active", c.dataset.vt === t[0]));
    };
    const grid = document.getElementById("ldd-vt-grid");
    grid.innerHTML = THEMES.map(t =>
      `<button type="button" class="ldd-vt-card" data-vt="${t[0]}"><span class="ldd-vt-swatches">${t[2].map(c => `<i style="background:${c}"></i>`).join("")}</span><span>${t[1]}</span></button>`
    ).join("");
    grid.querySelectorAll(".ldd-vt-card").forEach(c => c.addEventListener("click", () => apply(c.dataset.vt)));
    const pop = document.getElementById("ldd-vintage-theme-pop");
    const btn = document.getElementById("ldd-vd-theme");
    const place = () => {
      const r = document.getElementById("ldd-vintage-dock").getBoundingClientRect();
      pop.style.top = Math.min(window.innerHeight - 330, r.bottom + 10) + "px";
      pop.style.right = Math.max(10, window.innerWidth - r.right) + "px";
    };
    btn.addEventListener("click", e => { e.stopPropagation(); place(); pop.classList.toggle("is-open"); });
    document.addEventListener("click", e => {
      if (pop.classList.contains("is-open") && !pop.contains(e.target) && e.target !== btn) pop.classList.remove("is-open");
    });
    document.getElementById("ldd-vd-vault").addEventListener("click", () => { location.href = "../index.html"; });
    apply(document.documentElement.dataset.vaultTheme || "purple-haze");
  })();
  