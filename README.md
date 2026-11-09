# Site web — AMI Informatique

Site vitrine statique en français / anglais / arabe, hébergé gratuitement sur GitHub Pages,
avec une interface d'administration (Pages CMS) pour gérer **applications** et **actualités**
sans toucher au code.

## Contenu du dossier

```
index.html                    Page d'accueil
application.html              Page d'une application  (application.html?app=IDENTIFIANT)
confidentialite-app.html      Politique d'une application (confidentialite-app.html?app=IDENTIFIANT)
confidentialite.html          Politique de confidentialité du site
data/applications.json        ← Applications (géré dans l'administration)
data/actualites.json          ← Actualités (géré dans l'administration)
.pages.yml                    Configuration de l'administration (Pages CMS)
js/config.js                  Réglages : identifiant Formspree, numéro WhatsApp
js/actualites.js              Liens d'abonnement (chaîne WhatsApp, Facebook)
js/i18n.js                    Traductions des textes fixes du site
apps/ami-ticket/version.json  Fichier de mise à jour lu par l'application Android
assets/ , documents/ , telechargements/   Images, PDF, fichiers APK
```

## 1. Mise en ligne sur GitHub Pages

1. Créez un dépôt public sur github.com, par ex. `ami-informatique`.
2. **Add file → Upload files** : glissez **tout le contenu** de ce dossier (pas le dossier lui-même).
   ⚠ Le fichier `.pages.yml` commence par un point : sous Windows, activez
   « Affichage → Éléments masqués » pour être sûr de l'envoyer.
3. **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → **Save**.
4. Le site est en ligne après 1 à 2 minutes : `https://ami-informatique.github.io/`

Note : ouvert en double-cliquant sur `index.html`, le navigateur bloque la lecture des fichiers
`data/*.json` ; les applications et actualités ne s'affichent qu'une fois le site en ligne.

## 2. Interface d'administration (Pages CMS)

Configuration (une seule fois) : https://app.pagescms.org → « Sign in with GitHub » →
autorisez l'accès au dépôt du site → ouvrez le dépôt.
Menus disponibles : **Applications**, **Actualités**, **Mise à jour — AMI Ticket**, et les médias.
Chaque **Save** met le site à jour en 1 à 2 minutes.

### Applications
- **Ajouter** : Applications → « + ». Remplissez nom, **identifiant** (ex. `ami-caisse` :
  minuscules, sans espace — ne plus le changer après publication), description, icône, liens.
- **Télécharger** : envoyez l'APK dans le champ « Fichier APK », ou mettez un lien externe
  (GitHub Releases, conseillé pour les gros fichiers). Décochez « Bientôt disponible ».
- **Google Play** : collez le lien de la fiche dans « Lien Google Play ».
- **Politique de confidentialité** : rédigez-la directement dans le champ prévu (FR/EN/AR).
  Son adresse publique est automatiquement :
  `https://ami-informatique.github.io/confidentialite-app.html?app=IDENTIFIANT`
  → c'est ce lien qu'il faut mettre **dans l'application** et **dans Google Play Console**
  (Contenu de l'application → Règles de confidentialité). Ajoutez `&lang=en` ou `&lang=ar`
  pour forcer une langue.
- **Supprimer** : ouvrez la liste, supprimez l'élément (icône corbeille), Save.

### Commentaires du public
- Sur la page de chaque application, le public peut laisser un commentaire et une note,
  **sans créer de compte**. Le public ne peut rien modifier d'autre : seulement télécharger et commenter.
- Vous recevez chaque commentaire **par e-mail** (Formspree, sur amiinformatique2017@gmail.com).
- **Rien n'est publié automatiquement** : pour publier un commentaire, ouvrez Applications →
  l'application → « Commentaires publiés » → « + », copiez le nom, la date, la note et le texte,
  ajoutez éventuellement une réponse, Save. Pour retirer un commentaire, supprimez-le de la liste.
- Le formulaire Formspree gratuit a un nombre d'envois limité par mois, partagé entre devis
  et commentaires. Vous pouvez créer un 2e formulaire « Commentaires » sur Formspree et mettre
  son identifiant dans `js/config.js` (`formspreeCommentaires`).

### Actualités
Actualités → « + » : date, catégorie, titre, texte, **photos** (bouton Upload), **documents** PDF.
Réduisez les photos avant envoi (~1600 px, moins de 400 Ko, ex. squoosh.app) et demandez
l'accord des personnes photographiées.

### Mise à jour de l'application Android (version.json)
Menu « Mise à jour — AMI Ticket » : augmentez `versionCode`, changez `versionName`,
le lien de l'APK et les nouveautés. L'application lit :
`https://ami-informatique.github.io/apps/ami-ticket/version.json`
(ajoutez `?t=<horodatage>` côté Android pour éviter le cache de ~10 minutes).
Logique : `versionCode` du fichier > version installée → proposer la mise à jour ;
version installée < `minVersionCode` → mise à jour obligatoire.
Pour une nouvelle application : créez `apps/IDENTIFIANT/version.json` et copiez le bloc
« version-ami-ticket » dans `.pages.yml`.

## 3. Formulaire de devis
Envoyé par Formspree (`js/config.js` → `formspree`), reçu par e-mail, objet en français
avec la langue du client. Bouton « Plutôt par WhatsApp » en secours.

## 4. Langues
Bouton FR / EN / ع en haut à droite ; arabe en lecture de droite à gauche. Textes fixes dans
`js/i18n.js` ; textes des applications et actualités dans l'administration (anglais/arabe
facultatifs : le français est affiché s'ils sont vides). Faites relire l'arabe et l'anglais
par un locuteur natif si possible.

## 5. Abonnement
Chaîne WhatsApp et page Facebook : `js/actualites.js` (`ABONNEMENT`).
