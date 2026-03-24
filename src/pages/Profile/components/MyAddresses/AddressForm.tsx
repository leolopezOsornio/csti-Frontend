// src/pages/Profile/components/MyAddresses/AddressForm.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { addressService } from '../../../../services/addressService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './MyAddresses.module.css';

interface AddressFormProps {
  addressToEdit?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddressForm = ({ addressToEdit, onClose, onSuccess }: AddressFormProps) => {
  const [formData, setFormData] = useState({
    alias: '',
    destinatario: '',
    telefono_contacto: '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    codigo_postal: '',
    ciudad_municipio: '',
    estado: '',
    referencias: '',
  });

  useEffect(() => {
    if (addressToEdit) {
      setFormData({ ...addressToEdit });
    }
  }, [addressToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (addressToEdit) {
        await addressService.updateAddress(addressToEdit.id, formData);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Dirección actualizada',
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        await addressService.addAddress(formData);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Dirección guardada',
          showConfirmButton: false,
          timer: 2000,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      Swal.fire('Error', 'Por favor revisa los campos e intenta de nuevo.', 'error');
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.addressModal} onClick={handleModalClick}>
        <div className={styles.modalHeader}>
          <h2>{addressToEdit ? 'Editar Dirección' : 'Nueva Dirección'}</h2>

          <button
            onClick={onClose}
            className={styles.btnCloseModal}
            aria-label="Cerrar modal"
            type="button"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label>Alias (Ej. Mi Casa)</label>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Nombre de quien recibe</label>
                <input
                  type="text"
                  name="destinatario"
                  value={formData.destinatario}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label>Código Postal</label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={formData.codigo_postal}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono de Contacto</label>
                <input
                  type="tel"
                  name="telefono_contacto"
                  value={formData.telefono_contacto}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Calle</label>
              <input
                type="text"
                name="calle"
                value={formData.calle}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label>Núm. Exterior</label>
                <input
                  type="text"
                  name="numero_exterior"
                  value={formData.numero_exterior}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Núm. Interior (Opcional)</label>
                <input
                  type="text"
                  name="numero_interior"
                  value={formData.numero_interior}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label>Colonia</label>
                <input
                  type="text"
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ciudad / Municipio</label>
                <input
                  type="text"
                  name="ciudad_municipio"
                  value={formData.ciudad_municipio}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Estado</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Referencias de entrega (Opcional)</label>
              <textarea
                name="referencias"
                rows={2}
                value={formData.referencias}
                onChange={handleChange}
                placeholder="Ej. Casa blanca con reja negra..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalFooter}>
              <button type="submit" className={`btn btn-primary ${styles.btnSubmitModal}`}>
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