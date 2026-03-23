// src/pages/Profile/components/MyProfile/MyProfile.tsx
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faMapLocationDot, faLock, faUserPen } from '@fortawesome/free-solid-svg-icons';

import { profileService } from '../../../../services/profileService';
import { CartContext } from '../../../../contexts/CartContext';
import { WishlistContext } from '../../../../contexts/WishlistContext';

const MyProfile = () => {
  const navigate = useNavigate();
  const { cartItemsCount } = useContext(CartContext);
  const { wishlistIds } = useContext(WishlistContext);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  // Estados para el formulario personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Estados para el cambio de contraseña
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 1. Cargar datos al inicio
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

  // 2. Manejador: Guardar Datos Personales
  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileService.updateProfile({ first_name: firstName, last_name: lastName, telefono: phone });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Perfil actualizado', showConfirmButton: false, timer: 2000 });
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo actualizar', 'error');
    }
  };

  // 3. Manejador: Cambiar Contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'Las nuevas contraseñas no coinciden', 'error');
      return;
    }
    
    try {
      await profileService.changePassword({ old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword });
      Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada por seguridad.', 'success');
      // Limpiar formulario
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      const errMsgs = error.response?.data?.errores || [error.response?.data?.error] || ['Ocurrió un error'];
      Swal.fire('Error de seguridad', errMsgs.join('<br/>'), 'error');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando panel de control... ⏳</div>;
  if (!profileData) return null;

  return (
    <div className="dashboard-container">
      
      {/* SECCIÓN 1: ENCABEZADO Y RESUMEN */}
      <div className="dashboard-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#212529', marginBottom: '5px' }}>
          Hola, {profileData.first_name || profileData.email.split('@')[0]} 👋
        </h1>
        <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>Miembro desde {profileData.miembro_desde}</p>
      </div>

      <div className="dashboard-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* Accesos Rápidos */}
        <button onClick={() => navigate('/carrito')} className="dash-card" style={cardStyle}>
          <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: '2rem', color: '#00b4d8', marginBottom: '10px' }} />
          <h3>Mi Carrito</h3>
          {cartItemsCount > 0 ? <span style={badgeCyanStyle}>{cartItemsCount} artículos pendientes</span> : <span style={badgeGrayStyle}>Vacío</span>}
        </button>

        <button onClick={() => navigate('/perfil/deseos')} className="dash-card" style={cardStyle}>
          <FontAwesomeIcon icon={faHeart} style={{ fontSize: '2rem', color: '#ff4757', marginBottom: '10px' }} />
          <h3>Mis Deseos</h3>
          {wishlistIds.length > 0 ? <span style={badgeRedStyle}>{wishlistIds.length} productos guardados</span> : <span style={badgeGrayStyle}>Vacío</span>}
        </button>

        <button onClick={() => navigate('/perfil/direcciones')} className="dash-card" style={cardStyle}>
          <FontAwesomeIcon icon={faMapLocationDot} style={{ fontSize: '2rem', color: '#2ed573', marginBottom: '10px' }} />
          <h3>Direcciones</h3>
          <span style={badgeGrayStyle}>Gestionar mis envíos</span>
        </button>

      </div>

      {/* SECCIÓN 2 Y 3: FORMULARIOS (Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* Formulario Personal */}
        <div className="order-card" style={{ padding: '25px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <FontAwesomeIcon icon={faUserPen} style={{ color: '#00b4d8' }}/> Información Personal
          </h2>
          
          <form onSubmit={handleUpdatePersonal}>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Correo Electrónico (No editable)</label>
              <input type="email" value={profileData.email} disabled style={{ ...inputStyle, backgroundColor: '#e9ecef', color: '#6c757d', cursor: 'not-allowed' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre(s)</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Apellidos</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Teléfono de Contacto</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 dígitos" style={inputStyle} />
            </div>

            <button type="submit" className="btn-add-cart-lg" style={{ width: '100%' }}>Guardar Cambios</button>
          </form>
        </div>

        {/* Formulario de Seguridad */}
        <div className="order-card" style={{ padding: '25px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
             <FontAwesomeIcon icon={faLock} style={{ color: '#dc3545' }}/> Seguridad
          </h2>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Contraseña Actual</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required placeholder="Requerido por seguridad" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Nueva Contraseña</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Confirmar Nueva Contraseña</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Vuelve a escribir la nueva contraseña" style={inputStyle} />
            </div>

            <button type="submit" className="btn-add-cart-lg" style={{ width: '100%', backgroundColor: '#dc3545' }}>Actualizar Contraseña</button>
          </form>
        </div>

      </div>

    </div>
  );
};

// --- Estilos Inline Temporales (Puedes moverlos a tu CSS) ---
const cardStyle = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eee', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };
const badgeCyanStyle = { backgroundColor: '#e0f7fa', color: '#00b4d8', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 };
const badgeRedStyle = { backgroundColor: '#ffeaa7', color: '#ff4757', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 };
const badgeGrayStyle = { backgroundColor: '#f8f9fa', color: '#6c757d', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#495057', marginBottom: '5px', fontWeight: 500 };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' };

export default MyProfile;