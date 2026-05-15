import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../Auth.module.css';
import { authService } from '../../../services/Auth.service';
import { appAlert, appLoadingToast, appToast, closeAppAlert } from '../../../utils/alerts';

const VerifyAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = location.state?.email;

  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      navigate('/registro');
    }
  }, [userEmail, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    appLoadingToast('Verificando codigo', 'Estamos activando tu cuenta.');

    try {
      await authService.verifyRegistration(userEmail, codigo);

      closeAppAlert();
      await appAlert({
        icon: 'success',
        title: 'Cuenta verificada',
        text: 'Tu cuenta ha sido activada correctamente. Ahora puedes iniciar sesion.',
      });

      navigate('/login', { state: { accountVerified: true, email: userEmail } });
    } catch (error: any) {
      const mensajeError =
        error.response?.data?.error || 'El codigo es incorrecto o ha expirado.';

      closeAppAlert();
      await appAlert({
        icon: 'error',
        title: 'Codigo incorrecto',
        text: mensajeError,
      });
    } finally {
      setCargando(false);
    }
  };

  const handleResend = async () => {
    setReenviando(true);
    appLoadingToast('Reenviando codigo', 'Preparando un nuevo correo.');

    try {
      await authService.resendVerificationCode(userEmail);

      closeAppAlert();
      appToast('success', 'Codigo reenviado', `Se envio un nuevo codigo a ${userEmail}`);
    } catch {
      closeAppAlert();
      appToast('error', 'No se pudo reenviar', 'Intenta de nuevo mas tarde.');
    } finally {
      setReenviando(false);
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
          <h3 className={styles['auth-title']}>Ingresa tu codigo</h3>
          <p className={styles['auth-subtitle']}>
            Hemos enviado un codigo de 6 digitos a <br />
            <strong>{userEmail}</strong>
          </p>
        </div>

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

          <button
            type="submit"
            className={`${styles['btn-cyan']} ${styles['btn-auth']}`}
            disabled={cargando || codigo.length < 6}
          >
            {cargando ? 'Verificando...' : 'Verificar Codigo'}
          </button>

          <div className={styles['resend-container']}>
            No llego?{' '}
            <button
              type="button"
              className={styles['btn-resend']}
              onClick={handleResend}
              disabled={reenviando}
            >
              {reenviando ? 'Reenviando...' : 'Reenviar Codigo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyAccount;
