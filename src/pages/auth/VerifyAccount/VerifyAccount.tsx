// src/pages/auth/VerifyAccount/VerifyAccount.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // <-- IMPORTAMOS SWEETALERT2
import styles from '../Auth.module.css';
import { authService } from '../../../services/authService';

const VerifyAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const userEmail = location.state?.email;

  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      navigate('/registro');
    }
  }, [userEmail, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      await authService.verifyRegistration(userEmail, codigo);
      
      // ALERTA DE ÉXITO
      await Swal.fire({
        icon: 'success',
        title: '¡Cuenta Verificada!',
        text: 'Tu cuenta ha sido activada correctamente. Ahora puedes iniciar sesión.',
        confirmButtonColor: '#00b8d4', // Color cyan para combinar con tu diseño
      });

      // Redirigimos al login HASTA QUE el usuario cierre la alerta
      navigate('/login', { state: { accountVerified: true, email: userEmail } });

    } catch (error: any) {
      // Imprimimos el error en la consola por si acaso
      console.error("Error capturado al verificar:", error); 

      const mensajeError = error.response?.data?.error || 'El código es incorrecto o ha expirado.';
      
      // Agregamos 'await' para asegurar que la alerta se dibuje antes de seguir
      await Swal.fire({
        icon: 'error',
        title: 'Código Incorrecto',
        text: mensajeError,
        confirmButtonColor: '#00b8d4',
      });
    } finally {
      setCargando(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendVerificationCode(userEmail);
      
      // ALERTA DE ÉXITO AL REENVIAR
      Swal.fire({
        icon: 'success',
        title: 'Código Reenviado',
        text: `Se ha enviado un nuevo código a ${userEmail}`,
        confirmButtonColor: '#00b8d4',
      });
    } catch (error) {
      // ALERTA DE ERROR AL REENVIAR
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al reenviar el código. Intenta de nuevo más tarde.',
        confirmButtonColor: '#00b8d4',
      });
    }
  };

  if (!userEmail) return null; 

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

        {/* Quitamos los divs de HTML que mostrábamos antes para los errores */}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <input 
              type="text" 
              name="codigo" 
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className={`${styles['form-input']} ${styles['code-input']}`} 
              placeholder="123456" 
              maxLength={6} 
              required 
            />
          </div>
          
          <button type="submit" className={`${styles['btn-cyan']} ${styles['btn-auth']}`} disabled={cargando || codigo.length < 6}>
            {cargando ? 'Verificando...' : 'Verificar Código'}
          </button>
          
          <div className={styles['resend-container']}>
            ¿No llegó?{' '}
            <button 
              type="button" 
              className={styles['btn-resend']} 
              onClick={handleResend}
            >
              Reenviar Código
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default VerifyAccount;