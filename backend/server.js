const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

app.post("/register", async (req, res) => {
  const { pseudo, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const sql = `
    INSERT INTO joueur (pseudo, email, password)
    VALUES (?, ?, ?)
  `;

    connection.query(sql, [pseudo, email, hashedPassword], (err, result) => {
      if (err) {
        console.log(err);

        return res.status(500).json({
          message: "Erreur SQL",
        });
      }
      res.json({
        message: pseudo + " crée",
      });
    });
  } catch {
    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
});

app.post("/login", (req, res) => {

  const {email, password} = req.body;

  const sql = `
    SELECT * FROM joueur 
    WHERE email = ?
  `;

  connection.query(
    sql, 
    [email],

    async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: 'Connexion échouée'
        });
      }  

      if(result.length === 0) {
        return res.status(404).json({
          message: 'Utilisateur inexistant)'
        })
      }

      const joueur = result[0];

      const passwordMatch = await bcrypt.compare(
        password,
        joueur.password
      );

      if(!passwordMatch) {
        return res.status(401).json({
          message: 'Mot de passe incorrect'
        });
      }

      const token = jwt.sign(
        {
          id: joueur.id,
          pseudo: joueur.pseudo
        },

        process.env.JWT_SECRET,

        {
          expiresIn: '24h'
        }
      );

      res.json({
        message:'Connexion réussie',
        token
      });
    }

  
  );

});


app.post('/logout', (req, res) => {

  res.json({
    message: 'Déconnexion réussie'
  });

});


app.post('/partie', async (req, res) => {

  const { niveau_difficulte } = req.body;

  const token = req.headers.authorization?.split(' ')[1];

  if(!token){
    return res.status(401).json({
      message: 'Token manquant'
    });
  }

  try {

    // VERIFICATION TOKEN
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const id_joueur = decoded.id;

    const response = await fetch(
      'https://random-word-api.herokuapp.com/word'
    );

    const data = await response.json();

    const mot_secret = data[0].toUpperCase();

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

        if(err){
          console.log(err);

          return res.status(500).json({
            message: 'Erreur SQL'
          });
        }

        res.json({
          message: 'Partie créée',
          id_partie: result.insertId
        });

      }

    );

  } catch(error){

    console.log(error);

    return res.status(500).json({
      message: 'Erreur serveur'
    });

  }

});




app.post("/logout", (req, res) => {});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
