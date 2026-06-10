import './game.css';
import Logo from '../assets/logo.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type LettreResultat = {
  lettre: string;
  statut: 'correct' | 'present' | 'absent';
};

type Tentative = {
  mot: string;
  resultat: LettreResultat[];
};

function Game() {

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [word, setWord] = useState('');
  const [difficulty, setDifficulty] = useState('Moyen');

  const [tentatives, setTentatives] = useState<Tentative[]>([]);
  const [message, setMessage] = useState('');

  const [gameFinished, setGameFinished] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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


  const handleSendWord = async () => {

  if (word.length !== wordLength) {
    setMessage(`Le mot doit faire ${wordLength} lettres`);
    return;
  }

  const id_partie = localStorage.getItem('id_partie');

  try {

    const response = await fetch(
      'http://localhost:3000/sendWord',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          id_partie,
          mot: word
        })
      }
    );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message);
          return;
        }

        setTentatives([
          ...tentatives,
          {
            mot: data.mot,
            resultat: data.resultat
          }
        ]);

        setWord('');

        if (data.victoire) {
      setModalMessage('Vous avez réussi');
      setGameFinished(true);
    }

    if (data.defaite) {
      setModalMessage('Vous avez perdu');
      setGameFinished(true);
    }
    setMessage('');

  } catch(error) {

    console.log(error);

  }

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
        localStorage.setItem(
          'id_partie',
          data.id_partie
        );

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
          setTentatives([]);
          setMessage('');

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
  {Array.from({ length: 6 }).map((_, rowIndex) => (

    Array.from({ length: wordLength }).map((_, colIndex) => {

      const tentative = tentatives[rowIndex];
      const lettreData = tentative?.resultat[colIndex];

      return (
        <div
          className={`game-cell ${lettreData?.statut || ''}`}
          key={`${rowIndex}-${colIndex}`}
        >
          <span>
            {lettreData?.lettre || ''}
          </span>
        </div>
      );

    })

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

      <button
        className="validate-word-btn"
        onClick={handleSendWord}
      >
        Entrez votre mot
      </button>

      <p
      style={{
        color: 'white',
        textAlign: 'center',
        marginTop: '15px'
      }}
    >
      {message}
    </p>

      <button
        className="quit-btn"
        onClick={() => navigate('/home')}
      >
        Quitter
      </button>
      {gameFinished && (
        <div className="end-modal-overlay">
          <div className="end-modal">
            <h2>{modalMessage}</h2>

            <button
              onClick={() => window.location.reload()}
            >
              Relancer une partie
            </button>

            <button
              onClick={() => navigate('/home')}
            >
              Retour Home
            </button>
          </div>
        </div>
      )}
    </div>

  );

}

export default Game;