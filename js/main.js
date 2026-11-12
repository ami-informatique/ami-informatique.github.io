(function () {
  var t = window.AMI_I18N ? window.AMI_I18N.t : function (k) { return k; };
  function langue() { return window.AMI_I18N ? window.AMI_I18N.lang : "fr"; }

  // Année du pied de page
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Menu mobile
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  function fermerMenu() {
    if (!nav) return;
    nav.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", fermerMenu); });
  }

  // Lien actif dans le menu selon la section visible
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  function majActif() {
    if (!links.length) return;
    var pos = window.scrollY + 120, courant = links[0];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = id === "top" ? null : document.getElementById(id);
      if (sec && sec.offsetTop <= pos) courant = a;
    });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) courant = links[links.length - 1];
    links.forEach(function (a) { a.classList.toggle("active", a === courant); });
  }
  window.addEventListener("scroll", majActif, { passive: true });
  majActif();

  // ===== Demande de devis =====
  // Identifiant Formspree : dans js/config.js (AMI_CONFIG.formspree)
  var FORMSPREE_ID = (window.AMI_CONFIG && AMI_CONFIG.formspree) || "";
  var SPLITFORMS_KEY = "";   // ancien service, plus utilisé

  var WHATSAPP = "22792911341";
  var NOMS_LANGUES = { fr: "Français", en: "Anglais", ar: "Arabe" };
  var dlg = document.getElementById("devis");
  var form = document.getElementById("devis-form");
  var erreur = document.getElementById("devis-error");
  var okBox = document.getElementById("devis-ok");
  var btnSend = form ? form.querySelector(".btn-send") : null;

  function reinitDevis() {
    if (!form) return;
    form.hidden = false; okBox.hidden = true; erreur.hidden = true;
    if (btnSend) { btnSend.disabled = false; btnSend.textContent = t("btn.send"); }
  }

  document.querySelectorAll("[data-open-devis]").forEach(function (b) {
    b.addEventListener("click", function () {
      fermerMenu();
      if (dlg && dlg.showModal) { reinitDevis(); dlg.showModal(); }
      else { window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(t("wa.hello") + " " + t("wa.want")), "_blank"); }
    });
  });
  if (dlg) {
    dlg.querySelectorAll("[data-close-devis]").forEach(function (b) {
      b.addEventListener("click", function () { dlg.close(); });
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var canal = (e.submitter && e.submitter.value) || "whatsapp";
      var ok = true;
      ["nom", "tel", "service", "besoin"].forEach(function (n) {
        var el = form.elements[n];
        var vide = !el.value.trim();
        el.classList.toggle("invalid", vide);
        if (vide) ok = false;
      });
      erreur.textContent = t("err.required");
      erreur.hidden = ok;
      if (!ok) return;

      var f = form.elements;
      var serviceTexte = f.service.options[f.service.selectedIndex].text;

      // --- Envoi par e-mail via Formspree (ou SplitForms en secours) ---
      // L'objet de l'e-mail est toujours en français, avec la langue du client si ce n'est pas le français.
      if (canal === "envoi" && (FORMSPREE_ID || SPLITFORMS_KEY)) {
        var objet = "Demande de devis — " + f.service.value + " — " + f.nom.value.trim() +
          (langue() !== "fr" ? " [" + langue().toUpperCase() + "]" : "");
        var data = new FormData();
        data.append("Nom", f.nom.value.trim());
        data.append("Téléphone", f.tel.value.trim());
        data.append("Structure", f.structure.value.trim() || "—");
        data.append("Service", f.service.value);
        data.append("Besoin", f.besoin.value.trim());
        data.append("Langue du client", NOMS_LANGUES[langue()] || langue());
        var url;
        if (FORMSPREE_ID) {
          url = "https://formspree.io/f/" + FORMSPREE_ID;
          data.append("_subject", objet);
          data.append("_gotcha", f.botcheck.checked ? "spam" : "");
        } else {
          url = "https://splitforms.com/api/submit";
          data.append("access_key", SPLITFORMS_KEY);
          data.append("subject", objet);
          data.append("from_name", "Site AMI Informatique");
          if (f.botcheck.checked) data.append("botcheck", "on");
        }
        btnSend.disabled = true; btnSend.textContent = t("btn.sending");
        fetch(url, {
          method: "POST", body: data, headers: { Accept: "application/json" }
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok || j.success === false || j.ok === false || j.errors) throw new Error(j.code || ("HTTP " + r.status));
          });
        }).then(function () {
          form.reset(); form.hidden = true; okBox.hidden = false;
        }).catch(function () {
          btnSend.disabled = false; btnSend.textContent = t("btn.send");
          erreur.textContent = t("err.send");
          erreur.hidden = false;
        });
        return;
      }

      // --- Envoi via WhatsApp (message pré-rempli dans la langue du visiteur) ---
      var msg =
        t("wa.hello") + "\n" + t("wa.want") + "\n\n" +
        "• " + t("wa.name") + " : " + f.nom.value.trim() + "\n" +
        "• " + t("wa.phone") + " : " + f.tel.value.trim() + "\n" +
        (f.structure.value.trim() ? "• " + t("wa.org") + " : " + f.structure.value.trim() + "\n" : "") +
        "• " + t("wa.service") + " : " + serviceTexte + "\n\n" +
        t("wa.need") + " :\n" + f.besoin.value.trim();

      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      dlg.close();
      form.reset();
    });
  }

  // ===== Cartes des applications (données dans data/applications.json) =====
  var grid = document.getElementById("apps-grid");
  var listeConf = document.getElementById("apps-privacy-list");
  var APPS = null;
  var DL = {};   // nombre de téléchargements par application

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function initiales(nom) {
    return String(nom || "?").split(/\s+/).map(function (m) { return m[0]; }).join("").slice(0, 2).toUpperCase();
  }
  var ICONE_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5v17a1 1 0 0 0 1.5.86l14.5-8.5a1 1 0 0 0 0-1.72L6.5 2.64A1 1 0 0 0 5 3.5Z"/></svg>';
  var ICONE_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4 6.3 10.7l1.4-1.4L11 12.6V3ZM4 18h16v2H4v-2Z"/></svg>';

  function rendreApps() {
    if (!grid || !APPS) return;
    if (!APPS.length) { grid.innerHTML = '<p class="news-empty">' + esc(t("news.empty")) + "</p>"; return; }
    grid.innerHTML = APPS.map(function (app) {
      var page = "application.html?app=" + encodeURIComponent(app.id);
      var icone = app.icone ? '<img src="' + esc(app.icone) + '" alt="">' : esc(initiales(app.nom));
      var tags = "";
      if (app.plateforme) tags += '<span class="tag">' + esc(app.plateforme) + "</span>";
      if (app.version) tags += '<span class="tag"><bdi>v' + esc(app.version) + "</bdi></span>";
      if (app.bientot) tags += '<span class="tag tag-soon">' + esc(t("apps.soon")) + "</span>";
      if (app.playStoreBientot && !app.playStore) tags += '<span class="tag tag-play">' + esc(t("apps.playSoon")) + "</span>";
      tags += AMI_APPS.badgeTelechargements(DL[app.id]);
      var nb = app.commentaires.length;

      var boutons = '<a class="btn btn-primary" href="' + page + '">' + esc(t("apps.details")) + "</a>";
      if (!app.bientot && app.playStore) boutons += '<a class="btn btn-play" href="' + esc(app.playStore) + '" target="_blank" rel="noopener">' + ICONE_PLAY + esc(t("apps.play")) + "</a>";
      else if (!app.bientot && app.apk) boutons += '<a class="btn btn-ghost" href="' + esc(app.apk) + '" download>' + ICONE_DL + esc(t("app.download")) + "</a>";

      return (
        '<article class="app-card">' +
          '<div class="app-head">' +
            '<a class="app-icon" href="' + page + '" aria-hidden="true" tabindex="-1">' + icone + "</a>" +
            "<div>" +
              '<h3 class="app-name"><a href="' + page + '"><bdi>' + esc(app.nom) + "</bdi></a></h3>" +
              '<div class="app-meta">' + tags + "</div>" +
            "</div>" +
          "</div>" +
          '<p class="app-desc">' + esc(AMI_APPS.tr(app.description)) + "</p>" +
          '<div class="app-actions">' + boutons + "</div>" +
          '<div class="app-links">' +
            '<a href="' + page + '#commentaires">' + esc(t("app.comments")) + (nb ? " (<bdi>" + nb + "</bdi>)" : "") + "</a>" +
            '<a href="confidentialite-app.html?app=' + encodeURIComponent(app.id) + "&lang=" + langue() + '">' + esc(t("apps.privacy")) + "</a>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  // Page « confidentialité » du site : liste des politiques de chaque application
  function rendreListeConf() {
    if (!listeConf || !APPS) return;
    listeConf.innerHTML = APPS.map(function (a) {
      return '<li><a href="confidentialite-app.html?app=' + encodeURIComponent(a.id) + "&lang=" + langue() + '"><bdi>' + esc(a.nom) + "</bdi> — " + esc(t("apps.privacy")) + "</a></li>";
    }).join("");
  }

  if ((grid || listeConf) && window.AMI_APPS) {
    AMI_APPS.charger().then(function (liste) {
      APPS = liste; rendreApps(); rendreListeConf();
      AMI_APPS.telechargements().then(function (d) { DL = d || {}; rendreApps(); });
    }).catch(function () {
      var msg = '<p class="news-empty">' + esc(AMI_APPS.messageHorsLigne()) + "</p>";
      if (grid) grid.innerHTML = msg;
      if (listeConf) listeConf.innerHTML = "<li>" + esc(AMI_APPS.messageHorsLigne()) + "</li>";
    });
  }

  // Changement de langue : on régénère les parties construites en JavaScript
  document.addEventListener("langchange", function () {
    rendreApps(); rendreListeConf();
    if (btnSend && !btnSend.disabled) btnSend.textContent = t("btn.send");
    if (erreur && !erreur.hidden) erreur.textContent = t("err.required");
  });
})();
