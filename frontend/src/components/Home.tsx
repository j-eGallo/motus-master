import './Home.css';
import Logo from '../assets/logo.png';
import CupLogo from '../assets/cuplogo.png'
import { useState, useEffect } from 'react';

function Home() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [score, setScore] = useState(0);

  const handleLogout = () => {

    localStorage.removeItem('token');

    window.location.reload();

  };

  useEffect(() => {

  const fetchScore = async () => {

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

      <button className="play-btn">
        JOUER
      </button>

      <div className="ranking">

        <h2>Classement des joueurs :</h2>

        {

          [1,2,3,4,5,6,7,8,9,10].map((joueur) => (

            <div
              className="player-row"
              key={joueur}
            >

              <div className="player-left">

                <span className="rank-number">
                  {joueur}
                </span>

                <span>
                  {
                    joueur === 2
                    ?
                    'Vous'
                    :
                    `Joueur ${joueur}`
                  }
                </span>

              </div>

              <div className="score-pill">
                1249 points
              </div>

            </div>

          ))

        }

      </div>

    </div>

  )
}

export default Home;