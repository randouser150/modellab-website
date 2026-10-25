// Renders tutorials/<slug>.md into tutorial.html?t=<slug>.
// A tutorial is a Markdown file with a small front-matter block:
//   ---
//   title: Protein simulation in water
//   tool: GROMACS
//   level: Beginner
//   ---
(function () {
  var article = document.getElementById("tutorial");
  var toc = document.getElementById("toc");
  var slug = new URLSearchParams(location.search).get("t") || "";

  function fail(message) {
    document.getElementById("tut-title").textContent = "Tutorial not found";
    article.innerHTML = '<p class="muted">' + message + ' <a href="tutorials.html">Back to all tutorials</a>.</p>';
  }

  // Slugs are file names only: letters, digits and hyphens.
  if (!/^[a-z0-9-]+$/.test(slug)) return fail("No tutorial was selected.");

  function frontMatter(text) {
    var meta = {};
    var match = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return { meta: meta, body: text };
    match[1].split("\n").forEach(function (line) {
      var i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return { meta: meta, body: text.slice(match[0].length) };
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function addCopyButtons() {
    article.querySelectorAll("pre").forEach(function (pre) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy";
      button.textContent = "Copy";
      button.addEventListener("click", function () {
        navigator.clipboard.writeText(pre.querySelector("code").innerText).then(function () {
          button.textContent = "Copied";
          setTimeout(function () { button.textContent = "Copy"; }, 1500);
        }, function () {
          button.textContent = "Select and copy";
        });
      });
      pre.appendChild(button);
    });
  }

  function buildToc() {
    var items = [];
    article.querySelectorAll("h2").forEach(function (h) {
      h.id = slugify(h.textContent);
      items.push('<li><a href="#' + h.id + '">' + h.textContent + "</a></li>");
    });
    if (items.length) toc.innerHTML = '<p class="toc-title">On this page</p><ol>' + items.join("") + "</ol>";
  }

  fetch("tutorials/" + slug + ".md")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (text) {
      var parsed = frontMatter(text.replace(/\r\n/g, "\n"));
      var m = parsed.meta;
      document.title = (m.title || "Tutorial") + " · Modellab";
      document.getElementById("tut-title").textContent = m.title || slug;
      document.getElementById("tut-meta").innerHTML = ["tool", "level", "time", "updated"]
        .filter(function (k) { return m[k]; })
        .map(function (k) { return "<span>" + DOMPurify.sanitize(m[k]) + "</span>"; })
        .join("");
      article.innerHTML = DOMPurify.sanitize(marked.parse(parsed.body));
      buildToc();
      addCopyButtons();
      if (location.hash) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    })
    .catch(function () { fail("We couldn’t find this tutorial."); });
})();
