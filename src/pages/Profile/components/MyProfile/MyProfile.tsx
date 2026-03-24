import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCartShopping,
  faHeart,
  faMapLocationDot,
  faLock,
  faUserPen,
} from '@fortawesome/free-solid-svg-icons';
import { profileService } from '../../../../services/profileService';
import { CartContext } from '../../../../contexts/CartContext';
import { WishlistContext } from '../../../../contexts/WishlistContext';
import styles from './MyProfile.module.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const { cartItemsCount } = useContext(CartContext);
  const { wishlistIds } = useContext(WishlistContext);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setProfileData(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setPhone(data.perfil?.telefono || '');
      } catch (error) {
        Swal.fire('Error', 'No se pudo cargar la información del perfil', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        telefono: phone,
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Perfil actualizado',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo actualizar', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'Las nuevas contraseñas no coinciden', 'error');
      return;
    }

    try {
      await profileService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada por seguridad.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errMsgs =
        error.response?.data?.errores ||
        [error.response?.data?.error] ||
        ['Ocurrió un error'];

      Swal.fire('Error de seguridad', errMsgs.join('<br/>'), 'error');
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando panel de control... ⏳</div>;
  }

  if (!profileData) return null;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.pageTitle}>
          Hola, {profileData.first_name || profileData.email.split('@')[0]} 👋
        </h1>
        <p className={styles.memberSince}>
          Miembro desde {profileData.miembro_desde}
        </p>
      </div>

      <div className={styles.dashboardCardsGrid}>
        <button
          onClick={() => navigate('/carrito')}
          className={styles.dashCard}
          type="button"
        >
          <FontAwesomeIcon icon={faCartShopping} className={styles.cardIconCyan} />
          <h3 className={styles.dashCardTitle}>Mi Carrito</h3>
          {cartItemsCount > 0 ? (
            <span className={`${styles.badge} ${styles.badgeCyan}`}>
              {cartItemsCount} artículos pendientes
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeGray}`}>Vacío</span>
          )}
        </button>

        <button
          onClick={() => navigate('/perfil/deseos')}
          className={styles.dashCard}
          type="button"
        >
          <FontAwesomeIcon icon={faHeart} className={styles.cardIconRed} />
          <h3 className={styles.dashCardTitle}>Mis Deseos</h3>
          {wishlistIds.length > 0 ? (
            <span className={`${styles.badge} ${styles.badgeRed}`}>
              {wishlistIds.length} productos guardados
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeGray}`}>Vacío</span>
          )}
        </button>

        <button
          onClick={() => navigate('/perfil/direcciones')}
          className={styles.dashCard}
          type="button"
        >
          <FontAwesomeIcon icon={faMapLocationDot} className={styles.cardIconGreen} />
          <h3 className={styles.dashCardTitle}>Direcciones</h3>
          <span className={`${styles.badge} ${styles.badgeGray}`}>
            Gestionar mis envíos
          </span>
        </button>
      </div>

      <div className={styles.formsGrid}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            <FontAwesomeIcon icon={faUserPen} className={styles.titleIconCyan} />
            Información Personal
          </h2>

          <form onSubmit={handleUpdatePersonal}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Correo Electrónico (No editable)</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className={`${styles.inputDisabled} input`}
              />
            </div>

            <div className={styles.twoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nombre(s)</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Apellidos</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="input"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Teléfono de Contacto</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10 dígitos"
                className="input"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </form>
        </div>

        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            <FontAwesomeIcon icon={faLock} className={styles.titleIconRed} />
            Seguridad
          </h2>

          <form onSubmit={handleChangePassword}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Contraseña Actual</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Requerido por seguridad"
                className="input"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                className="input"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Vuelve a escribir la nueva contraseña"
                className="input"
              />
            </div>

            <button type="submit" className={`${styles.fullWidthBtn} btn`}>
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;