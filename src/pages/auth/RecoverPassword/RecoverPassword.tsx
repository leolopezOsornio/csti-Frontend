// src/pages/auth/RecoverPassword/RecoverPassword.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import styles from '../Auth.module.css';
import { authService } from '../../../services/authService';

const RecoverPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cargando, setCargando] = useState(false);

  // Visibilidad de contraseñas
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Estados para los datos del formulario
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // --- LÓGICA DE VALIDACIÓN VISUAL (Misma que en Registro) ---
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNum = /[0-9]/.test(password);
  const passSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passMatch = password && password === password2;

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? '#28a745' : '#dc3545',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '5px'
  });

  const renderPasswordFeedback = () => {
    if (!password) return null; // No mostrar nada si está vacío

    const faltantes = [];
    if (!passLength) faltantes.push("8 caracteres");
    if (!passUpper) faltantes.push("mayúscula");
    if (!passLower) faltantes.push("minúscula");
    if (!passNum) faltantes.push("número");
    if (!passSpecial) faltantes.push("carácter especial");

    if (faltantes.length === 0) {
      return (
        <span style={reqStyle(true)}>
          <i className="fi fi-br-check"></i> ¡Contraseña segura!
        </span>
      );
    }

    return (
      <span style={reqStyle(false)}>
        <i className="fi fi-br-cross-small"></i> Falta: {faltantes.join(', ')}.
      </span>
    );
  };


  // --- PASO 1: ENVIAR CORREO ---
  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await authService.requestPasswordReset(email);
      setStep(2); // Avanzamos al paso 2
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No pudimos procesar tu solicitud.',
        confirmButtonColor: '#00b8d4',
      });
    } finally {
      setCargando(false);
    }
  };

  // --- PASO 2: VERIFICAR CÓDIGO ---
  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await authService.verifyResetCode(email, codigo);
      setStep(3); // Avanzamos al paso 3
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Código Inválido',
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
      Swal.fire({ icon: 'success', title: 'Reenviado', text: 'Se envió un nuevo código a tu correo.', confirmButtonColor: '#00b8d4' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al reenviar el código.', confirmButtonColor: '#00b8d4' });
    }
  };

  // --- PASO 3: CAMBIAR CONTRASEÑA ---
  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación rápida frontend (evitamos peticiones si la contraseña es insegura o no coincide)
    let frontendErrors = [];
    if (!passLength || !passUpper || !passLower || !passNum || !passSpecial) {
      frontendErrors.push("La contraseña no cumple con los requisitos de seguridad.");
    }
    if (!passMatch) frontendErrors.push("Las contraseñas no coinciden.");

    if (frontendErrors.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Verifica tus datos',
        html: frontendErrors.join('<br>'),
        confirmButtonColor: '#00b8d4',
      });
      return;
    }

    setCargando(true);
    try {
      await authService.resetPassword({ email, codigo, password, password2 });
      
      await Swal.fire({
        icon: 'success',
        title: '¡Contraseña Actualizada!',
        text: 'Tu contraseña ha sido cambiada con éxito.',
        confirmButtonColor: '#00b8d4',
      });
      // Navegamos al login y le pasamos el email para que se autocomplete, igual que en el registro
      navigate('/login', { state: { email: email } }); 

    } catch (error: any) {
      let mensajeError = 'No se pudo actualizar la contraseña.';
      if (error.response?.data?.errores) {
        mensajeError = error.response.data.errores.join('<br>');
      } else if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      }

      Swal.fire({
        icon: 'warning',
        title: 'Contraseña Insegura',
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
        
        {/* Botón de cerrar para volver al Login o Home */}
        <div style={{ position: 'absolute', top: '15px', right: '20px' }}>
          <Link to="/login" style={{ color: '#999', fontSize: '1.2rem' }}>
            <i className="fi fi-br-cross-small"></i>
          </Link>
        </div>

        <h2 className={styles['auth-title']}>Recuperar Contraseña</h2>

        {/* --- Indicador de Pasos --- */}
        <div className={styles['step-container']}>
          <div className={`${styles['step-item']} ${step >= 1 ? styles.active : ''}`}>
            <i className="fi fi-br-envelope"></i> <span>Email</span>
          </div>
          <div className={`${styles['step-line']} ${step >= 2 ? styles.active : ''}`}></div>
          
          <div className={`${styles['step-item']} ${step >= 2 ? styles.active : ''}`}>
            <i className="fi fi-br-shield-check"></i> <span>Código</span>
          </div>
          <div className={`${styles['step-line']} ${step >= 3 ? styles.active : ''}`}></div>
          
          <div className={`${styles['step-item']} ${step >= 3 ? styles.active : ''}`}>
            <i className="fi fi-br-lock"></i> <span>Nueva</span>
          </div>
        </div>

        {/* --- PASO 1: Ingresar Correo --- */}
        {step === 1 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}><i className="fi fi-br-envelope"></i></div>
            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>Ingresa tu correo electrónico para recibir el código de verificación.</p>
            </div>
            <form onSubmit={handleSolicitarCodigo} className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles['form-input']} 
                  placeholder="ejemplo@correo.com" 
                  required 
                />
              </div>
              <button type="submit" className={`${styles['btn-cyan']} ${styles['btn-auth']}`} disabled={cargando}>
                {cargando ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          </div>
        )}

        {/* --- PASO 2: Verificar Código --- */}
        {step === 2 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}><i className="fi fi-br-shield-check"></i></div>
            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>
                Ingresa el código de 6 dígitos enviado a <br /><strong>{email}</strong>
              </p>
            </div>
            <form onSubmit={handleVerificarCodigo} className={styles['auth-form']}>
              <div className={styles['form-group']}>
                <label className={`${styles['form-label']} ${styles['text-center']}`}>Código de Verificación</label>
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
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePrevStep} className={`${styles['btn-link']} ${styles['btn-auth']}`} style={{ flex: 1 }} disabled={cargando}>Volver</button>
                <button type="submit" className={`${styles['btn-cyan']} ${styles['btn-auth']}`} style={{ flex: 1 }} disabled={cargando || codigo.length < 6}>
                  {cargando ? '...' : 'Verificar'}
                </button>
              </div>

              <div className={styles['resend-container']}>
                ¿No recibiste el código? <button type="button" className={styles['btn-resend']} onClick={handleReenviarCodigo}>Reenviar</button>
              </div>
            </form>
          </div>
        )}

        {/* --- PASO 3: Nueva Contraseña --- */}
        {step === 3 && (
          <div className="animate__animated animate__fadeIn">
            <div className={styles['auth-icon-circle']}><i className="fi fi-br-lock"></i></div>
            <div className={styles['auth-header']}>
              <p className={styles['auth-subtitle']}>Crea una nueva contraseña segura para tu cuenta.</p>
            </div>
            <form onSubmit={handleRestablecer} className={styles['auth-form']}>
              <div className={styles['form-group']} style={{ marginBottom: password ? '5px' : '15px' }}>
                <label className={styles['form-label']}>Nueva Contraseña</label>
                <div className={styles['password-wrapper']}>
                  <input 
                    type={showPassword1 ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles['form-input']} 
                    placeholder="Nueva contraseña" 
                    minLength={8} 
                    required 
                  />
                  <i className={`fi ${showPassword1 ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`} onClick={() => setShowPassword1(!showPassword1)}></i>
                </div>
                {/* LÍNEA INTELIGENTE DE RETROALIMENTACIÓN */}
                {renderPasswordFeedback()}
              </div>

              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Confirmar Contraseña</label>
                <div className={styles['password-wrapper']}>
                  <input 
                    type={showPassword2 ? "text" : "password"} 
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className={styles['form-input']} 
                    placeholder="Repite la contraseña" 
                    required 
                  />
                  <i className={`fi ${showPassword2 ? 'fi-br-eye-crossed' : 'fi-br-eye'} ${styles['toggle-password']}`} onClick={() => setShowPassword2(!showPassword2)}></i>
                </div>
                {/* Indicador visual de coincidencia */}
                {password2 && (
                  <span style={reqStyle(!!passMatch)}>
                     <i className={`fi ${passMatch ? 'fi-br-check' : 'fi-br-cross-small'}`}></i>
                     {passMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePrevStep} className={`${styles['btn-link']} ${styles['btn-auth']}`} style={{ flex: 1 }} disabled={cargando}>Volver</button>
                <button type="submit" className={`${styles['btn-dark']} ${styles['btn-auth']}`} style={{ flex: 1 }} disabled={cargando}>
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