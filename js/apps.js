/* =========================================================
   LISTE DES APPLICATIONS — AMI Informatique
   ---------------------------------------------------------
   Pour AJOUTER une application : copiez le bloc d'exemple en bas,
   collez-le après une virgule et modifiez-le. Le site crée la
   carte automatiquement, dans les 3 langues.

   Champs :
     nom             : nom de l'application (identique dans toutes les langues)
     description     : { fr: "...", en: "...", ar: "..." }  (1 à 3 phrases)
     plateforme      : ex. "Android", "Windows", "Web"
     version         : ex. "1.0.0" (laisser "" si inconnue)
     icone           : image carrée (ex. "assets/img/apps/ami-ticket.png") ou "" = initiales
     playStore       : lien de la fiche Google Play, ou "" tant que l'app n'y est pas
                       ex. "https://play.google.com/store/apps/details?id=com.amiinformatique.amiticket"
     telechargement  : lien direct du fichier APK, ou ""
     confidentialite : page de politique de confidentialité de l'app
                       (c'est cette adresse qu'il faut donner à Google Play)
     bientot         : true = affiche « Bientôt disponible »
   ========================================================= */

const APPLICATIONS = [
  {
    nom: "AMI Ticket",
    description: {
      fr: "Application Android pour vendre des tickets Wi-Fi sur vos routeurs MikroTik : création des tickets, gestion des vendeurs, ventes et rapports. Fonctionne hors ligne.",
      en: "An Android app to sell Wi-Fi tickets on your MikroTik routers: ticket creation, seller management, sales and reports. Works offline.",
      ar: "تطبيق أندرويد لبيع تذاكر الواي فاي على أجهزة التوجيه MikroTik الخاصة بكم: إنشاء التذاكر، وإدارة البائعين، والمبيعات والتقارير. يعمل دون اتصال بالإنترنت."
    },
    plateforme: "Android",
    version: "1.0.0",
    icone: "",
    playStore: "",
    telechargement: "",
    confidentialite: "apps/ami-ticket/confidentialite.html",
    bientot: true
  }

  // , {
  //   nom: "Nouvelle application",
  //   description: {
  //     fr: "Description courte en français.",
  //     en: "Short description in English.",
  //     ar: "وصف قصير بالعربية."
  //   },
  //   plateforme: "Android",
  //   version: "1.0.0",
  //   icone: "",
  //   playStore: "",
  //   telechargement: "",
  //   confidentialite: "apps/nouvelle-application/confidentialite.html",
  //   bientot: false
  // }
];
