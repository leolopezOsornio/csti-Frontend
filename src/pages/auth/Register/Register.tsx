import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../Auth.module.css';
import logoFasterClick from '../../../assets/img/Fasterclick1.png';
import { authService } from '../../../services/Auth.service';
import { usePasswordValidation } from '../../../hooks/usePasswordValidation';
import PasswordFeedback from '../../../components/Passwords/PasswordFeedback';
import { checkEmailTypo } from '../../../utils/emailValidation';
import { appAlert, appLoadingToast, appToast, closeAppAlert } from '../../../utils/alerts';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password2: '',
  });

  const [cargando, setCargando] = useState(false);
  const { isValid: isPasswordValid } = usePasswordValidation(formData.password);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const emailError = checkEmailTypo(formData.email);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email);
  const passMatch = formData.password && formData.password === formData.password2;

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? 'var(--color-success)' : 'var(--color-danger)',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '5px',
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
          text: 'Tu cuenta estaba inactiva. Actualizamos tus datos y enviamos un nuevo codigo.',
        });
      } else {
        await appAlert({
          icon: 'success',
          title: 'Registro exitoso',
          text: 'Te enviamos un codigo de verificacion por correo electronico.',
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
      });
      appToast('error', 'Registro no completado', 'Revisa los datos e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles['auth-wrapper']}>
      <div className={styles['auth-background']}></div>

      <div
        className={`${styles['auth-card']} animate__animated animate__fadeInUp`}
        style={{ maxWidth: '500px' }}
      >
        <Link to="/home">
          <img
            src={logoFasterClick}
            alt="Faster Click Logo"
            className={styles['auth-logo']}
          />
        </Link>

        <h1>Crear Cuenta</h1>

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label htmlFor="id_nombre" className={styles['form-label']}>
                Nombre
              </label>
              <input
                type="text"
                id="id_nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={styles['form-input']}
                required
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="id_apellidos" className={styles['form-label']}>
                Apellidos
              </label>
              <input
                type="text"
                id="id_apellidos"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={styles['form-input']}
                required
              />
            </div>
          </div>

          <div
            className={styles['form-group']}
            style={{ marginBottom: formData.email && !isEmailValid ? '5px' : '15px' }}
          >
            <label htmlFor="id_email" className={styles['form-label']}>
              Correo Electronico
            </label>
            <input
              type="email"
              id="id_email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles['form-input']}
              placeholder="ejemplo@fasterclick.com"
              required
            />

            {emailError && (
              <span style={{
                color: emailError.includes('Quisiste') ? 'var(--color-primary)' : 'var(--color-danger)',
                fontSize: '0.75rem',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <i className={`fi ${emailError.includes('Quisiste') ? 'fi-br-info' : 'fi-br-cross-small'}`}></i>
                {emailError}
              </span>
            )}
          </div>

          <div
            className={styles['form-group']}
            style={{ marginBottom: formData.password ? '5px' : '15px' }}
          >
            <label htmlFor="id_password" className={styles['form-label']}>
              Contrasena
            </label>

            <div className={styles['password-wrapper']}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="id_password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles['form-input']}
                placeholder="Crea una contrasena segura"
                required
              />

              <i
                className={`fi ${showPassword ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`}
                onClick={togglePassword}
              ></i>
            </div>

            <PasswordFeedback password={formData.password} />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="id_password2" className={styles['form-label']}>
              Confirmar Contrasena
            </label>

            <div className={styles['password-wrapper']}>
              <input
                type="password"
                id="id_password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className={styles['form-input']}
                placeholder="Repite tu contrasena"
                required
                disabled={!isPasswordValid}
              />
            </div>

            {formData.password2 && (
              <span style={reqStyle(!!passMatch)}>
                <i className={`fi ${passMatch ? 'fi-br-check' : 'fi-br-cross-small'}`}></i>
                {passMatch ? 'Las contrasenas coinciden' : 'Las contrasenas no coinciden'}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`${styles['btn-auth']} ${styles['btn-cyan']}`}
            disabled={cargando || !isFormValid}
          >
            {cargando ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className={styles['auth-footer']}>
          Ya tienes cuenta?{' '}
          <Link to="/login" className={styles['link-dark']}>
            Inicia sesion aqui
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
