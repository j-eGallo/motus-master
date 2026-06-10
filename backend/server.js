const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const cors = require("cors");

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

    const data = await response.json();

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



app.post("/sendWord", async (req, res) => {

  const { id_partie, mot } = req.body;

  if (!id_partie || !mot) {
    return res.status(400).json({
      message: "Données manquantes"
    });
  }

  const motJoueur = mot.toUpperCase();

  try {

    const pattern = "?".repeat(motJoueur.length);

    const wikiResponse = await fetch(
      `https://fr.wiktionary.org/w/api.php?action=query&titles=${motJoueur.toLowerCase()}&format=json&origin=*`
    );

    const wikiData = await wikiResponse.json();

    const pages = wikiData.query.pages;

    const pageId = Object.keys(pages)[0];

    const motExiste = pageId !== "-1";

    if (!motExiste) {
      return res.status(400).json({
        message: "Ce mot n'existe pas"
      });
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
      const motSecret = partie.mot_secret.toUpperCase();
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

          if (!victoire) {

            return res.json({
              message: defaite ? "Partie perdue" : "Mot accepté",
              mot: motJoueur,
              resultat,
              nb_tentatives: nbTentatives,
              victoire,
              defaite,
              score: 0,
              mot_secret: defaite ? motSecret : undefined
            });

          }

          const updateJoueurSql = `
            UPDATE joueur
            SET score_total = COALESCE(score_total, 0) + ?
            WHERE id = ?
          `;

          connection.query(
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