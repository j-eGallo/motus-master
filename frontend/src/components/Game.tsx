import './game.css';
import Logo from '../assets/logo.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Game() {

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [word, setWord] = useState('');
  const [difficulty, setDifficulty] = useState('Moyen');

  const wordLength =
    difficulty === 'Facile'
      ? 4
      : difficulty === 'Moyen'
      ? 6
      : 10;

  const handleLogout = () => {

    localStorage.removeItem('token');
    navigate('/');

  };

  const handleChange = (value: string) => {

    const cleanValue = value
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, wordLength);

    setWord(cleanValue);

  };

  useEffect(() => {

    const createGame = async () => {

      try {

        const token = localStorage.getItem('token');

        const response = await fetch(
          'http://localhost:3000/partie',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
              niveau_difficulte: difficulty
            })
          }
        );

        const data = await response.json();

        console.log(data);

      } catch(error){

        console.log(error);

      }

    };

    createGame();

  }, [difficulty]);

  return (

    <div className="game-container">

      {menuOpen && (

        <div
          className="overlay-menu"
          onClick={() => setMenuOpen(false)}
        >

          <div
            className="side-menu"
            onClick={(e) => e.stopPropagation()}
          >

            <div
              className="close-btn"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Déconnexion
            </button>

          </div>

        </div>

      )}

      <div className="top-bar">

        <img
          src={Logo}
          alt="logo"
          className="home-logo"
        />

        <div
          className="burger"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </div>

      </div>

      <select
        className="difficulty-select"
        value={difficulty}
        onChange={(e) => {

          setDifficulty(e.target.value);
          setWord('');

        }}
      >

        <option>Facile</option>
        <option>Moyen</option>
        <option>Difficile</option>

      </select>

      <div
        className="game-grid"
        style={{
          gridTemplateColumns: `repeat(${wordLength}, auto)`
        }}
      >

        {Array.from({
          length: wordLength * 6
        }).map((_, index) => (

          <div
            className="game-cell"
            key={index}
          />

        ))}

      </div>

      <input
        type="text"
        value={word}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tape ton mot ici"
        style={{
          display: 'block',
          margin: '20px auto',
          padding: '10px',
          fontSize: '20px',
          width: '250px'
        }}
      />

      <div className="word-lines">

        {Array.from({
          length: wordLength
        }).map((_, index) => (

          <div
            className="letter-line"
            key={index}
          >
            {word[index] || ''}
          </div>

        ))}

      </div>

      <p
        style={{
          color: 'white',
          textAlign: 'center',
          fontSize: '24px'
        }}
      >
        {word}
      </p>

      <button className="validate-word-btn">
        Entrez votre mot
      </button>

      <button
        className="quit-btn"
        onClick={() => navigate('/home')}
      >
        Quitter
      </button>

    </div>

  );

}

export default Game;