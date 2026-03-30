// src/pages/auth/RecoverPassword/RecoverPassword.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from '../Auth.module.css';
import { authService } from '../../../services/authService';
import { usePasswordValidation } from '../../../hooks/usePasswordValidation';
import PasswordFeedback from '../../../components/Passwords/PasswordFeedback';
import { checkEmailTypo } from '../../../utils/emailValidation';

const RecoverPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [cargando, setCargando] = useState(false);

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // Validación robusta
  const { isValid: isPasswordValid } = usePasswordValidation(password);
  const passMatch = password && password === password2;

  const emailError = checkEmailTypo(email);

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? '#28a745' : '#dc3545',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '5px',
  });

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailError) {
      Swal.fire({
        icon: 'warning',
        title: 'Verifica tu correo',
        text: emailError,
        confirmButtonColor: '#00b8d4',
      });
      return;
    }

    setCargando(true);

    try {
      await authService.requestPasswordReset(email);
      // Siempre mostramos éxito aunque el usuario no exista (pérdida de enumeración)
      Swal.fire({
        icon: 'info',
        title: 'Solicitud enviada',
        text: 'Si el correo ingresado está registrado en nuestro sistema, recibirás un código de verificación en breve.',
        confirmButtonColor: '#00b8d4',
      });
      setStep(2);
    } catch (error: any) {
      // En caso de error técnico real (no de usuario no encontrado)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema técnico. Intenta más tarde.',
        confirmButtonColor: '#00b8d4',
      });
    } finally {
      setCargando(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      await authService.verifyResetCode(email, codigo);
      setStep(3);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Código inválido',
        text: error.response?.data?.error || 'El código es incorrecto o ha expirado.',
        confirmButtonColor: '#00b8d4',
      });
    } finally {
      setCargando(false);
    }
  };

  const handleReenviarCodigo = async () => {
    try {
      await authService.requestPasswordReset(email);
      Swal.fire({
        icon: 'success',
        title: 'Reenviado',
        text: 'Se envió un nuevo código a tu correo.',
        confirmButtonColor: '#00b8d4',
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al reenviar el código.',
        confirmButtonColor: '#00b8d4',
      });
    }
  };

  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid || !passMatch) return;

    setCargando(true);

    try {
      await authService.resetPassword({ email, codigo, password, password2 });

      await Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña ha sido cambiada con éxito.',
        confirmButtonColor: '#00b8d4',
      });

      navigate('/login', { state: { email } });
    } catch (error: any) {
      let mensajeError = 'No se pudo actualizar la contraseña.';
      let titulo = 'Contraseña insegura';

      if (error.response?.data?.errores) {
        mensajeError = error.response.data.errores.join('<br>');
      } else if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
        // Si el error es por reutilización, ajustamos el título
        if (mensajeError.toLowerCase().includes('actual') || mensajeError.toLowerCase().includes('anterior')) {
          titulo = 'Contraseña no permitida';
        }
      }

      Swal.fire({
        icon: 'warning',
        title: titulo,
        html: mensajeError,
        confirmButtonColor: '#00b8d4',
      });
    } finally {
      setCargando(false);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>

      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`}>
        <div style={{ position: 'absolute', top: '15px', right: '20px' }}>
          <Link to="/login" style={{ color: '#999', fontSize: '1.2rem' }}>
            <i className="fi fi-br-cross-small"></i>
          </Link>
        </div>

        <h2 className={styles['auth-title']}>Recuperar Contraseña</h2>

        <div className={styles['step-container']}>
          <div className={`${styles['step-item']} ${step >= 1 ? styles.stepActive : ''}`}>
            <i className="fi fi-br-envelope"></i>
            <span>Email</span>
          </div>

          <div className={`${styles['step-line']} ${step >= 2 ? styles.stepLineActive : ''}`}></div>

          <div className={`${styles['step-item']} ${step >= 2 ? styles.stepActive : ''}`}>
            <i className="fi fi-br-shield-check"></i>
            <span>Código</span>
          </div>

          <div className={`${styles['step-line']} ${step >= 3 ? styles.stepLineActive : ''}`}></div>

          <div className={`${styles['step-item']} ${step >= 3 ? styles.stepActive : ''}`}>
            <i className="fi fi-br-lock"></i>
            <span>Nueva</span>
          </div>
        </div>

        {step === 1 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}>
              <i className="fi fi-br-envelope"></i>
            </div>

            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>
                Ingresa tu correo electrónico para recibir el código de verificación.
              </p>
            </div>

            <form onSubmit={handleSolicitarCodigo} className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    // Solo mostramos el Swal si es una sugerencia de typo (contiene "¿Quisiste decir...?")
                    if (emailError && emailError.includes('¿Quisiste decir')) {
                      Swal.fire({
                        icon: 'info',
                        title: '¿Revisamos tu correo?',
                        text: emailError,
                        confirmButtonColor: '#00b8d4',
                      });
                    }
                  }}
                  className={styles['form-input']}
                  placeholder="ejemplo@fasterclick.com"
                  required
                />
                {emailError && (
                  <span style={{ color: emailError.includes('¿Quisiste') ? '#00b8d4' : '#dc3545', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                    <i className={`fi ${emailError.includes('¿Quisiste') ? 'fi-br-info' : 'fi-br-cross-small'}`}></i> {emailError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={`${styles['btn-cyan']} ${styles['btn-auth']}`}
                disabled={cargando || !!emailError}
              >
                {cargando ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}>
              <i className="fi fi-br-shield-check"></i>
            </div>

            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>
                Ingresa el código de 6 dígitos enviado a <br />
                <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerificarCodigo} className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={`${styles['form-label']} ${styles['text-center']}`}>
                  Código de Verificación
                </label>

                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className={`${styles['form-input']} ${styles['code-input']}`}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              <div className={styles['auth-inline-actions']}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`${styles['btn-link']} ${styles['btn-auth']}`}
                  disabled={cargando}
                >
                  Volver
                </button>

                <button
                  type="submit"
                  className={`${styles['btn-cyan']} ${styles['btn-auth']}`}
                  disabled={cargando || codigo.length < 6}
                >
                  {cargando ? '...' : 'Verificar'}
                </button>
              </div>

              <div className={styles['resend-container']}>
                ¿No recibiste el código?{' '}
                <button
                  type="button"
                  className={styles['btn-resend']}
                  onClick={handleReenviarCodigo}
                >
                  Reenviar
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}>
              <i className="fi fi-br-lock"></i>
            </div>

            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>
                Crea una nueva contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleRestablecer} className={styles['auth-form']}>
              <div
                className={styles['form-group']}
                style={{ marginBottom: password ? '5px' : '15px' }}
              >
                <label className={styles['form-label']}>Nueva Contraseña</label>

                <div className={styles['password-wrapper']}>
                  <input
                    type={showPassword1 ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles['form-input']}
                    placeholder="Nueva contraseña"
                    minLength={8}
                    required
                  />

                  <i
                    className={`fi ${showPassword1 ? 'fi-br-eye-crossed' : 'fi-br-eye'
                      } ${styles['toggle-password']}`}
                    onClick={() => setShowPassword1(!showPassword1)}
                  ></i>
                </div>

                <PasswordFeedback password={password} />
              </div>

              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Confirmar Contraseña</label>

                <div className={styles['password-wrapper']}>
                  <input
                    type={showPassword2 ? 'text' : 'password'}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className={styles['form-input']}
                    placeholder="Repite la contraseña"
                    required
                    disabled={!isPasswordValid}
                  />

                  <i
                    className={`fi ${showPassword2 ? 'fi-br-eye-crossed' : 'fi-br-eye'
                      } ${styles['toggle-password']}`}
                    onClick={() => setShowPassword2(!showPassword2)}
                  ></i>
                </div>

                {password2 && (
                  <span style={reqStyle(!!passMatch)}>
                    <i className={`fi ${passMatch ? 'fi-br-check' : 'fi-br-cross-small'}`}></i>
                    {passMatch
                      ? 'Las contraseñas coinciden'
                      : 'Las contraseñas no coinciden'}
                  </span>
                )}
              </div>

              <div className={styles['auth-inline-actions']}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`${styles['btn-link']} ${styles['btn-auth']}`}
                  disabled={cargando}
                >
                  Volver
                </button>

                <button
                  type="submit"
                  className={`${styles['btn-dark']} ${styles['btn-auth']}`}
                  disabled={cargando || !isPasswordValid || !passMatch}
                >
                  {cargando ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoverPassword;