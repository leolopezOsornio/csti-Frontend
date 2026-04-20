// src/pages/Admin/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGauge, 
  faShoppingBag, 
  faUsers, 
  faHeart, 
  faRightFromBracket 
} from '@fortawesome/free-solid-svg-icons';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <img 
                        src="/img/logo_csti.png" 
                        alt="CSTI Logo" 
                        className={styles.logo} 
                    />
                </div>

                <nav className={styles.nav}>
                    <NavLink 
                        to="/admin" 
                        end
                        className={({ isActive }) => 
                            `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                        }
                    >
                        <FontAwesomeIcon icon={faGauge} className={styles.icon} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink 
                        to="/admin/pedidos" 
                        className={({ isActive }) => 
                            `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                        }
                    >
                        <FontAwesomeIcon icon={faShoppingBag} className={styles.icon} />
                        <span>Pedidos</span>
                    </NavLink>

                    <NavLink 
                        to="/admin/usuarios" 
                        className={({ isActive }) => 
                            `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                        }
                    >
                        <FontAwesomeIcon icon={faUsers} className={styles.icon} />
                        <span>Usuarios</span>
                    </NavLink>

                    <NavLink 
                        to="/admin/intereses" 
                        className={({ isActive }) => 
                            `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                        }
                    >
                        <FontAwesomeIcon icon={faHeart} className={styles.icon} />
                        <span>Intereses</span>
                    </NavLink>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <FontAwesomeIcon icon={faRightFromBracket} className={styles.icon} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
