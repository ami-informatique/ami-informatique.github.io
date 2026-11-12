/* Chargement des applications (data/applications.json) et outils communs — ne pas modifier */
var AMI_APPS = (function () {
  var cache = null;

  function langue() { return window.AMI_I18N ? window.AMI_I18N.lang : "fr"; }
  function t(k) { return window.AMI_I18N ? window.AMI_I18N.t(k) : k; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Valeur traduite : { fr, en, ar } → texte dans la langue courante (français par défaut)
  function tr(v) {
    if (v && typeof v === "object" && !Array.isArray(v)) return v[langue()] || v.fr || "";
    return v || "";
  }
  // Chemin enregistré par l'interface d'administration ("/assets/x.png" → "assets/x.png")
  function chemin(c, base) {
    if (Array.isArray(c)) c = c[0];
    c = String(c || "").trim();
    if (!c) return "";
    if (/^(https?:)?\/\//.test(c)) return c;
    return (base || "") + c.replace(/^\/+/, "");
  }
  function slug(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function dateLisible(d) {
    if (!d) return "";
    try {
      var loc = { fr: "fr-FR", en: "en-GB", ar: "ar-u-nu-latn" }[langue()] || "fr-FR";
      return new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return d; }
  }
  // Texte riche saisi dans l'administration : HTML tel quel, sinon mini-Markdown
  function texteRiche(src) {
    src = String(src || "").trim();
    if (!src) return "";
    if (/<\/?(p|h[1-6]|ul|ol|li|strong|em|blockquote|br|a)\b/i.test(src)) return src;
    var html = "", liste = false;
    src.split(/\n/).forEach(function (ligne) {
      var l = ligne.trim();
      var m;
      if (/^[-*•]\s+/.test(l)) {
        if (!liste) { html += "<ul>"; liste = true; }
        html += "<li>" + inline(l.replace(/^[-*•]\s+/, "")) + "</li>";
        return;
      }
      if (liste) { html += "</ul>"; liste = false; }
      if (!l) return;
      if ((m = /^(#{1,3})\s+(.*)$/.exec(l))) html += "<h2>" + inline(m[2]) + "</h2>";
      else if (/^>\s?/.test(l)) html += "<blockquote><p>" + inline(l.replace(/^>\s?/, "")) + "</p></blockquote>";
      else html += "<p>" + inline(l) + "</p>";
    });
    if (liste) html += "</ul>";
    return html;
    function inline(x) {
      return esc(x).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
    }
  }

  function normaliser(liste) {
    if (!Array.isArray(liste)) return [];
    return liste.filter(function (a) { return a && a.nom; }).map(function (a) {
      var coms = Array.isArray(a.commentaires) ? a.commentaires : [];
      return {
        id: (a.id && slug(a.id)) || slug(a.nom),
        nom: String(a.nom),
        plateforme: a.plateforme || "",
        version: a.version || "",
        icone: chemin(a.icone),
        description: a.description || {},
        bientot: !!a.bientot,
        playStore: String(a.playStore || "").trim(),
        playStoreBientot: !!a.playStoreBientot,
        apk: chemin(a.apk) || String(a.lienApk || "").trim(),
        fichier2: chemin(a.fichier2) || String(a.lienFichier2 || "").trim(),
        politiqueDate: a.politiqueDate || "",
        politique: a.politique || {},
        commentaires: coms.filter(function (c) { return c && c.texte; }).map(function (c) {
          return { nom: c.nom || "", date: c.date || "", note: +c.note || 0, texte: c.texte, reponse: c.reponse || "" };
        }).sort(function (x, y) { return String(y.date).localeCompare(String(x.date)); })
      };
    });
  }

  // base : préfixe de chemin vers la racine du site (ex. "../../" depuis un sous-dossier)
  function charger(base) {
    if (cache) return cache;
    cache = fetch((base || "") + "data/applications.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(normaliser);
    return cache;
  }

  function messageHorsLigne() {
    return location.protocol === "file:" ? t("app.localOnly") : t("app.loadError");
  }

  // Libellé du bouton selon le type de fichier (.apk, .exe/.msi, .zip…)
  function libelleTelechargement(url) {
    var u = String(url || "").split(/[?#]/)[0].toLowerCase();
    var ext = (u.match(/\.([a-z0-9]+)$/) || [])[1] || "";
    if (ext === "apk") return t("apps.apk");
    if (ext === "exe" || ext === "msi") return t("dl.installer") + " (." + ext + ")";
    if (ext === "zip") return t("dl.zip");
    return t("app.download");
  }

  // ===== Compteur de téléchargements (GitHub Releases) =====
  // Additionne download_count de tous les fichiers des Releases dont le tag
  // commence par l'identifiant de l'application (ex. « ami-ticket-v1.0.0 »).
  var dlCache = null;
  function telechargements() {
    if (dlCache) return dlCache;
    var repo = (window.AMI_CONFIG && AMI_CONFIG.githubRepo) || "";
    var CLE = "ami-dl-v1";
    try {
      var c = JSON.parse(sessionStorage.getItem(CLE) || "null");
      if (c && Date.now() - c.t < 30 * 60 * 1000) return (dlCache = Promise.resolve(c.d));
    } catch (e) {}
    if (!repo) return (dlCache = Promise.resolve({}));
    dlCache = fetch("https://api.github.com/repos/" + repo + "/releases?per_page=100")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rel) {
        var tot = {};
        (rel || []).forEach(function (x) {
          if (x.draft) return;
          var m = /^(.+?)-v?\d/i.exec(x.tag_name || "");
          if (!m) return;
          var id = slug(m[1]);
          (x.assets || []).forEach(function (a) { tot[id] = (tot[id] || 0) + (a.download_count || 0); });
        });
        try { sessionStorage.setItem(CLE, JSON.stringify({ t: Date.now(), d: tot })); } catch (e) {}
        return tot;
      })
      .catch(function () { return {}; });   // en cas d'erreur : on n'affiche simplement pas le compteur
    return dlCache;
  }
  function badgeTelechargements(n) {
    if (!n) return "";
    var loc = { fr: "fr-FR", en: "en-GB", ar: "ar-u-nu-latn" }[langue()] || "fr-FR";
    var nb = n.toLocaleString(loc);
    var txt = t(n > 1 ? "dl.many" : "dl.one").replace("{n}", nb);
    return '<span class="tag tag-dl" title="' + esc(txt) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4 6.3 10.7l1.4-1.4L11 12.6V3ZM4 18h16v2H4v-2Z"/></svg><bdi>' + esc(txt) + "</bdi></span>";
  }

  function param(nom) {
    var m = new RegExp("[?&]" + nom + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : "";
  }

  return {
    charger: charger, esc: esc, tr: tr, chemin: chemin, dateLisible: dateLisible,
    texteRiche: texteRiche, libelleTelechargement: libelleTelechargement, telechargements: telechargements, badgeTelechargements: badgeTelechargements, messageHorsLigne: messageHorsLigne, param: param, langue: langue, t: t
  };
})();
