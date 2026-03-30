import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from '../Auth.module.css';
import logoFasterClick from '../../../assets/img/Fasterclick1.png';
import { authService } from '../../../services/authService';
import { usePasswordValidation } from '../../../hooks/usePasswordValidation';
import PasswordFeedback from '../../../components/Passwords/PasswordFeedback';

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

  // Hook de validación robusta
  const { isValid: isPasswordValid } = usePasswordValidation(formData.password);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const passMatch = formData.password && formData.password === formData.password2;

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? '#28a745' : '#dc3545',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '5px',
  });

  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const checkEmailTypo = (email: string) => {
    const commonDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
      'icloud.com', 'live.com', 'msn.com', 'aol.com', 'fasterclick.com'
    ];
    const userDomain = email.split('@').pop()?.toLowerCase() || '';

    if (commonDomains.includes(userDomain)) return null;

    for (const domain of commonDomains) {
      const distance = getLevenshteinDistance(userDomain, domain);
      if (distance >= 1 && distance <= 3) {
        return `Parece un error tipográfico. ¿Quisiste decir @${domain}?`;
      }
    }
    return null;
  };

  // Bloqueo de UX: Formulario completo
  const isFormValid =
    formData.first_name.trim() !== '' &&
    formData.last_name.trim() !== '' &&
    isEmailValid &&
    isPasswordValid &&
    passMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setCargando(true);

    const frontendErrors = [];

    const typoError = checkEmailTypo(formData.email);
    if (typoError) {
      frontendErrors.push(typoError);
    }

    if (frontendErrors.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Verifica tus datos',
        html: frontendErrors.join('<br>'),
        confirmButtonColor: '#00b8d4',
      });
      setCargando(false);
      return;
    }

    try {
      const response = await authService.register(formData);

      if (response.mensaje && response.mensaje.includes('Cuenta inactiva actualizada')) {
        await Swal.fire({
          icon: 'info',
          title: 'Cuenta reactivada',
          text: 'Tu cuenta estaba inactiva. Actualizamos tus datos y enviamos un nuevo código.',
          confirmButtonColor: '#00b8d4',
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Te enviamos un código de verificación por correo electrónico.',
          confirmButtonColor: '#00b8d4',
        });
      }

      navigate('/verificar-cuenta', { state: { email: formData.email } });
    } catch (error: any) {
      let backendErrors = 'Ocurrió un error inesperado al registrar.';

      if (error.response?.data?.errores) {
        backendErrors = error.response.data.errores.join('<br>');
      }

      Swal.fire({
        icon: 'error',
        title: 'No se pudo crear la cuenta',
        html: backendErrors,
        confirmButtonColor: '#00b8d4',
      });
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
              Correo Electrónico
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

            {formData.email && !isEmailValid && (
              <span style={reqStyle(false)}>
                <i className="fi fi-br-cross-small"></i>
                Formato inválido (ej. usuario@dominio.com)
              </span>
            )}
          </div>

          <div
            className={styles['form-group']}
            style={{ marginBottom: formData.password ? '5px' : '15px' }}
          >
            <label htmlFor="id_password" className={styles['form-label']}>
              Contraseña
            </label>

            <div className={styles['password-wrapper']}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="id_password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles['form-input']}
                placeholder="Crea una contraseña segura"
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
              Confirmar Contraseña
            </label>

            <div className={styles['password-wrapper']}>
              <input
                type="password"
                id="id_password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className={styles['form-input']}
                placeholder="Repite tu contraseña"
                required
                disabled={!isPasswordValid}
              />
            </div>

            {formData.password2 && (
              <span style={reqStyle(!!passMatch)}>
                <i className={`fi ${passMatch ? 'fi-br-check' : 'fi-br-cross-small'}`}></i>
                {passMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
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
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className={styles['link-dark']}>
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;