# Glow Up 360°

Mon centre de contrôle quotidien : sport, nutrition, visage et skincare, développement intellectuel, habitudes,
rappels et statistiques. Tout est modifiable, et chaque modification est enregistrée automatiquement.

## Lancer l'application sur l'ordinateur

Prérequis : Node.js 20 ou plus récent.

```bash
cd glow-up-360
npm install
npm run dev
```

Puis ouvrir http://localhost:5320.

Version de production (fichiers statiques dans `dist/`) :

```bash
npm run build
npm run preview
```

## L'utiliser sur téléphone

L'application est en ligne sur **https://anis-jules.github.io/glow-up-360/** (GitHub Pages, gratuit, HTTPS).
C'est une PWA : elle s'installe sur l'écran d'accueil et s'ouvre comme une app.

1. Ouvrir l'adresse sur le téléphone, puis :
   - iPhone (Safari) : bouton Partager → « Sur l'écran d'accueil » ;
   - Android (Chrome) : menu ⋮ → « Installer l'application ».

### Publier une modification

Chaque `git push` sur `main` reconstruit et republie l'application (GitHub Actions,
`.github/workflows/deploy.yml`, environ une minute). Les données des utilisateurs ne sont pas touchées :
elles vivent dans le navigateur, pas dans le code.

Ouvrir `http://<ip-de-l-ordinateur>:5320` depuis le téléphone pendant `npm run dev` permet de tester l'affichage,
mais sans notifications ni mode hors ligne (le navigateur les réserve aux adresses HTTPS), et avec des données
séparées de celles de l'ordinateur.

## Où sont mes données ?

- Dans le navigateur de l'appareil utilisé (`localStorage`), jamais sur un serveur. Rien n'est envoyé nulle part.
- Elles restent après fermeture de l'onglet, du navigateur ou de l'ordinateur.
- Elles sont propres à chaque appareil et à chaque navigateur : le téléphone et l'ordinateur ont chacun les leurs.
  Pour transférer : Paramètres → Exporter (fichier `.json`), puis Importer sur l'autre appareil.
- Un point de restauration est créé automatiquement chaque jour (7 derniers conservés), et avant tout import ou
  réinitialisation. Paramètres → Données pour restaurer.
- Attention : vider les données du site dans le navigateur les efface. Safari peut aussi effacer les données d'un site
  non ouvert pendant 7 jours, sauf si l'application est installée sur l'écran d'accueil. Exporter de temps en temps
  reste la meilleure assurance.

## Rappels et notifications : ce qui marche, et les limites

- Les rappels déclenchent une alerte dans l'application et, si tu l'autorises, une notification du système.
- Ces notifications ne partent que lorsque l'application est ouverte (onglet ouvert, même en arrière-plan sur
  ordinateur, ou app installée ouverte sur téléphone). Sur iPhone, il faut iOS 16.4 ou plus et l'app installée sur
  l'écran d'accueil.
- Recevoir des notifications application fermée demande un serveur d'envoi (« Web Push ») : ce n'est pas inclus.
- Solution qui marche dès aujourd'hui, application fermée : Rappels → « Ajouter à mon agenda » télécharge un fichier
  `.ics` ; une fois importé dans l'agenda du téléphone (Apple Calendrier, Google Agenda), c'est l'agenda qui t'alerte.
  À refaire si tu modifies tes rappels.

## Aller plus loin (non inclus, à configurer si tu le souhaites)

### Synchroniser plusieurs appareils automatiquement

Il faut une base de données en ligne. Avec Supabase (offre gratuite) :

1. Créer un projet sur supabase.com.
2. Créer une table `app_state` : `user_id uuid primary key references auth.users`, `data jsonb`, `updated_at timestamptz`.
3. Activer la sécurité par ligne (RLS) avec une règle « chaque utilisateur ne lit et n'écrit que sa ligne ».
4. Activer la connexion par lien magique (e-mail).
5. Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans un fichier `.env.local`.
6. Brancher le magasin (`src/lib/store.ts`) : lire la ligne à l'ouverture, l'écrire après chaque modification.

### Notifications application fermée

Il faut un petit serveur : clés VAPID, enregistrement de l'abonnement push de chaque appareil, et une tâche planifiée
qui envoie les notifications à l'heure des rappels.

## Technique

React 19, TypeScript, Tailwind CSS 4, Vite, zustand + immer. Détails et conventions : [ARCHITECTURE.md](ARCHITECTURE.md).
