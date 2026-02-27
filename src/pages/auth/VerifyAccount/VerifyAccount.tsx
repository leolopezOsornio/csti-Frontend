// src/pages/auth/VerifyAccount/VerifyAccount.tsx
import styles from '../Auth.module.css';

const VerifyAccount = () => {
  // TODO: Este email lo traeremos del estado global o de los parámetros de la ruta más adelante
  const userEmail = "ejemplo@csti.com";

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>
      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`}>
        
        <div className={styles['auth-icon-circle']}>
          <i className="fi fi-br-envelope"></i>
        </div>
        
        <div className={styles['auth-header']}>
          <h3 className={styles['auth-title']}>Ingresa tu código</h3>
          <p className={styles['auth-subtitle']}>
            Hemos enviado un código de 6 dígitos a <br />
            <strong>{userEmail}</strong>
          </p>
        </div>

        <form className={styles['auth-form']}>
          <div className={styles['form-group']}>
            <input 
              type="text" 
              name="codigo" 
              className={`${styles['form-input']} ${styles['code-input']}`} 
              placeholder="123456" 
              maxLength={6} 
              required 
            />
          </div>
          <button type="submit" className={`${styles['btn-cyan']} ${styles['btn-auth']}`}>
            Verificar Código
          </button>
          
          <div className={styles['resend-container']}>
            ¿No llegó? <button type="button" className={styles['btn-resend']}>Reenviar Código</button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default VerifyAccount;