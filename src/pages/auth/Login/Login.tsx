import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from '../Auth.module.css';
import logoFasterClick from '../../../assets/img/Fasterclick1.png';
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
      // login() ahora retorna el perfil completo
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
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>

      <div className={`${styles['auth-card']} animate__animated animate__fadeInUp`}>
        <Link to="/home">
          <img
            src={logoFasterClick}
            alt="Faster Click Logo"
            className={styles['auth-logo']}
          />
        </Link>

        <h1>Bienvenido de nuevo</h1>

        {errorMensaje && (
          <p className={styles['auth-subtitle']} style={{ color: '#dc3545', marginBottom: '16px' }}>
            {errorMensaje}
          </p>
        )}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label htmlFor="login_email" className={styles['form-label']}>
              Correo Electrónico
            </label>
            <input
              type="email"
              id="login_email"
              name="email"
              className={styles['form-input']}
              placeholder="ejemplo@fasterclick.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="login_pass" className={styles['form-label']}>
              Contraseña
            </label>

            <div className={styles['password-wrapper']}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login_pass"
                name="password"
                className={styles['form-input']}
                placeholder="Ingresa tu contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <i
                className={`fi ${showPassword ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`}
                onClick={togglePassword}
              ></i>
            </div>
          </div>

          <div className={styles['auth-actions']}>
            <label className={styles['remember-me']}>
              <input type="checkbox" name="remember" />
              Recordarme
            </label>

            <Link to="/recuperar-password" className={styles['forgot-link']}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            className={`${styles['btn-auth']} ${styles['btn-dark']}`}
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles['auth-footer']}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className={styles['link-cyan']}>
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;