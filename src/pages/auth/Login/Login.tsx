import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../Auth.module.css';
import logoFasterClick from '../../../assets/img/Fasterclick1.png';
import { authService } from '../../../services/Auth.service';
import { AuthContext } from '../../../contexts/AuthContext';
import { appAlert, appLoadingToast, appToast, closeAppAlert } from '../../../utils/alerts';

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
      appAlert({
        icon: 'info',
        title: 'Casi listo',
        text: 'Ingresa tu contrasena para acceder a tu nueva cuenta.',
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
    appLoadingToast('Iniciando sesion', 'Estamos validando tus datos.');

    try {
      const data = await authService.login(email, password);
      const profile = await login(data.access);
      const role = profile?.perfil?.role;

      closeAppAlert();
      appToast('success', 'Sesion iniciada', 'Bienvenido de nuevo.');

      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      let message = 'No se pudo iniciar sesion.';

      if (error.response) {
        if (error.response.status === 401) {
          message = 'Contrasena incorrecta.';
        } else if (error.response.status === 404) {
          message = 'El correo no esta registrado.';
        } else if (error.response.status === 403) {
          message = 'Cuenta no verificada. Revisa tu correo.';
        } else {
          message = 'Ocurrio un error al intentar iniciar sesion.';
        }
      } else {
        message = 'Error de conexion con el servidor.';
      }

      setErrorMensaje(message);
      closeAppAlert();
      appToast('error', 'No se pudo iniciar sesion', message);
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
          <p className={styles['auth-subtitle']} style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
            {errorMensaje}
          </p>
        )}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label htmlFor="login_email" className={styles['form-label']}>
              Correo Electronico
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
              Contrasena
            </label>

            <div className={styles['password-wrapper']}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login_pass"
                name="password"
                className={styles['form-input']}
                placeholder="Ingresa tu contrasena"
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
              Olvidaste tu contrasena?
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
          No tienes cuenta?{' '}
          <Link to="/registro" className={styles['link-cyan']}>
            Registrate aqui
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
