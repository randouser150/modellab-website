// Topic chips + text search over the static publication list.
// Without JavaScript the full list is still shown.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll(".pubs .pub"));
  var input = document.getElementById("pub-q");
  var chips = Array.prototype.slice.call(document.querySelectorAll("#pub-topics .chip"));
  var count = document.getElementById("pub-count");
  var topic = "";

  // Pre-compute lowercase text once; strip Turkish dotted/dotless i differences.
  function norm(s) { return s.toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  items.forEach(function (li) { li._text = norm(li.textContent); });

  function apply() {
    var q = norm(input.value.trim());
    var shown = 0;
    items.forEach(function (li) {
      var okTopic = !topic || (" " + li.dataset.topics + " ").indexOf(" " + topic + " ") !== -1;
      var okText = !q || li._text.indexOf(q) !== -1;
      li.hidden = !(okTopic && okText);
      if (!li.hidden) shown++;
    });
    count.textContent = shown === items.length ? items.length + " publications" : shown + " of " + items.length + " publications";
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      topic = chip.dataset.topic;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      apply();
    });
  });
  input.addEventListener("input", apply);
  apply();
})();
