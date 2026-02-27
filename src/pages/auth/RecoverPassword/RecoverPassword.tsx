// src/pages/auth/RecoverPassword/RecoverPassword.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Auth.module.css';

const RecoverPassword = () => {
  // Estado para controlar en qué paso de la recuperación estamos (1, 2 o 3)
  const [step, setStep] = useState(1);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // TODO: Este email lo guardaremos cuando el usuario pase el paso 1
  const userEmail = "ejemplo@csti.com";

  // Funciones temporales para simular el avance de pasos
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>
      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`}>
        
        {/* Botón de cerrar para volver al Login o Home */}
        <div style={{ position: 'absolute', top: '15px', right: '20px' }}>
          <Link to="/login" style={{ color: '#999', fontSize: '1.2rem' }}>
            <i className="fi fi-br-cross-small"></i>
          </Link>
        </div>

        <h2 className={styles['auth-title']}>Recuperar Contraseña</h2>

        {/* --- Indicador de Pasos --- */}
        <div className={styles['step-container']}>
          <div className={`${styles['step-item']} ${step >= 1 ? styles.active : ''}`}>
            <i className="fi fi-br-envelope"></i> <span>Email</span>
          </div>
          <div className={`${styles['step-line']} ${step >= 2 ? styles.active : ''}`}></div>
          
          <div className={`${styles['step-item']} ${step >= 2 ? styles.active : ''}`}>
            <i className="fi fi-br-shield-check"></i> <span>Código</span>
          </div>
          <div className={`${styles['step-line']} ${step >= 3 ? styles.active : ''}`}></div>
          
          <div className={`${styles['step-item']} ${step >= 3 ? styles.active : ''}`}>
            <i className="fi fi-br-lock"></i> <span>Nueva</span>
          </div>
        </div>

        {/* --- PASO 1: Ingresar Correo --- */}
        {step === 1 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}>
              <i className="fi fi-br-envelope"></i>
            </div>
            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>Ingresa tu correo electrónico para recibir el código de verificación.</p>
            </div>
            <form onSubmit={handleNextStep} className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Correo Electrónico</label>
                <input type="email" name="email" className={styles['form-input']} placeholder="ejemplo@correo.com" required />
              </div>
              <button type="submit" className={`${styles['btn-cyan']} ${styles['btn-auth']}`}>Enviar Código</button>
            </form>
          </div>
        )}

        {/* --- PASO 2: Verificar Código --- */}
        {step === 2 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}>
              <i className="fi fi-br-shield-check"></i>
            </div>
            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>
                Ingresa el código de 6 dígitos enviado a <br />
                <strong>{userEmail}</strong>
              </p>
            </div>
            <form onSubmit={handleNextStep} className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={`${styles['form-label']} ${styles['text-center']}`}>Código de Verificación</label>
                <input type="text" name="codigo" className={`${styles['form-input']} ${styles['code-input']}`} placeholder="123456" maxLength={6} required />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePrevStep} className={`${styles['btn-link']} ${styles['btn-auth']}`} style={{ flex: 1 }}>Volver</button>
                <button type="submit" className={`${styles['btn-cyan']} ${styles['btn-auth']}`} style={{ flex: 1 }}>Verificar</button>
              </div>

              <div className={styles['resend-container']}>
                ¿No recibiste el código? <button type="button" className={styles['btn-resend']}>Reenviar</button>
              </div>
            </form>
          </div>
        )}

        {/* --- PASO 3: Nueva Contraseña --- */}
        {step === 3 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}>
              <i className="fi fi-br-lock"></i>
            </div>
            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>Crea una nueva contraseña segura para tu cuenta.</p>
            </div>
            <form className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Nueva Contraseña</label>
                <div className={styles['password-wrapper']}>
                  <input type={showPassword1 ? "text" : "password"} className={styles['form-input']} placeholder="Nueva contraseña" minLength={8} required />
                  <i className={`fi ${showPassword1 ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`} onClick={() => setShowPassword1(!showPassword1)}></i>
                </div>
              </div>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Confirmar Contraseña</label>
                <div className={styles['password-wrapper']}>
                  <input type={showPassword2 ? "text" : "password"} className={styles['form-input']} placeholder="Repite la contraseña" required />
                  <i className={`fi ${showPassword2 ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`} onClick={() => setShowPassword2(!showPassword2)}></i>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePrevStep} className={`${styles['btn-link']} ${styles['btn-auth']}`} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className={`${styles['btn-dark']} ${styles['btn-auth']}`} style={{ flex: 1 }}>Cambiar Contraseña</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecoverPassword;