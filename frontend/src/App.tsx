import './App.css'
import Game from './components/Game';
import Logo from './assets/logo.png';

import {
  useState
} from 'react';

import {
  Routes,
  Route,
  useNavigate
} from 'react-router-dom';

import Home from './components/Home';

function AuthPage() {

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(false);

  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if(password !== confirmPassword){
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {

      const response = await fetch(
        'http://localhost:3000/register',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            pseudo,
            email,
            password
          })
        }
      );

      const data = await response.json();

      alert(data.message);

    } catch(error){
      console.log(error);
    }

  };

  const handleLogin = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      const response = await fetch(
        'http://localhost:3000/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if(data.token){

        localStorage.setItem(
          'token',
          data.token
        );

        navigate('/home');

      } else {

        alert(data.message);

      }

    } catch(error){
      console.log(error);
    }

  };

  return (

    <div className="container">

      <div className="overlay">

        <img
          src={Logo}
          alt="logo"
          className="logo"
        />

        <h1>
          {
            isLogin
            ?
            'CONNEXION'
            :
            'INSCRIPTION'
          }
        </h1>

        {

          !isLogin ? (

            <form
              className="register-form"
              onSubmit={handleRegister}
            >

              <div className="input-group">

                <label>Pseudo :</label>

                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) =>
                    setPseudo(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>Adresse Email :</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Choisir un mot de passe :
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Confirmer le mot de passe :
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />

              </div>

              <button type="submit">
                INSCRIPTION
              </button>

            </form>

          ) : (

            <form
              className="register-form"
              onSubmit={handleLogin}
            >

              <div className="input-group">

                <label>Adresse Email :</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>Mot de passe :</label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

              </div>

              <button type="submit">
                CONNEXION
              </button>

            </form>

          )

        }

        <p className="login-link">

          {

            !isLogin

            ?

            <>

              Si vous avez déjà un compte

              <span
                onClick={() => setIsLogin(true)}
              >
                cliquez ici
              </span>

            </>

            :

            <>

              Pas encore de compte ?

              <span
                onClick={() => setIsLogin(false)}
              >
                inscription
              </span>

            </>

          }

        </p>

      </div>

    </div>

  )

}

function App() {

  return (


      <Routes>

        <Route
          path="/"
          element={<AuthPage />}
        />

        <Route
          path="/home"
          element={<Home />}
        />

        <Route
          path="/game"
          element={<Game />}
        />

      </Routes>


  )

}

export default App;