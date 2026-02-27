// src/pages/auth/Register/Register.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Auth.module.css';
import logoCsti from '../../../assets/img/logo_csti.png';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>

      {/* Aquí aplico el inline-style que tenías en tu etiqueta <style> */}
      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`} style={{ maxWidth: '500px' }}>
        <Link to="/home">
          <img src={logoCsti} alt="CSTI Logo" className={styles['auth-logo']} />
        </Link>

        <h1>Crear Cuenta</h1>

        <form className={styles['auth-form']}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label htmlFor="id_nombre" className={styles['form-label']}>Nombre</label>
              <input type="text" id="id_nombre" name="first_name" className={styles['form-input']} placeholder="Tu nombre" required />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="id_apellidos" className={styles['form-label']}>Apellidos</label>
              <input type="text" id="id_apellidos" name="last_name" className={styles['form-input']} placeholder="Tus apellidos" required />
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="id_email" className={styles['form-label']}>Correo Electrónico</label>
            <input type="email" id="id_email" name="email" className={styles['form-input']} placeholder="ejemplo@csti.com" required />
          </div>

          <div className={styles['form-group']} style={{ marginBottom: '5px' }}>
            <label htmlFor="id_password" className={styles['form-label']}>Contraseña</label>
            <div className={styles['password-wrapper']}>
              <input 
                type={showPassword ? "text" : "password"} 
                id="id_password" 
                name="password" 
                className={styles['form-input']} 
                placeholder="Crea una contraseña segura" 
                required 
                minLength={8} 
              />
              <i 
                className={`fi ${showPassword ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`} 
                onClick={togglePassword}
              ></i>
            </div>
          </div>
          
          {/* Mantenemos el estilo inline para los requerimientos como lo tenías */}
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px', marginBottom: '15px', lineHeight: '1.4' }}>
              La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&).
          </p>

          <div className={styles['form-group']}>
            <label htmlFor="id_password2" className={styles['form-label']}>Confirmar Contraseña</label>
            <div className={styles['password-wrapper']}>
              <input type="password" id="id_password2" name="password2" className={styles['form-input']} placeholder="Repite tu contraseña" required />
            </div>
          </div>

          <button type="submit" className={`${styles['btn-auth']} ${styles['btn-cyan']}`}>Registrarse</button>
        </form>

        <p className={styles['auth-footer']}>
          ¿Ya tienes cuenta? <Link to="/login" className={styles['link-dark']}>Inicia Sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;