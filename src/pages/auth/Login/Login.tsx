import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from '../Auth.module.css';
import logoFasterClick from '../../../assets/img/descarga.png';
import { authService } from '../../../services/Auth.service';
import { AuthContext } from '../../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

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

  useEffect(() => {
    if (location.state?.accountVerified) {
      Swal.fire({
        icon: 'info',
        title: '¡Casi listo!',
        text: 'Ingresa tu contraseña para acceder a tu nueva cuenta.',
        confirmButtonColor: '#0A0A45',
      });

      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');
    setCargando(true);

    try {
      const data = await authService.login(email, password);
      const profile = await login(data.access);
      const role = profile?.perfil?.role;

      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMensaje('Contraseña incorrecta.');
        } else if (error.response.status === 404) {
          setErrorMensaje('El correo no está registrado.');
        } else if (error.response.status === 403) {
          setErrorMensaje('Cuenta no verificada. Revisa tu correo.');
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
    <div className={styles['split-wrapper']}>
      <div className={styles['split-left']}>
        <div className={`${styles['split-left-inner']} animate__animated animate__fadeIn`}>
          <Link to="/home">
            <img
              src={logoFasterClick}
              alt="Faster Click Logo"
              className={styles['split-logo']}
            />
          </Link>

          <h1 className={styles['split-title']}>Bienvenido de nuevo</h1>
          <p className={styles['split-subtitle']}>Por favor, ingrese sus datos</p>

          {errorMensaje && (
            <p style={{ color: '#fc8181', marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem' }}>
              {errorMensaje}
            </p>
          )}

          <form className={styles['split-form']} onSubmit={handleSubmit}>
            <div className={styles['split-form-group']}>
              <label htmlFor="login_email" className={styles['split-label']}>
                Correo Electrónico
              </label>
              <input
                type="email"
                id="login_email"
                name="email"
                className={styles['split-input']}
                placeholder="ejemplo@fasterclick.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles['split-form-group']}>
              <label htmlFor="login_pass" className={styles['split-label']}>
                Contraseña
              </label>

              <div className={styles['split-input-wrapper']}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login_pass"
                  name="password"
                  className={styles['split-input']}
                  placeholder="Ingresa tu contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <i
                  className={`fi ${showPassword ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['split-toggle-password']}`}
                  onClick={togglePassword}
                ></i>
              </div>
            </div>

            <div className={styles['split-actions']}>
              <label className={styles['split-remember']}>
                <input type="checkbox" name="remember" />
                Recordarme
              </label>

              <Link to="/recuperar-password" className={styles['split-forgot']}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className={styles['split-btn']}
              disabled={cargando}
            >
              {cargando ? 'INGRESANDO...' : 'INGRESAR'}
            </button>
          </form>

          <p className={styles['split-footer']}>
            No tienes cuenta?{' '}
            <Link to="/registro">
              Regístrate aquí
            </Link>
          </p>

          <p className={styles['split-terms']}>
            Al continuar, aceptas nuestros <Link to="/terminos">Términos de servicio</Link> y <Link to="/privacidad">Política de privacidad</Link>
          </p>
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

export default Login;