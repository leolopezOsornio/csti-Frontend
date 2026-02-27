// src/pages/auth/Login/Login.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Auth.module.css';
import logoCsti from '../../../assets/img/logo_csti.png';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>

      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`}>
        <Link to="/home">
          <img src={logoCsti} alt="CSTI Logo" className={styles['auth-logo']} />
        </Link>

        <h1>Bienvenido de nuevo</h1>

        <form className={styles['auth-form']}>
          <div className={styles['form-group']}>
            <label htmlFor="login_email" className={styles['form-label']}>Correo Electrónico</label>
            <input type="email" id="login_email" name="email" className={styles['form-input']} placeholder="ejemplo@csti.com" required />
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

          <button type="submit" className={`${styles['btn-auth']} ${styles['btn-dark']}`}>Ingresar</button>
        </form>

        <p className={styles['auth-footer']}>
          ¿No tienes cuenta? <Link to="/registro" className={styles['link-cyan']}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;