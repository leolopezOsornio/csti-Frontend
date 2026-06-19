import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPen, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import adminPanelService from '../../../../services/AdminPanel.service';
import { getUserInitials } from '../../../../utils/userDisplay';
import UserModal from './UserModal';
import styles from './Users.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminPanelService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // Estaba activo, lo desactivamos (Soft Delete)
        await adminPanelService.deactivateUser(id);
      } else {
        // Estaba inactivo, lo activamos
        await adminPanelService.updateUser(id, { is_active: true });
      }
      fetchUsers(); // Recargar lista
    } catch (error) {
      console.error("Error al cambiar estado de usuario:", error);
    }
  };

  const handleOpenCreateModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      if (userToEdit) {
        await adminPanelService.updateUser(userToEdit.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          userprofile: { role: formData.role }
        });
      } else {
        await adminPanelService.createUser(formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error al procesar usuario:", error);
      alert("Error al procesar la solicitud. Revisa los datos.");
    }
  };

  const filteredUsers = users.filter((u: any) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toString().includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && users.length === 0) {
    return <div className={styles.loadingContainer}>Cargando usuarios...</div>;
  }

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.addBtn} onClick={handleOpenCreateModal}>
            <FontAwesomeIcon icon={faPlus} /> Nuevo Usuario
          </button>
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
            {filteredUsers.map((user: any) => (
              <tr key={user.id}>
                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>#{user.id}</td>
                <td>
                  <div className={styles.userInfo}>
                    <span className={styles.avatar} aria-hidden="true">
                      {getUserInitials(user.first_name, user.last_name, user.email)}
                    </span>
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>{user.first_name} {user.last_name}</span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{formatDate(user.date_joined)}</td>
                <td>
                  <span className={`${styles.pill} ${user.role === 'admin' ? styles.pillAdmin : styles.pillCliente
                    }`}>
                    {user.role === 'admin' ? 'Admin' : 'Cliente'}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{user.pedidos_count} pedidos</td>
                <td>
                  <div className={styles.statusLabel}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={user.is_active}
                        onChange={() => handleToggleActive(user.id, user.is_active)}
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
                    <button
                      className={styles.actionBtn}
                      title="Editar"
                      onClick={() => handleOpenEditModal(user)}
                    >
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

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        userToEdit={userToEdit}
      />
    </div>
  );
};

export default Users;
