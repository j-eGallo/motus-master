import './game.css';
import Logo from '../assets/logo.png';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Game() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [word, setWord] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleChange = (value: string) => {
    const cleanValue = value
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 6);

    setWord(cleanValue);
  };

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

      <select className="difficulty-select">
        <option>Facile</option>
        <option>Moyen</option>
        <option>Difficile</option>
      </select>

      <div className="game-grid">
        {Array.from({ length: 36 }).map((_, index) => (
          <div
            className="game-cell"
            key={index}
          />
        ))}
      </div>

      <input
        className="word-input-hidden"
        value={word}
        onChange={(e) => handleChange(e.target.value)}
        autoFocus
      />

      <div className="word-lines">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="letter-line"
            key={index}
          >
            {word[index] || ''}
          </div>
        ))}
      </div>

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