const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});



const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Motus Master API",
      version: "1.0.0",
      description: "Documentation de l'API Motus Master"
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ]
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);



/**
 * @swagger
 * /register:
 *   post:
 *     summary: Inscrire un nouveau joueur
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pseudo
 *               - email
 *               - password
 *             properties:
 *               pseudo:
 *                 type: string
 *                 example: JeanEmmanuel
 *               email:
 *                 type: string
 *                 example: jean@email.com
 *               password:
 *                 type: string
 *                 example: motdepasse123
 *     responses:
 *       200:
 *         description: Joueur inscrit avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vous êtes inscrit
 *       500:
 *         description: Erreur SQL ou erreur serveur
 */
app.post("/register", async (req, res) => {

  const { pseudo, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  try {

    const sql = `
      INSERT INTO joueur
      (
        pseudo,
        email,
        password
      )

      VALUES (?, ?, ?)
    `;

    connection.query(

      sql,

      [
        pseudo,
        email,
        hashedPassword
      ],

      (err, result) => {

        if(err){

          console.log(err);

          return res.status(500).json({
            message: "Erreur SQL"
          });

        }

        res.json({
          message: "Vous êtes inscrit"
        });

      }

    );

  } catch(error){

    console.log(error);

    return res.status(500).json({
      message: "Erreur serveur"
    });

  }

});




/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connecter un joueur
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: jean@email.com
 *               password:
 *                 type: string
 *                 example: motdepasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Connexion réussie
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Mot de passe incorrect
 *       404:
 *         description: Utilisateur inexistant
 *       500:
 *         description: Connexion échouée
 */
app.post("/login", (req, res) => {

  const { email, password } = req.body;

  const sql = `
    SELECT *
    FROM joueur
    WHERE email = ?
  `;

  connection.query(

    sql,

    [email],

    async (err, result) => {

      if(err){

        console.log(err);

        return res.status(500).json({
          message: "Connexion échouée"
        });

      }

      if(result.length === 0){

        return res.status(404).json({
          message: "Utilisateur inexistant"
        });

      }

      const joueur = result[0];

      const passwordMatch = await bcrypt.compare(
        password,
        joueur.password
      );

      if(!passwordMatch){

        return res.status(401).json({
          message: "Mot de passe incorrect"
        });

      }

      const token = jwt.sign(

        {
          id: joueur.id,
          pseudo: joueur.pseudo
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "24h"
        }

      );

      res.json({
        message: "Connexion réussie",
        token
      });

    }

  );

});


const fetchJsonSafe = async (url) => {

  const response = await fetch(url);

  const text = await response.text();

  try {

    return JSON.parse(text);

  } catch (error) {

    console.log("Réponse non JSON reçue depuis :", url);
    console.log(text.slice(0, 300));

    return null;

  }

};





/**
 * @swagger
 * /partie:
 *   post:
 *     summary: Créer une nouvelle partie
 *     tags:
 *       - Partie
 *     security:
 *       - bearerAuth: []
 *     description: Crée une nouvelle partie pour le joueur connecté. Le mot secret est généré via l'API tierce Trouve-Mot selon le niveau de difficulté choisi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - niveau_difficulte
 *             properties:
 *               niveau_difficulte:
 *                 type: string
 *                 enum: [Facile, Moyen, Difficile]
 *                 example: Moyen
 *     responses:
 *       200:
 *         description: Partie créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Partie créée
 *                 id_partie:
 *                   type: integer
 *                   example: 12
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur, erreur SQL ou erreur liée à l'API externe
 */
app.post("/partie", async (req, res) => {

  const { niveau_difficulte } = req.body;

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token manquant"
    });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id_joueur = decoded.id;

    let longueur;

    if (niveau_difficulte === "Facile") {
      longueur = 4;
    }
    else if (niveau_difficulte === "Moyen") {
      longueur = 6;
    }
    else {
      longueur = 10;
    }

    const response = await fetch(
      `https://trouve-mot.fr/api/size/${longueur}`
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.log("Réponse non JSON :", text);

      return res.status(500).json({
        message: "L'API externe ne répond pas correctement"
      });
    }


    if (!data || data.length === 0 || !data[0].name) {
      return res.status(500).json({
        message: "Aucun mot trouvé"
      });
    }

    const mot_secret = data[0].name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    const sql = `
      INSERT INTO partie
      (
        id_joueur,
        mot_secret,
        niveau_difficulte,
        nb_tentatives,
        score
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(
      sql,
      [
        id_joueur,
        mot_secret,
        niveau_difficulte,
        0,
        0
      ],
      (err, result) => {

        if (err) {
          console.log(err);

          return res.status(500).json({
            message: "Erreur SQL"
          });
        }

        res.json({
          message: "Partie créée",
          id_partie: result.insertId,
        });

      }
    );

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Erreur serveur"
    });

  }

});





/**
 * @swagger
 * /score:
 *   get:
 *     summary: Récupérer le score du joueur connecté
 *     tags:
 *       - Statistiques
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Score du joueur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   example: 150
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Joueur introuvable
 *       500:
 *         description: Erreur SQL ou erreur serveur
 */
app.get("/score", (req, res) => {

  const token =
    req.headers.authorization?.split(" ")[1];

  if(!token){

    return res.status(401).json({
      message: "Token manquant"
    });

  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const id_joueur = decoded.id;

    const sql = `
      SELECT score_total
      FROM joueur
      WHERE id = ?
    `;

    connection.query(

      sql,

      [id_joueur],

      (err, result) => {

        if(err){

          console.log(err);

          return res.status(500).json({
            message: "Erreur SQL"
          });

        }

        if(result.length === 0){

          return res.status(404).json({
            message: "Joueur introuvable"
          });

        }

        const score = result[0].score_total;

        res.json({
          score: score === null ? 0 : score
        });

      }

    );

  } catch(error){

    console.log(error);

    return res.status(500).json({
      message: "Erreur serveur"
    });

  }

});



/**
 * @swagger
 * /classement:
 *   get:
 *     summary: Récupérer le classement des joueurs
 *     tags:
 *       - Statistiques
 *     responses:
 *       200:
 *         description: Classement des 10 meilleurs joueurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pseudo:
 *                     type: string
 *                     example: JeanEmmanuel
 *                   score_total:
 *                     type: integer
 *                     example: 250
 *       500:
 *         description: Erreur SQL
 */
app.get("/classement", (req, res) => {

  const sql = `
  
    SELECT
      joueur.pseudo,
      joueur.score_total

    FROM joueur

    WHERE score_total IS NOT NULL
    AND score_total > 0

    ORDER BY score_total DESC

    LIMIT 10

  `;

  connection.query(

    sql,

    (err, result) => {

      if(err){

        console.log(err);

        return res.status(500).json({
          message: "Erreur SQL"
        });

      }

      res.json(result);

    }

  );

});




/**
 * @swagger
 * /sendWord:
 *   post:
 *     summary: Envoyer une proposition de mot
 *     tags:
 *       - Partie
 *     description: Vérifie le mot proposé par le joueur, compare les lettres avec le mot secret, met à jour les tentatives, le résultat de la partie, le score, les victoires ou les défaites.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_partie
 *               - mot
 *             properties:
 *               id_partie:
 *                 type: integer
 *                 example: 12
 *               mot:
 *                 type: string
 *                 example: MAISON
 *     responses:
 *       200:
 *         description: Mot accepté, victoire ou défaite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mot accepté
 *                 mot:
 *                   type: string
 *                   example: MAISON
 *                 resultat:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lettre:
 *                         type: string
 *                         example: M
 *                       statut:
 *                         type: string
 *                         enum: [correct, present, absent]
 *                         example: correct
 *                 nb_tentatives:
 *                   type: integer
 *                   example: 3
 *                 victoire:
 *                   type: boolean
 *                   example: false
 *                 defaite:
 *                   type: boolean
 *                   example: false
 *                 score:
 *                   type: integer
 *                   example: 0
 *                 mot_secret:
 *                   type: string
 *                   example: MAISON
 *       400:
 *         description: Données manquantes ou mot inexistant
 *       404:
 *         description: Partie introuvable
 *       500:
 *         description: Erreur SQL ou erreur serveur
 */
app.post("/sendWord", async (req, res) => {

  const { id_partie, mot } = req.body;

  if (!id_partie || !mot) {
    return res.status(400).json({
      message: "Données manquantes"
    });
  }

  const motJoueur = mot
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  try {

    const wikiData = await fetchJsonSafe(
      `https://fr.wiktionary.org/w/api.php?action=query&titles=${motJoueur.toLowerCase()}&format=json&origin=*`
    );

    if (wikiData && wikiData.query && wikiData.query.pages) {

      const pages = wikiData.query.pages;
      const pageId = Object.keys(pages)[0];

      if (pageId === "-1") {
        return res.status(400).json({
          message: "Ce mot n'existe pas"
        });
      }

    }

    const sql = `
      SELECT
        id_joueur,
        mot_secret,
        nb_tentatives,
        niveau_difficulte
      FROM partie
      WHERE id = ?
    `;

    connection.query(sql, [id_partie], (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          message: "Erreur SQL"
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Partie introuvable"
        });
      }

      const partie = result[0];

      const id_joueur = partie.id_joueur;

      const motSecret = partie.mot_secret
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

      const nbTentatives = partie.nb_tentatives + 1;

      const resultat = motJoueur
        .split("")
        .map((lettre, index) => {

          if (lettre === motSecret[index]) {
            return {
              lettre,
              statut: "correct"
            };
          }

          if (motSecret.includes(lettre)) {
            return {
              lettre,
              statut: "present"
            };
          }

          return {
            lettre,
            statut: "absent"
          };

        });

      const victoire =
        motJoueur === motSecret;

      const defaite =
        !victoire && nbTentatives >= 6;

      let resultatPartie = null;

      if (victoire) {
        resultatPartie = "reussi";
      }

      if (defaite) {
        resultatPartie = "perdu";
      }

      let scorePartie = 0;

      if (victoire) {

        if (nbTentatives === 1) {
          scorePartie = 100;
        }
        else if (nbTentatives === 2) {
          scorePartie = 90;
        }
        else if (nbTentatives === 3) {
          scorePartie = 80;
        }
        else if (nbTentatives === 4) {
          scorePartie = 70;
        }
        else if (nbTentatives === 5) {
          scorePartie = 60;
        }
        else {
          scorePartie = 50;
        }

        if (partie.niveau_difficulte === "Moyen") {
          scorePartie = Math.round(scorePartie * 1.5);
        }

        if (partie.niveau_difficulte === "Difficile") {
          scorePartie = scorePartie * 2;
        }

      }

      const updatePartieSql = `
        UPDATE partie
        SET
          nb_tentatives = ?,
          resultat = ?,
          score = ?
        WHERE id = ?
      `;

      connection.query(
        updatePartieSql,
        [
          nbTentatives,
          resultatPartie,
          scorePartie,
          id_partie
        ],
        (updateErr) => {

          if (updateErr) {
            console.log(updateErr);

            return res.status(500).json({
              message: "Erreur SQL update partie"
            });
          }

          if (!victoire && !defaite) {

            return res.json({
              message: "Mot accepté",
              mot: motJoueur,
              resultat,
              nb_tentatives: nbTentatives,
              victoire,
              defaite,
              score: 0
            });

          }

          if (defaite) {

            const updateDefaiteSql = `
              UPDATE joueur
              SET defaites = COALESCE(defaites, 0) + 1
              WHERE id = ?
            `;

            return connection.query(
              updateDefaiteSql,
              [id_joueur],
              (defaiteErr) => {

                if (defaiteErr) {
                  console.log(defaiteErr);

                  return res.status(500).json({
                    message: "Erreur SQL update défaite"
                  });
                }

                return res.json({
                  message: "Partie perdue",
                  mot: motJoueur,
                  resultat,
                  nb_tentatives: nbTentatives,
                  victoire,
                  defaite,
                  score: 0,
                  mot_secret: motSecret
                });

              }
            );

          }

          const updateJoueurSql = `
            UPDATE joueur
            SET
              score_total = COALESCE(score_total, 0) + ?,
              victoires = COALESCE(victoires, 0) + 1
            WHERE id = ?
          `;

          return connection.query(
            updateJoueurSql,
            [
              scorePartie,
              id_joueur
            ],
            (joueurErr) => {

              if (joueurErr) {
                console.log(joueurErr);

                return res.status(500).json({
                  message: "Erreur SQL update joueur"
                });
              }

              return res.json({
                message: "Victoire",
                mot: motJoueur,
                resultat,
                nb_tentatives: nbTentatives,
                victoire,
                defaite,
                score: scorePartie
              });

            }
          );

        }
      );

    });

  } catch(error) {

    console.log(error);

    return res.status(500).json({
      message: "Erreur serveur"
    });

  }

});


/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Déconnecter un joueur
 *     tags:
 *       - Authentification
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie
 */
app.post("/logout", (req, res) => {

  res.json({
    message: "Déconnexion réussie"
  });

});








app.listen(PORT, () => {
  console.log(
    "Server running on http://localhost:" + PORT
  );
});