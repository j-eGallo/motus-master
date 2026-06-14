# Motus-Master

## Présentation du projet

Motus-Master est une adaptation du jeu Motus sous forme d'application web.

Le joueur doit deviner un mot secret en six tentatives maximum. À chaque proposition, des indices visuels permettent de savoir si les lettres sont bien placées, mal placées ou absentes du mot à trouver.

---

## Fonctionnalités

- Inscription d'un joueur.
- Connexion sécurisée avec JWT.
- Création d'une partie.
- Trois niveaux de difficulté :
  - Facile : 4 lettres.
  - Moyen : 6 lettres.
  - Difficile : 10 lettres.
- Génération de mots via une API tierce.
- Vérification des mots proposés avec le Wiktionnaire.
- Affichage des indices de jeu.
- Gestion des victoires et des défaites.
- Calcul du score.
- Classement des joueurs.
- Documentation Swagger.
- Dockerisation du projet.

---

## Technologies utilisées

### Front-end

- React
- TypeScript
- Vite
- CSS

### Back-end

- Node.js
- Express
- JWT
- bcrypt
- CORS
- Swagger

### Base de données

- MySQL

### Conteneurisation

- Docker
- Docker Compose

---

## Architecture du projet

```txt
MOTUS-MASTER/
│
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   ├── package.json
│   └── ...
│
├── database/
│   └── init.sql
│
├── docker-compose.yml
└── README.md
```
## Configuration et lancement du projet

Le projet peut être lancé de deux manières :

- manuellement, en lançant séparément le back-end, le front-end et MySQL  (node server.js pour le back-end et npm run dev pour le front-end);

-Back-end :
```bash
node server.js

-Front-end :
```bash
npm run dev
- avec Docker, afin de lancer automatiquement l'ensemble des services.

---

## Lancement avec Docker

Le projet est dockerisé afin de simplifier son installation et son exécution.

Depuis la racine du projet, lancer la commande suivante :

```bash
docker compose up --build
