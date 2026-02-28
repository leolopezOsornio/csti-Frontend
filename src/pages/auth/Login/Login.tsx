// src/pages/auth/Login/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../Auth.module.css';
import logoCsti from '../../../assets/img/logo_csti.png';
import { authService } from '../../../services/authService';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Estados para capturar los inputs y posibles errores
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Función que se ejecuta al presionar "Ingresar"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    setErrorMensaje(''); // Limpiamos errores previos
    setCargando(true);

    try {
      // Llamamos a nuestro servicio
      await authService.login(email, password);
      
      // Si el login fue exitoso, redirigimos al catálogo o home
      navigate('/home'); 

    } catch (error: any) {
      // Manejo de errores basado en las respuestas de Django
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMensaje('Contraseña incorrecta.');
        } else if (error.response.status === 404) {
          setErrorMensaje('El correo no está registrado.');
        } else if (error.response.status === 403) {
          setErrorMensaje('Cuenta no verificada. Revisa tu correo.');
          // Aquí podrías guardar el email en un estado global y redirigir a VerificarCuenta
        } else {
          setErrorMensaje('Ocurrió un error al intentar iniciar sesión.');
        }
      } else {
        setErrorMensaje('Error de conexión con el servidor.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>

      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`}>
        <Link to="/home">
          <img src={logoCsti} alt="CSTI Logo" className={styles['auth-logo']} />
        </Link>

        <h1>Bienvenido de nuevo</h1>

        {/* Mostramos el mensaje de error si existe */}
        {errorMensaje && <p style={{ color: 'red', textAlign: 'center' }}>{errorMensaje}</p>}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label htmlFor="login_email" className={styles['form-label']}>Correo Electrónico</label>
            <input 
              type="email" 
              id="login_email" 
              name="email" 
              className={styles['form-input']} 
              placeholder="ejemplo@csti.com" 
              required 
              value={email} // Vinculamos el estado
              onChange={(e) => setEmail(e.target.value)} // Actualizamos el estado al escribir
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="login_pass" className={styles['form-label']}>Contraseña</label>
            <div className={styles['password-wrapper']}>
              <input 
                type={showPassword ? "text" : "password"} 
                id="login_pass" 
                name="password" 
                className={styles['form-input']} 
                placeholder="••••••••" 
                required 
                value={password} // Vinculamos el estado
                onChange={(e) => setPassword(e.target.value)} // Actualizamos el estado al escribir
              />
              <i 
                className={`fi ${showPassword ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`} 
                onClick={togglePassword}
              ></i>
            </div>
          </div>

          <div className={styles['auth-actions']}>
            <label className={styles['remember-me']}>
              <input type="checkbox" name="remember" /> Recordarme
            </label>
            <Link to="/recuperar-password" className={styles['forgot-link']}>¿Olvidaste tu contraseña?</Link>
          </div>

          {/* Cambiamos el texto del botón si está cargando */}
          <button type="submit" className={`${styles['btn-auth']} ${styles['btn-dark']}`} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles['auth-footer']}>
          ¿No tienes cuenta? <Link to="/registro" className={styles['link-cyan']}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;