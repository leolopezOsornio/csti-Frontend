// src/pages/Profile/components/MyAddresses/AddressForm.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { addressService } from '../../../../services/addressService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
// Asegúrate de importar el CSS actualizado en el archivo principal (MyAddresses.css)

interface AddressFormProps {
  addressToEdit?: any | null;
  onClose: () => void;
  onSuccess: () => void; 
}

const AddressForm = ({ addressToEdit, onClose, onSuccess }: AddressFormProps) => {
  const [formData, setFormData] = useState({
    alias: '', destinatario: '', telefono_contacto: '', calle: '',
    numero_exterior: '', numero_interior: '', colonia: '',
    codigo_postal: '', ciudad_municipio: '', estado: '', referencias: ''
  });

  useEffect(() => {
    if (addressToEdit) {
      setFormData({ ...addressToEdit });
    }
  }, [addressToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (addressToEdit) {
        await addressService.updateAddress(addressToEdit.id, formData);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Dirección actualizada', showConfirmButton: false, timer: 2000 });
      } else {
        await addressService.addAddress(formData);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Dirección guardada', showConfirmButton: false, timer: 2000 });
      }
      onSuccess(); 
      onClose(); 
    } catch (error: any) {
      Swal.fire('Error', 'Por favor revisa los campos e intenta de nuevo.', 'error');
    }
  };

  // Prevenir que el clic en el modal cierre el overlay
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="address-modal" onClick={handleModalClick}>
        
        {/* HEADER DEL MODAL REESTRUCTURADO */}
        <div className="modal-header">
          <h2>{addressToEdit ? 'Editar Dirección' : 'Nueva Dirección'}</h2>
          <button onClick={onClose} className="btn-close-modal" aria-label="Cerrar modal">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Alias (Ej. Mi Casa)</label>
                <input type="text" name="alias" value={formData.alias} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nombre de quien recibe</label>
                <input type="text" name="destinatario" value={formData.destinatario} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Código Postal</label>
                <input type="text" name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Teléfono de Contacto</label>
                <input type="tel" name="telefono_contacto" value={formData.telefono_contacto} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Calle</label>
              <input type="text" name="calle" value={formData.calle} onChange={handleChange} required />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Núm. Exterior</label>
                <input type="text" name="numero_exterior" value={formData.numero_exterior} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Núm. Interior (Opcional)</label>
                <input type="text" name="numero_interior" value={formData.numero_interior} onChange={handleChange} />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Colonia</label>
                <input type="text" name="colonia" value={formData.colonia} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Ciudad / Municipio</label>
                <input type="text" name="ciudad_municipio" value={formData.ciudad_municipio} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <input type="text" name="estado" value={formData.estado} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Referencias de entrega (Opcional)</label>
              <textarea name="referencias" rows={2} value={formData.referencias} onChange={handleChange} placeholder="Ej. Casa blanca con reja negra..."></textarea>
            </div>

            {/* FOOTER DEL MODAL */}
            <div className="modal-footer">
              <button type="submit" className="btn-submit-modal">
                {addressToEdit ? 'Actualizar Dirección' : 'Guardar Dirección'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;