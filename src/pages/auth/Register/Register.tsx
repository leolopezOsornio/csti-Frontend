import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../Auth.module.css';
import { authService } from '../../../services/Auth.service';
import { usePasswordValidation } from '../../../hooks/usePasswordValidation';
import PasswordFeedback from '../../../components/Passwords/PasswordFeedback';
import { checkEmailTypo } from '../../../utils/emailValidation';
import { appAlert, appLoadingToast, appToast, closeAppAlert } from '../../../utils/alerts';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const logoFasterClick = '/img/descarga.png';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password2: '',
  });

  const [cargando, setCargando] = useState(false);
  const { isValid: isPasswordValid } = usePasswordValidation(formData.password);

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

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const emailError = checkEmailTypo(formData.email);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email);
  const passMatch = formData.password && formData.password === formData.password2;

  const reqStyle = (isValid: boolean, isVisible: boolean) => ({
    color: isValid ? 'var(--color-success-feedback, #4ade80)' : 'var(--color-error-feedback, #f87171)',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    maxHeight: isVisible ? '30px' : '0px',
    opacity: isVisible ? 1 : 0,
    marginTop: isVisible ? '5px' : '0px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  });

  const isFormValid =
    formData.first_name.trim() !== '' &&
    formData.last_name.trim() !== '' &&
    !emailError &&
    isPasswordValid &&
    passMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setCargando(true);
    appLoadingToast('Creando cuenta', 'Estamos registrando tus datos.');

    if (emailError) {
      closeAppAlert();
      appAlert({
        icon: 'warning',
        title: 'Verifica tus datos',
        html: emailError,
        confirmButtonColor: '#00b5e2',
      });
      setCargando(false);
      return;
    }

    try {
      const response = await authService.register(formData);
      closeAppAlert();

      if (response.mensaje && response.mensaje.includes('Cuenta inactiva actualizada')) {
        await appAlert({
          icon: 'info',
          title: 'Cuenta reactivada',
          text: 'Tu cuenta estaba inactiva. Actualizamos tus datos y enviamos un nuevo código.',
          confirmButtonColor: '#00b5e2',
        });
      } else {
        await appAlert({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Te enviamos un código de verificación por correo electrónico.',
          confirmButtonColor: '#00b5e2',
        });
      }

      navigate('/verificar-cuenta', { state: { email: formData.email } });
    } catch (error: any) {
      let backendErrors = 'Ocurrio un error inesperado al registrar.';

      if (error.response?.data?.errores) {
        backendErrors = error.response.data.errores.join('<br>');
      }

      closeAppAlert();
      await appAlert({
        icon: 'error',
        title: 'No se pudo crear la cuenta',
        html: backendErrors,
        confirmButtonColor: '#00b5e2',
      });
      appToast('error', 'Registro no completado', 'Revisa los datos e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles['split-wrapper']}>
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

      <div className={styles['split-left']}>
        <div className={`${styles['split-left-inner']} animate__animated animate__fadeIn`}>
          <Link to="/home">
            <img
              src={logoFasterClick}
              alt="Faster Click Logo"
              className={styles['split-logo']}
            />
          </Link>

          <h1 className={styles['split-title']}>Crear Cuenta</h1>
          <p className={styles['split-subtitle']}>Por favor, complete los datos para registrarse</p>

          <form className={styles['split-form']} onSubmit={handleSubmit}>
            <div className={styles['form-row']}>
              <div className={styles['split-form-group']}>
                <label htmlFor="id_nombre" className={styles['split-label']}>
                  Nombre
                </label>
                <input
                  type="text"
                  id="id_nombre"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={styles['split-input']}
                  required
                />
              </div>

              <div className={styles['split-form-group']}>
                <label htmlFor="id_apellidos" className={styles['split-label']}>
                  Apellidos
                </label>
                <input
                  type="text"
                  id="id_apellidos"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={styles['split-input']}
                  required
                />
              </div>
            </div>

            <div
              className={styles['split-form-group']}
              style={{ marginBottom: formData.email && !isEmailValid ? '5px' : '0px' }}
            >
              <label htmlFor="id_email" className={styles['split-label']}>
                Correo Electrónico
              </label>
              <input
                type="email"
                id="id_email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles['split-input']}
                placeholder="ejemplo@fasterclick.com"
                required
              />

              <span style={{ 
                color: emailError?.includes('¿Quisiste') ? 'var(--color-primary, #00b5e2)' : 'var(--color-error-feedback, #f87171)', 
                fontSize: '0.75rem', 
                maxHeight: emailError ? '30px' : '0px',
                opacity: emailError ? 1 : 0,
                marginTop: emailError ? '5px' : '0px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                overflow: 'hidden'
              }}>
                {emailError && (
                  <>
                    <i className={`fi ${emailError.includes('¿Quisiste') ? 'fi-br-info' : 'fi-br-cross-small'}`}></i>
                    {emailError}
                  </>
                )}
              </span>
            </div>

            <div
              className={styles['split-form-group']}
              style={{ marginBottom: formData.password ? '5px' : '0px' }}
            >
              <label htmlFor="id_password" className={styles['split-label']}>
                Contraseña
              </label>

              <div className={styles['split-input-wrapper']}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="id_password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles['split-input']}
                  placeholder="Crea una contraseña segura"
                  required
                />

                <i
                  className={`fi ${showPassword ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['split-toggle-password']}`}
                  onClick={togglePassword}
                ></i>
              </div>

              <PasswordFeedback password={formData.password} />
            </div>

            <div className={styles['split-form-group']}>
              <label htmlFor="id_password2" className={styles['split-label']}>
                Confirmar Contraseña
              </label>

              <div className={styles['split-input-wrapper']}>
                <input
                  type="password"
                  id="id_password2"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className={styles['split-input']}
                  placeholder="Repite tu contraseña"
                  required
                  disabled={!isPasswordValid}
                />
              </div>

              <span style={reqStyle(!!passMatch, !!formData.password2)}>
                <i className={`fi ${passMatch ? 'fi-br-check' : 'fi-br-cross-small'}`}></i>
                {passMatch ? 'Las contrasenas coinciden' : 'Las contrasenas no coinciden'}
              </span>
            </div>

            <button
              type="submit"
              className={styles['split-btn']}
              disabled={cargando || !isFormValid}
            >
              {cargando ? 'REGISTRANDO...' : 'REGISTRARSE'}
            </button>
          </form>

          <p className={styles['split-footer']}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
