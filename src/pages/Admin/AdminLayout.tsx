// src/pages/Admin/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { returnsService } from '../../services/Returns.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGauge,
    faShoppingBag,
    faUsers,
    faHeart,
    faRightFromBracket,
    faUndo
} from '@fortawesome/free-solid-svg-icons';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const data = await returnsService.getAllReturns();
                const activeStates = ['PENDIENTE', 'EN_TRANSITO', 'INSPECCION'];
                const count = data.filter((ret: any) => activeStates.includes(ret.estado)).length;
                setPendingCount(count);
            } catch (error) {
                console.error("Error loading pending returns count");
            }
        };

        fetchPendingCount();

        window.addEventListener('returnsUpdated', fetchPendingCount);
        return () => window.removeEventListener('returnsUpdated', fetchPendingCount);
    }, []);

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
                        src="/img/Fasterclick1.png"
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

                    <NavLink
                        to="/admin/devoluciones"
                        className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                        }
                        style={{ position: 'relative' }}
                    >
                        <FontAwesomeIcon icon={faUndo} className={styles.icon} />
                        <span>Devoluciones</span>
                        {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
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
