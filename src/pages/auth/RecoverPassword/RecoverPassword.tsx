import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from '../Auth.module.css';
import { authService } from '../../../services/Auth.service';
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

  const logoFasterClick = '/img/descarga.png';

  const carouselSlides = [
    {
      image: '/img/Fondo.png',
      title: 'Velocidad sin límites',
      subtitle: 'La plataforma más rápida y confiable para tus operaciones diarias.',
    },
    {
      image: '/img/Fondo2.png',
      title: 'Control Total',
      subtitle: 'Monitorea y gestiona tus dispositivos y catálogos en tiempo real.',
    },
    {
      image: '/img/Fondo3.jpeg',
      title: 'Innovación Tecnológica',
      subtitle: 'Herramientas de última generación diseñadas para tu crecimiento.',
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const { isValid: isPasswordValid } = usePasswordValidation(password);
  const passMatch = password && password === password2;

  const emailError = checkEmailTypo(email);

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? '#28a745' : '#fc8181',
    fontSize: '0.85rem',
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
      Swal.fire({
        icon: 'info',
        title: 'Solicitud enviada',
        text: 'Si el correo ingresado está registrado en nuestro sistema, recibirás un código de verificación en breve.',
        confirmButtonColor: '#00b8d4',
      });
      setStep(2);
    } catch (error: any) {
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
    <div className={styles['split-wrapper']}>
      <div className={styles['split-left']}>
        <div className={`${styles['split-left-inner']} animate__animated animate__fadeIn`}>
          <div style={{ position: 'absolute', top: '15px', right: '20px' }}>
            <Link to="/login" style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>
              <i className="fi fi-br-cross-small"></i>
            </Link>
          </div>

          <Link to="/home">
            <img
              src={logoFasterClick}
              alt="Faster Click Logo"
              className={styles['split-logo']}
              style={{ width: '90px', marginBottom: '15px' }}
            />
          </Link>

          <h1 className={styles['split-title']}>Recuperar Contraseña</h1>
          <p className={styles['split-subtitle']} style={{ marginBottom: '20px' }}>
            Sigue los pasos para restablecer tu acceso
          </p>

          {/* Stepper adaptado visualmente */}
          <div className={styles['step-container']} style={{ background: 'transparent', boxShadow: 'none', padding: '0', marginBottom: '30px' }}>
            <div className={`${styles['step-item']} ${step >= 1 ? styles.stepActive : ''}`}>
              <i className="fi fi-br-envelope" style={{ color: step >= 1 ? '#00b8d4' : '#64748b' }}></i>
            </div>
            <div className={`${styles['step-line']} ${step >= 2 ? styles.stepLineActive : ''}`} style={{ background: step >= 2 ? '#00b8d4' : '#334155' }}></div>
            <div className={`${styles['step-item']} ${step >= 2 ? styles.stepActive : ''}`}>
              <i className="fi fi-br-shield-check" style={{ color: step >= 2 ? '#00b8d4' : '#64748b' }}></i>
            </div>
            <div className={`${styles['step-line']} ${step >= 3 ? styles.stepLineActive : ''}`} style={{ background: step >= 3 ? '#00b8d4' : '#334155' }}></div>
            <div className={`${styles['step-item']} ${step >= 3 ? styles.stepActive : ''}`}>
              <i className="fi fi-br-lock" style={{ color: step >= 3 ? '#00b8d4' : '#64748b' }}></i>
            </div>
          </div>

          {step === 1 && (
            <div className="animate__animated animate__fadeIn" style={{ width: '100%' }}>
              <form onSubmit={handleSolicitarCodigo} className={styles['split-form']}>
                <div className={styles['split-form-group']}>
                  <label className={styles['split-label']}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => {
                      if (emailError && emailError.includes('¿Quisiste decir')) {
                        Swal.fire({
                          icon: 'info',
                          title: '¿Revisamos tu correo?',
                          text: emailError,
                          confirmButtonColor: '#00b8d4',
                        });
                      }
                    }}
                    className={styles['split-input']}
                    placeholder="ejemplo@fasterclick.com"
                    required
                  />
                  {emailError && (
                    <span style={{ color: emailError.includes('¿Quisiste') ? '#00b8d4' : '#fc8181', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                      <i className={`fi ${emailError.includes('¿Quisiste') ? 'fi-br-info' : 'fi-br-cross-small'}`}></i> {emailError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles['split-btn']}
                  disabled={cargando || !!emailError}
                  style={{ marginTop: '15px' }}
                >
                  {cargando ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate__animated animate__fadeIn" style={{ width: '100%' }}>
              <p style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: '20px' }}>
                Ingresa el código de 6 dígitos enviado a <br />
                <strong style={{ color: '#fff' }}>{email}</strong>
              </p>

              <form onSubmit={handleVerificarCodigo} className={styles['split-form']}>
                <div className={styles['split-form-group']}>
                  <label className={styles['split-label']} style={{ textAlign: 'center' }}>
                    Código de Verificación
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className={styles['split-input']}
                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 'bold' }}
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className={styles['split-btn']}
                    style={{ background: 'transparent', color: '#00b8d4', border: '1px solid #00b8d4', flex: 1 }}
                    disabled={cargando}
                  >
                    VOLVER
                  </button>

                  <button
                    type="submit"
                    className={styles['split-btn']}
                    style={{ flex: 1 }}
                    disabled={cargando || codigo.length < 6}
                  >
                    {cargando ? '...' : 'VERIFICAR'}
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                  ¿No recibiste el código?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#00b8d4', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                    onClick={handleReenviarCodigo}
                  >
                    Reenviar
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate__animated animate__fadeIn" style={{ width: '100%' }}>
              <form onSubmit={handleRestablecer} className={styles['split-form']}>
                <div className={styles['split-form-group']} style={{ marginBottom: password ? '5px' : '15px' }}>
                  <label className={styles['split-label']}>Nueva Contraseña</label>
                  <div className={styles['split-input-wrapper']}>
                    <input
                      type={showPassword1 ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles['split-input']}
                      placeholder="Nueva contraseña"
                      minLength={8}
                      required
                    />
                    <i
                      className={`fi ${showPassword1 ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['split-toggle-password']}`}
                      onClick={() => setShowPassword1(!showPassword1)}
                    ></i>
                  </div>
                  <PasswordFeedback password={password} />
                </div>

                <div className={styles['split-form-group']}>
                  <label className={styles['split-label']}>Confirmar Contraseña</label>
                  <div className={styles['split-input-wrapper']}>
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className={styles['split-input']}
                      placeholder="Repite la contraseña"
                      required
                      disabled={!isPasswordValid}
                    />
                    <i
                      className={`fi ${showPassword2 ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['split-toggle-password']}`}
                      onClick={() => setShowPassword2(!showPassword2)}
                    ></i>
                  </div>
                  {password2 && (
                    <span style={reqStyle(!!passMatch)}>
                      <i className={`fi ${passMatch ? 'fi-br-check' : 'fi-br-cross-small'}`}></i>
                      {passMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className={styles['split-btn']}
                    style={{ background: 'transparent', color: '#00b8d4', border: '1px solid #00b8d4', flex: 1 }}
                    disabled={cargando}
                  >
                    VOLVER
                  </button>

                  <button
                    type="submit"
                    className={styles['split-btn']}
                    style={{ flex: 1 }}
                    disabled={cargando || !isPasswordValid || !passMatch}
                  >
                    {cargando ? 'GUARDANDO...' : 'CAMBIAR'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className={styles['split-right']}>
        {carouselSlides.map((slide, index) => (
          <div
            key={index}
            className={`${styles['carousel-slide']} ${index === activeSlide ? styles['active'] : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className={styles['carousel-overlay']} />
            <div className={styles['carousel-content']}>
              <h2 className={styles['carousel-title']}>{slide.title}</h2>
              <p className={styles['carousel-subtitle']}>{slide.subtitle}</p>
            </div>
          </div>
        ))}
        <div className={styles['carousel-dots']}>
          {carouselSlides.map((_, index) => (
            <span
              key={index}
              className={`${styles['carousel-dot']} ${index === activeSlide ? styles['active'] : ''}`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecoverPassword;
