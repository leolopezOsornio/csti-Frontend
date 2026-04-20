// src/pages/Admin/components/Users/Users.tsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPen, faEye } from '@fortawesome/free-solid-svg-icons';
import styles from './Users.module.css';

// Mock Data User + UserProfile (coincidiendo con Django)
const initialUsers = [
  { 
    id: '#USR-001', first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com', 
    date_joined: '12 Ene 2026', is_active: true, perfil: { role: 'cliente' }, pedidos_count: 5 
  },
  { 
    id: '#USR-002', first_name: 'Ana', last_name: 'García', email: 'ana@example.com', 
    date_joined: '12 Ene 2026', is_active: true, perfil: { role: 'admin' }, pedidos_count: 2 
  },
  { 
    id: '#USR-003', first_name: 'Carlos', last_name: 'López', email: 'carlos@example.com', 
    date_joined: '12 Ene 2026', is_active: false, perfil: { role: 'cliente' }, pedidos_count: 0 
  },
  { 
    id: '#USR-004', first_name: 'María', last_name: 'Martínez', email: 'maria@example.com', 
    date_joined: '12 Ene 2026', is_active: true, perfil: { role: 'cliente' }, pedidos_count: 2 
  },
  { 
    id: '#USR-005', first_name: 'Roberto', last_name: 'Sánchez', email: 'roberto@example.com', 
    date_joined: '12 Ene 2026', is_active: false, perfil: { role: 'admin' }, pedidos_count: 3 
  },
];

const Users = () => {
  const [users, setUsers] = useState(initialUsers);

  const handleToggleActive = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, is_active: !u.is_active } : u
    ));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o ID..." 
              className={styles.searchInput}
            />
          </div>
        </div>
      </header>

      <section className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Fecha Registro</th>
              <th>Rol</th>
              <th>Pedidos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{user.id}</td>
                <td>
                  <div className={styles.userInfo}>
                    <img 
                      src={`https://i.pravatar.cc/150?u=${user.email}`} 
                      alt={user.first_name} 
                      className={styles.avatar}
                    />
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>{user.first_name} {user.last_name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{user.date_joined}</td>
                <td>
                  <span className={`${styles.pill} ${
                    user.perfil.role === 'admin' ? styles.pillAdmin : styles.pillCliente
                  }`}>
                    {user.perfil.role === 'admin' ? 'Admin' : 'Cliente'}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{user.pedidos_count} pedidos</td>
                <td>
                  <div className={styles.statusLabel}>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={user.is_active} 
                        onChange={() => handleToggleActive(user.id)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span className={user.is_active ? styles.activeText : styles.inactiveText}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Editar">
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button className={styles.actionBtn} title="Ver detalles">
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Users;
