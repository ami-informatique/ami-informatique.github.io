/* Page d'une application : application.html?app=IDENTIFIANT — ne pas modifier */
(function () {
  var A = AMI_APPS, esc = A.esc, tr = A.tr, t = A.t;
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  var vue = document.getElementById("app-view");
  var section = document.getElementById("commentaires");
  var id = A.param("app");
  var app = null;

  var ICONE_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5v17a1 1 0 0 0 1.5.86l14.5-8.5a1 1 0 0 0 0-1.72L6.5 2.64A1 1 0 0 0 5 3.5Z"/></svg>';
  var ICONE_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4 6.3 10.7l1.4-1.4L11 12.6V3ZM4 18h16v2H4v-2Z"/></svg>';

  function etoiles(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += '<span class="' + (i <= n ? "on" : "") + '">★</span>';
    return '<span class="stars" aria-label="' + n + "/5 " + esc(t("app.stars")) + '">' + s + "</span>";
  }
  function initiales(nom) {
    return String(nom || "?").split(/\s+/).map(function (m) { return m[0]; }).join("").slice(0, 2).toUpperCase();
  }

  function rendre() {
    if (!app) return;
    document.title = app.nom + " — AMI Informatique";
    var icone = app.icone ? '<img src="' + esc(app.icone) + '" alt="">' : esc(initiales(app.nom));
    var tags = "";
    if (app.plateforme) tags += '<span class="tag">' + esc(app.plateforme) + "</span>";
    if (app.version) tags += '<span class="tag"><bdi>v' + esc(app.version) + "</bdi></span>";
    if (app.bientot) tags += '<span class="tag tag-soon">' + esc(t("apps.soon")) + "</span>";
    if (app.playStoreBientot && !app.playStore) tags += '<span class="tag tag-play">' + esc(t("apps.playSoon")) + "</span>";

    var boutons = "";
    if (!app.bientot && app.playStore) boutons += '<a class="btn btn-play" href="' + esc(app.playStore) + '" target="_blank" rel="noopener">' + ICONE_PLAY + esc(t("apps.play")) + "</a>";
    if (!app.bientot && app.apk) boutons += '<a class="btn ' + (app.playStore ? "btn-ghost" : "btn-primary") + '" href="' + esc(app.apk) + '" download>' + ICONE_DL + esc(A.libelleTelechargement(app.apk)) + "</a>";
    if (!app.bientot && app.fichier2) boutons += '<a class="btn btn-ghost" href="' + esc(app.fichier2) + '" download>' + ICONE_DL + esc(A.libelleTelechargement(app.fichier2)) + "</a>";
    if (!boutons) boutons = '<span class="btn" aria-disabled="true">' + esc(t("apps.soonBtn")) + "</span>";

    vue.innerHTML =
      '<article class="app-detail">' +
        '<div class="app-detail-head">' +
          '<div class="app-icon app-icon-lg" aria-hidden="true">' + icone + "</div>" +
          "<div>" +
            '<h1 class="app-detail-name"><bdi>' + esc(app.nom) + "</bdi></h1>" +
            '<div class="app-meta">' + tags + "</div>" +
          "</div>" +
        "</div>" +
        '<p class="app-detail-desc">' + esc(tr(app.description)) + "</p>" +
        '<div class="app-actions">' + boutons + "</div>" +
        '<a class="app-privacy" href="confidentialite-app.html?app=' + encodeURIComponent(app.id) + "&lang=" + A.langue() + '">' + esc(t("apps.privacy")) + "</a>" +
      "</article>";

    // Commentaires publiés
    var coms = app.commentaires;
    var notes = coms.filter(function (c) { return c.note > 0; });
    var resume = document.getElementById("comments-summary");
    if (notes.length) {
      var moy = notes.reduce(function (s, c) { return s + c.note; }, 0) / notes.length;
      resume.innerHTML = etoiles(Math.round(moy)) + ' <strong><bdi>' + moy.toFixed(1).replace(".", A.langue() === "fr" ? "," : ".") + "</bdi></strong> " +
        esc(t("app.avg")) + " · <bdi>" + notes.length + "</bdi> " + esc(t(notes.length > 1 ? "app.countN" : "app.count1"));
    } else resume.innerHTML = "";
    document.getElementById("comments-list").innerHTML = coms.length
      ? coms.map(function (c) {
          return '<div class="comment">' +
            '<div class="comment-head"><span class="comment-avatar" aria-hidden="true">' + esc(initiales(c.nom)) + "</span>" +
              '<div><strong class="comment-name" dir="auto">' + esc(c.nom || "—") + "</strong>" +
              '<span class="comment-date">' + esc(A.dateLisible(c.date)) + "</span></div>" +
              (c.note ? etoiles(c.note) : "") + "</div>" +
            '<p class="comment-text" dir="auto">' + esc(c.texte).replace(/\n/g, "<br>") + "</p>" +
            (c.reponse ? '<div class="comment-reply"><strong>' + esc(t("app.reply")) + "</strong><p dir=\"auto\">" + esc(c.reponse).replace(/\n/g, "<br>") + "</p></div>" : "") +
          "</div>";
        }).join("")
      : '<p class="news-empty">' + esc(t("app.noComments")) + "</p>";
    section.hidden = false;
  }

  function erreur(msg) {
    vue.innerHTML = '<div class="app-missing"><p>' + esc(msg) + '</p><a class="btn btn-ghost" href="index.html#applications">' + esc(t("app.back")) + "</a></div>";
    section.hidden = true;
  }

  A.charger().then(function (liste) {
    app = liste.filter(function (a) { return a.id === id; })[0] || null;
    if (!app) return erreur(t("app.notFound"));
    rendre();
  }).catch(function () { erreur(A.messageHorsLigne()); });

  document.addEventListener("langchange", function () { if (app) rendre(); });

  // ===== Envoi d'un commentaire (reçu par e-mail via Formspree, publié après validation) =====
  var form = document.getElementById("comment-form");
  var ok = document.getElementById("comment-ok");
  var err = document.getElementById("comment-error");
  var btn = document.getElementById("comment-send");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var manque = false;
    ["nom", "texte"].forEach(function (n) {
      var vide = !f[n].value.trim();
      f[n].classList.toggle("invalid", vide);
      if (vide) manque = true;
    });
    if (manque) { err.textContent = t("err.required"); err.hidden = false; return; }
    err.hidden = true;

    var cfg = window.AMI_CONFIG || {};
    var formId = cfg.formspreeCommentaires || cfg.formspree;
    var note = (form.querySelector('input[name="note"]:checked') || {}).value || "";
    var langues = { fr: "Français", en: "Anglais", ar: "Arabe" };

    if (!formId) {   // pas de Formspree : on passe par WhatsApp
      var msg = "Commentaire — " + (app ? app.nom : id) + "\n" + f.nom.value.trim() + (note ? " (" + note + "/5)" : "") + "\n\n" + f.texte.value.trim();
      window.open("https://wa.me/" + (cfg.whatsapp || "22792911341") + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      return;
    }
    var data = new FormData();
    data.append("Type", "Commentaire sur une application");
    data.append("Application", app ? app.nom : id);
    data.append("Nom", f.nom.value.trim());
    data.append("Note", note ? note + "/5" : "—");
    data.append("Commentaire", f.texte.value.trim());
    data.append("Langue", langues[A.langue()] || A.langue());
    data.append("Date", new Date().toISOString().slice(0, 10));
    data.append("_subject", "Nouveau commentaire — " + (app ? app.nom : id) + " — " + f.nom.value.trim());
    data.append("_gotcha", f._gotcha.value);
    btn.disabled = true; btn.textContent = t("btn.sending");
    fetch("https://formspree.io/f/" + formId, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.ok === false || j.errors) throw new Error("HTTP " + r.status);
        });
      })
      .then(function () { form.reset(); form.hidden = true; ok.hidden = false; })
      .catch(function () { err.textContent = t("err.send"); err.hidden = false; })
      .then(function () { btn.disabled = false; btn.textContent = t("app.send"); });
  });
})();
