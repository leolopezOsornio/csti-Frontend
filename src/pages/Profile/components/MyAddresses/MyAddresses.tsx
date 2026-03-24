import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faHouse, faPhone } from '@fortawesome/free-solid-svg-icons';
import { addressService } from '../../../../services/addressService';
import AddressForm from './AddressForm';
import styles from './MyAddresses.module.css';

const MyAddresses = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error al cargar direcciones', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenNew = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: any) => {
    setAddressToEdit(address);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar dirección?',
      text: 'No podrás revertir esta acción.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await addressService.deleteAddress(id);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Dirección eliminada',
            showConfirmButton: false,
            timer: 2000,
          });
          fetchAddresses();
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar la dirección', 'error');
        }
      }
    });
  };

  const handleSetMain = async (id: number) => {
    try {
      await addressService.setMainAddress(id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Asignada como principal',
        showConfirmButton: false,
        timer: 2000,
      });
      fetchAddresses();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando direcciones... ⏳</div>;
  }

  return (
    <div className={styles.myAddressesContainer}>
      <div className={styles.addressesHeader}>
        <h1 className={styles.addressesTitle}>Mis Direcciones</h1>

        <button
          className={`btn btn-primary ${styles.newAddressBtn}`}
          onClick={handleOpenNew}
          type="button"
        >
          <FontAwesomeIcon icon={faPlus} /> Nueva Dirección
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className={styles.emptyAddresses}>
          <FontAwesomeIcon icon={faHouse} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Sin direcciones guardadas</h3>
          <p className={styles.emptyText}>
            Agrega una dirección para agilizar tus futuras compras.
          </p>
        </div>
      ) : (
        <div className={styles.addressesGrid}>
          {addresses.map((addr) => (
            <article
              key={addr.id}
              className={`${styles.addressCard} ${addr.es_principal ? styles.isMain : ''
                }`}
            >
              <div className={styles.addressCardHeader}>
                <h3 className={styles.addressAlias}>{addr.alias}</h3>
                {addr.es_principal && (
                  <span className={styles.addressBadgeMain}>Predeterminada</span>
                )}
              </div>

              <div className={styles.addressName}>{addr.destinatario}</div>

              <div className={styles.addressText}>
                <div>
                  {addr.calle} {addr.numero_exterior}{' '}
                  {addr.numero_interior && `Int. ${addr.numero_interior}`}
                </div>
                <div>
                  {addr.colonia}, C.P. {addr.codigo_postal}
                </div>
                <div>
                  {addr.ciudad_municipio}, {addr.estado}
                </div>

                <div className={styles.addressPhone}>
                  <FontAwesomeIcon icon={faPhone} /> {addr.telefono_contacto}
                </div>
              </div>

              <div className={styles.addressActions}>
                {!addr.es_principal ? (
                  <button
                    className={styles.btnAddrAction}
                    onClick={() => handleSetMain(addr.id)}
                    type="button"
                  >
                    Hacer Principal
                  </button>
                ) : (
                  <div />
                )}

                <div className={styles.actionGroup}>
                  <button
                    className={styles.btnAddrAction}
                    onClick={() => handleEdit(addr)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className={`${styles.btnAddrAction} ${styles.delete}`}
                    onClick={() => handleDelete(addr.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddressForm
          addressToEdit={addressToEdit}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchAddresses}
        />
      )}
    </div>
  );
};

export default MyAddresses;