/* Affichage des actualités (données dans js/actualites.js) — ne pas modifier */
(function () {
  var grid = document.getElementById("news-grid");
  if (!grid) return;
  var ACTUALITES = [];   // chargées depuis data/actualites.json

  var I = window.AMI_I18N;
  var t = I ? I.t : function (k) { return k; };
  function langue() { return I ? I.lang : "fr"; }
  var NB_INITIAL = 6;
  var toutAfficher = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tr(v) {
    if (v && typeof v === "object") return v[langue()] || v.fr || "";
    return v || "";
  }
  function chemin(c) { return String(c || "").replace(/^\/+/, ""); }   // "/assets/x.jpg" → "assets/x.jpg"
  function photoSrc(p) { return chemin(typeof p === "string" ? p : (p && p.src) || ""); }
  function photoLeg(p) { return typeof p === "string" ? "" : tr(p.legende); }
  function dateLisible(d) {
    try {
      var loc = { fr: "fr-FR", en: "en-GB", ar: "ar-u-nu-latn" }[langue()] || "fr-FR";
      return new Date(d + "T12:00:00").toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return d; }
  }
  function paragraphes(txt) {
    return String(txt).split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }

  var ICONE_DOC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM11 11v4.6l-1.8-1.8-1.4 1.4L12 19.4l4.2-4.2-1.4-1.4-1.8 1.8V11h-2Z"/></svg>';

  function triees() {
    return ACTUALITES.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  function rendre() {
    var liste = triees();
    var btnAll = document.getElementById("news-all");
    if (!liste.length) {
      grid.innerHTML = '<p class="news-empty">' + esc(t("news.empty")) + "</p>";
      if (btnAll) btnAll.hidden = true;
      return;
    }
    var visibles = toutAfficher ? liste : liste.slice(0, NB_INITIAL);
    if (btnAll) btnAll.hidden = toutAfficher || liste.length <= NB_INITIAL;

    grid.innerHTML = visibles.map(function (a) {
      var photos = a.photos || [];
      var cover = "";
      if (photos.length) {
        var vignettes = photos.slice(1, 4).map(function (p, i) {
          var reste = (i === 2 && photos.length > 4) ? '<span class="news-thumb-more">+' + (photos.length - 4) + "</span>" : "";
          return '<button type="button" class="news-thumb" data-news="' + esc(a.id) + '" data-idx="' + (i + 1) + '">' +
            '<img src="' + esc(photoSrc(p)) + '" alt="' + esc(photoLeg(p) || t("news.photoAlt")) + '" loading="lazy">' + reste + "</button>";
        }).join("");
        cover =
          '<button type="button" class="news-cover" data-news="' + esc(a.id) + '" data-idx="0">' +
            '<img src="' + esc(photoSrc(photos[0])) + '" alt="' + esc(photoLeg(photos[0]) || tr(a.titre)) + '" loading="lazy">' +
          "</button>" +
          (vignettes ? '<div class="news-thumbs">' + vignettes + "</div>" : "");
      }
      var docs = (a.documents || []).filter(function (d) { return d && d.fichier; });
      var docsHtml = docs.length
        ? '<div class="news-docs"><p class="news-docs-title">' + esc(t("news.docs")) + "</p><ul>" +
          docs.map(function (d) {
            return '<li><a href="' + esc(chemin(d.fichier)) + '" target="_blank" rel="noopener">' + ICONE_DOC + "<span>" + esc(tr(d.nom) || d.fichier.split("/").pop()) + "</span></a></li>";
          }).join("") + "</ul></div>"
        : "";
      var texte = tr(a.texte);
      var long = texte.length > 260;

      return (
        '<article class="news-card' + (photos.length ? "" : " news-card-nophoto") + '" id="actu-' + esc(a.id) + '">' +
          cover +
          '<div class="news-body">' +
            '<div class="news-meta"><span class="tag tag-cat cat-' + esc(a.categorie) + '">' + esc(t("cat." + a.categorie)) + "</span>" +
              '<time datetime="' + esc(a.date) + '">' + esc(dateLisible(a.date)) + "</time></div>" +
            '<h3 class="news-title">' + esc(tr(a.titre)) + "</h3>" +
            '<div class="news-text' + (long ? " clamp" : "") + '">' + paragraphes(texte) + "</div>" +
            (long ? '<button type="button" class="news-toggle" aria-expanded="false">' + esc(t("news.more")) + "</button>" : "") +
            docsHtml +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  // Lire la suite / Réduire
  grid.addEventListener("click", function (e) {
    var tog = e.target.closest(".news-toggle");
    if (tog) {
      var txt = tog.previousElementSibling;
      var ouvert = txt.classList.toggle("clamp") === false;
      tog.setAttribute("aria-expanded", ouvert ? "true" : "false");
      tog.textContent = t(ouvert ? "news.less" : "news.more");
      return;
    }
    var ph = e.target.closest("[data-news]");
    if (ph) ouvrirVisionneuse(ph.getAttribute("data-news"), +ph.getAttribute("data-idx"));
  });

  var btnAll = document.getElementById("news-all");
  if (btnAll) btnAll.addEventListener("click", function () { toutAfficher = true; rendre(); });

  // ===== Visionneuse de photos =====
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-cap");
  var lbPhotos = [], lbIdx = 0;

  function montrer() {
    var p = lbPhotos[lbIdx];
    lbImg.src = photoSrc(p);
    lbImg.alt = photoLeg(p) || t("news.photoAlt");
    var leg = photoLeg(p);
    lbCap.textContent = (leg ? leg + " · " : "") + (lbIdx + 1) + " / " + lbPhotos.length;
    lb.classList.toggle("lb-single", lbPhotos.length < 2);
  }
  function ouvrirVisionneuse(id, idx) {
    var a = ACTUALITES.filter(function (x) { return x.id === id; })[0];
    if (!a || !lb) return;
    lbPhotos = a.photos || []; lbIdx = idx || 0;
    if (!lbPhotos.length) return;
    montrer();
    if (lb.showModal) lb.showModal(); else window.open(photoSrc(lbPhotos[lbIdx]), "_blank");
  }
  function decaler(n) {
    if (!lbPhotos.length) return;
    lbIdx = (lbIdx + n + lbPhotos.length) % lbPhotos.length;
    montrer();
  }
  if (lb) {
    var rtl = function () { return document.documentElement.dir === "rtl"; };
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.querySelector(".lb-prev").addEventListener("click", function () { decaler(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { decaler(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") decaler(rtl() ? -1 : 1);
      if (e.key === "ArrowLeft") decaler(rtl() ? 1 : -1);
    });
    // Glisser du doigt sur téléphone
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) decaler((dx < 0) !== rtl() ? 1 : -1);
    });
  }

  // ===== Boutons d'abonnement =====
  function rendreAbonnement() {
    var box = document.getElementById("news-follow");
    var act = document.getElementById("news-follow-actions");
    if (!box || !act || typeof ABONNEMENT === "undefined") return;
    var ICONE_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3Z"/></svg>';
    var ICONE_FB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z"/></svg>';
    var html = "";
    if (ABONNEMENT.whatsappChaine) html += '<a class="btn btn-whatsapp" href="' + esc(ABONNEMENT.whatsappChaine) + '" target="_blank" rel="noopener">' + ICONE_WA + esc(t("news.follow.wa")) + "</a>";
    if (ABONNEMENT.facebook) html += '<a class="btn btn-fb" href="' + esc(ABONNEMENT.facebook) + '" target="_blank" rel="noopener">' + ICONE_FB + esc(t("news.follow.fb")) + "</a>";
    act.innerHTML = html;
    box.hidden = !html;
  }

  // Nettoie les données saisies dans l'interface d'administration
  function normaliser(liste) {
    if (!Array.isArray(liste)) return [];
    return liste.filter(function (a) { return a && a.date; }).map(function (a, i) {
      var photos = a.photos;
      if (typeof photos === "string") photos = photos ? [photos] : [];
      var docs = Array.isArray(a.documents) ? a.documents : [];
      docs = docs.map(function (d) {
        var f = d && d.fichier;
        if (Array.isArray(f)) f = f[0];
        return { nom: d && d.nom, fichier: f };
      });
      return {
        id: (a.id && String(a.id).trim()) || (String(a.date) + "-" + (i + 1)),
        date: String(a.date).slice(0, 10),
        categorie: a.categorie || "annonce",
        titre: a.titre, texte: a.texte,
        photos: (photos || []).filter(Boolean),
        documents: docs
      };
    });
  }

  function demarrer() {
    rendre();
    if (/^#actu-/.test(location.hash)) {   // lien direct, ex. index.html#actu-lancement-site-web
      toutAfficher = true; rendre();
      var cible = document.getElementById(location.hash.slice(1));
      if (cible) setTimeout(function () { cible.scrollIntoView(); }, 50);
    }
  }

  rendreAbonnement();
  document.addEventListener("langchange", function () { rendre(); rendreAbonnement(); });

  fetch("data/actualites.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { ACTUALITES = normaliser(d); demarrer(); })
    .catch(function () {
      // Ouvert directement depuis l'ordinateur (file://) : le navigateur bloque la lecture du fichier
      grid.innerHTML = '<p class="news-empty">' + esc(location.protocol === "file:"
        ? "Les actualités s'affichent une fois le site en ligne (GitHub Pages)."
        : t("news.empty")) + "</p>";
    });
})();
