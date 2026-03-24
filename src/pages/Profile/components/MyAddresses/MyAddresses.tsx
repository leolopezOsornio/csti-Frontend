// src/pages/Profile/components/MyAddresses/MyAddresses.tsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faHouse, faPhone } from '@fortawesome/free-solid-svg-icons';

import { addressService } from '../../../../services/addressService';
import AddressForm from './AddressForm';
import './MyAddresses.css';

const MyAddresses = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Error al cargar direcciones", error);
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
      text: "No podrás revertir esta acción.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await addressService.deleteAddress(id);
          Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Dirección eliminada', showConfirmButton: false, timer: 2000 });
          fetchAddresses(); // Recargar lista
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar la dirección', 'error');
        }
      }
    });
  };

  const handleSetMain = async (id: number) => {
    try {
      await addressService.setMainAddress(id);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Asignada como principal', showConfirmButton: false, timer: 2000 });
      fetchAddresses(); // Recargar lista para que el status is_main se actualice visualmente
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#6c757d' }}>Cargando direcciones... ⏳</div>;

  return (
    <div className="my-addresses-container">
      {/* Header de la sección */}
      <div className="addresses-header">
        <h1 className="addresses-title">Mis Direcciones</h1>
        <button className="btn-primary" onClick={handleOpenNew}>
          <FontAwesomeIcon icon={faPlus} /> Nueva Dirección
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="empty-addresses" style={{ padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', textAlign: 'center', border: '1px dashed #ced4da' }}>
          <FontAwesomeIcon icon={faHouse} style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '15px' }} />
          <h3 style={{ color: '#495057', marginBottom: '8px' }}>Sin direcciones guardadas</h3>
          <p style={{ color: '#6c757d', margin: 0 }}>Agrega una dirección para agilizar tus futuras compras.</p>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.map((addr) => (
            <article key={addr.id} className={`address-card ${addr.es_principal ? 'is-main' : ''}`}>
              
              {/* Cabecera de la tarjeta con Alias y Badge */}
              <div className="address-card-header">
                <h3 className="address-alias">{addr.alias}</h3>
                {addr.es_principal && <span className="address-badge-main">Predeterminada</span>}
              </div>
              
              <div className="address-name">{addr.destinatario}</div>
              
              {/* Cuerpo de la dirección (usando divs para mejor control) */}
              <div className="address-text">
                <div>{addr.calle} {addr.numero_exterior} {addr.numero_interior && `Int. ${addr.numero_interior}`}</div>
                <div>{addr.colonia}, C.P. {addr.codigo_postal}</div>
                <div>{addr.ciudad_municipio}, {addr.estado}</div>
                
                <div className="address-phone">
                  <FontAwesomeIcon icon={faPhone} /> {addr.telefono_contacto}
                </div>
              </div>

              {/* Botones de acción organizados */}
              <div className="address-actions">
                {!addr.es_principal ? (
                  <button className="btn-addr-action" onClick={() => handleSetMain(addr.id)}>
                    Hacer Principal
                  </button>
                ) : (
                  <div></div> /* Espaciador para mantener "Editar/Eliminar" a la derecha cuando es principal */
                )}
                
                <div className="action-group">
                  <button className="btn-addr-action" onClick={() => handleEdit(addr)}>Editar</button>
                  <button className="btn-addr-action delete" onClick={() => handleDelete(addr.id)}>Eliminar</button>
                </div>
              </div>

            </article>
          ))}
        </div>
      )}

      {/* Modal Formulario */}
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