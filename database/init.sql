-- Initialisation de la base de données Motus Master




CREATE DATABASE IF NOT EXISTS motus_master
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE motus_master;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tentative;
DROP TABLE IF EXISTS partie;
DROP TABLE IF EXISTS joueur;

SET FOREIGN_KEY_CHECKS = 1;




-- Table : joueur
CREATE TABLE joueur (
  id INT NOT NULL AUTO_INCREMENT,
  pseudo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  victoires INT NOT NULL DEFAULT 0,
  defaites INT NOT NULL DEFAULT 0,
  score_total INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





-- Table : partie
CREATE TABLE partie (
  id INT NOT NULL AUTO_INCREMENT,
  id_joueur INT NOT NULL,
  mot_secret VARCHAR(255) NOT NULL,
  duree_partie INT DEFAULT NULL,
  niveau_difficulte ENUM('Facile', 'Moyen', 'Difficile') DEFAULT NULL,
  nb_tentatives INT NOT NULL DEFAULT 0,
  resultat ENUM('reussi', 'perdu') DEFAULT NULL,
  score INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY index_id_joueur (id_joueur),
  CONSTRAINT fk_partie_joueur
    FOREIGN KEY (id_joueur)
    REFERENCES joueur(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- Table : tentative
CREATE TABLE tentative (
  id INT NOT NULL AUTO_INCREMENT,
  id_partie INT NOT NULL,
  mot VARCHAR(255) NOT NULL,
  resultat ENUM('reussi', 'perdu') DEFAULT NULL,
  PRIMARY KEY (id),
  KEY index_id_partie (id_partie),
  CONSTRAINT fk_tentative_partie
    FOREIGN KEY (id_partie)
    REFERENCES partie(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
