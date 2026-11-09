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
        apk: chemin(a.apk) || String(a.lienApk || "").trim(),
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

  function param(nom) {
    var m = new RegExp("[?&]" + nom + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : "";
  }

  return {
    charger: charger, esc: esc, tr: tr, chemin: chemin, dateLisible: dateLisible,
    texteRiche: texteRiche, messageHorsLigne: messageHorsLigne, param: param, langue: langue, t: t
  };
})();
