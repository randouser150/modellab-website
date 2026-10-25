// Hero 3D viewer: SARS-CoV-2 Mpro (chain A) with the N3 inhibitor (chain C), PDB 6LU7.
(function () {
  var el = document.getElementById("mol");
  if (!el || !window.$3Dmol) return;

  // 3Dmol needs hex colours; resolve the OKLCH tokens through a 1px canvas.
  function tokenHex(name) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var c = document.createElement("canvas");
    c.width = c.height = 1;
    var ctx = c.getContext("2d");
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map(function (n) { return n.toString(16).padStart(2, "0"); }).join("");
  }

  var viewer = $3Dmol.createViewer(el, { backgroundAlpha: 0, antialias: true });
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function paint() {
    var protein = tokenHex("--color-muted");
    var ligand = tokenHex("--color-accent");
    viewer.setStyle({}, {});
    viewer.setStyle({ chain: "A" }, { cartoon: { color: protein, thickness: 0.6, opacity: 0.9 } });
    viewer.setStyle({ chain: "C" }, { stick: { color: ligand, radius: 0.32 }, sphere: { color: ligand, scale: 0.42 } });
    viewer.render();
  }

  fetch("assets/structures/6lu7.pdb")
    .then(function (r) { return r.text(); })
    .then(function (pdb) {
      viewer.addModel(pdb, "pdb");
      paint();
      viewer.zoomTo({ chain: "A" });
      viewer.zoom(1.15);
      // Clamp zoom around the starting view: in to ~2x, out to ~0.65x.
      // 3Dmol limits are camera distances (CAMERA_Z minus the view's z).
      var startDistance = viewer.CAMERA_Z - viewer.getView()[3];
      viewer.setZoomLimits(startDistance * 0.5, startDistance * 1.5);
      viewer.render();
      el.classList.add("is-ready");
      if (!reduceMotion.matches) viewer.spin("y", 0.35);
    })
    .catch(function () { el.classList.add("is-failed"); });

  // Let a plain scroll wheel scroll the page; zoom only with Ctrl/⌘ held.
  // Trackpad pinch arrives as a wheel event with ctrlKey set, so it still zooms.
  el.addEventListener("wheel", function (e) {
    if (!e.ctrlKey && !e.metaKey) e.stopPropagation();
  }, { capture: true });

  // Stop the idle spin once the visitor takes over.
  el.addEventListener("pointerdown", function () { viewer.spin(false); }, { once: true });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paint);
})();
