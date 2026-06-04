import './home.css';
import Logo from '../assets/logo.png';
import CupLogo from '../assets/cuplogo.png'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type JoueurClassement = {
  pseudo: string;
  score_total: number;
};


function Home() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [classement, setClassement] = useState<JoueurClassement[]>([]);
  const navigate = useNavigate();

  
  const handleLogout = () => {

    localStorage.removeItem('token');

    navigate('/');

  };


  useEffect(() => {

    const token = localStorage.getItem('token');

        if(!token){

          navigate('/');

          return;

    }

      const fetchScore = async () => {

      const fetchClassement = async () => {

    try {

      const response = await fetch(
        'http://localhost:3000/classement'
      );

      const data = await response.json();

      setClassement(data);

    } catch(error){

      console.log(error);

    }

  };

  fetchClassement();

    try {

      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:3000/score',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      console.log(data);
      
      setScore(data.score || 0);

    } catch(error){

      console.log(error);

    }

  };

  fetchScore();

}, []);

  return (

    <div className="home-container">

      {

        menuOpen && (

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

        )

      }

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

      <div className="score-container">

        <p>
          Votre score :
          <span className="score-value">
            {' '}
            {score}
             {' '}
            <img
              src={CupLogo}
              alt="cup"
              className="cup-logo"
            />
        </span>
        </p>

      </div>

      <button onClick={() => (navigate('/game'))} className="play-btn">
        JOUER
      </button>

{

  classement.length > 0 && (

    <div className="ranking">

      <h2>
        Classement des joueurs :
      </h2>

      {

        classement.map(
          (joueur: JoueurClassement, index) => (

          <div
            className="player-row"
            key={index}
          >

            <div className="player-left">

              <span className="rank-number">
                {index + 1}
              </span>

              <span>
                {joueur.pseudo}
              </span>

            </div>

            <div className="score-pill">

              {
                joueur.score_total
              }

              {' '}points

            </div>

          </div>

        ))

      }

    </div>

  )

}

    </div>

  )
}

export default Home;