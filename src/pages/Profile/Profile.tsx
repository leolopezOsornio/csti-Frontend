// src/pages/Profile/Profile.tsx
import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHeart } from '@fortawesome/free-regular-svg-icons';
import { faMapLocationDot, faBoxOpen, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import { AuthContext } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="profile-wrapper">
      <div className="profile-grid">
        
        {/* SIDEBAR DE NAVEGACIÓN */}
        <aside className="profile-sidebar">
          <ul className="sidebar-menu">
            <li>
              {/* end asegura que solo sea 'active' en la ruta exacta /perfil */}
              <NavLink to="/perfil" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faUser} /> Mi Perfil
              </NavLink>
            </li>
            <li>
              <NavLink to="/perfil/direcciones" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faMapLocationDot} /> Mis Direcciones
              </NavLink>
            </li>
            <li>
              <NavLink to="/perfil/pedidos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faBoxOpen} /> Mis Pedidos
              </NavLink>
            </li>
            <li>
              <NavLink to="/perfil/deseos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faHeart} /> Lista de Deseos
              </NavLink>
            </li>

            <li className="logout-item">
              <button onClick={logout} className="sidebar-link logout-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Cerrar Sesión
              </button>
            </li>
          </ul>
        </aside>

        {/* CONTENIDO DINÁMICO (Equivalente al block content de Django) */}
        <div className="profile-content">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default Profile;