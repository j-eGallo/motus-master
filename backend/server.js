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






app.post("/logout", (req, res) => {

  res.json({
    message: "Déconnexion réussie"
  });

});





app.post("/partie", async (req, res) => {

  console.log("ROUTE /partie APPELEE");

  const { niveau_difficulte } = req.body;

  const token =
    req.headers.authorization?.split(" ")[1];

  if (!token) {

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

    const pattern = "?".repeat(longueur);

    const response = await fetch(
      `https://api.datamuse.com/words?sp=${pattern}&max=100`
    );

    const data = await response.json();

    console.log("REPONSE API :", data);

    if (!data || data.length === 0) {

      return res.status(500).json({
        message: "Aucun mot trouvé"
      });

    }

    const indexAleatoire =
      Math.floor(
        Math.random() * data.length
      );

    const mot_secret =
      data[indexAleatoire].word.toUpperCase();

    console.log("MOT SECRET :", mot_secret);

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
          mot_secret
        });

      }

    );

  }
  catch (error) {

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


app.listen(PORT, () => {
  console.log(
    "Server running on http://localhost:" + PORT
  );
});