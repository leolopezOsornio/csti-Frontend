import React, { useState } from 'react';
import styles from './ReturnModal.module.css';
import { returnsService } from '../../../../services/Returns.service';
import Swal from 'sweetalert2';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  onSuccess: () => void;
}

const ReturnModal = ({ isOpen, onClose, orderId, onSuccess }: ReturnModalProps) => {
  const [motivo, setMotivo] = useState('');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotos, setFotos] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleClose = () => {
    setMotivo('');
    setMotivoOtro('');
    setComentarios('');
    setFotos([]);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newTotal = fotos.length + selectedFiles.length;
      
      if (newTotal > 5) {
        Swal.fire('Límite excedido', 'Solo puedes subir un máximo de 5 fotos como evidencia.', 'warning');
        return;
      }
      
      setFotos(prev => [...prev, ...selectedFiles].slice(0, 5));
    }
  };

  const removeFoto = (indexToRemove: number) => {
    setFotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo) {
      Swal.fire('Error', 'Por favor selecciona un motivo', 'warning');
      return;
    }
    
    if (motivo === 'Otro' && !motivoOtro.trim()) {
      Swal.fire('Error', 'Por favor especifica el motivo', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('orden_id', orderId.toString());
      formData.append('motivo', motivo === 'Otro' ? `Otro: ${motivoOtro}` : motivo);
      formData.append('comentarios', comentarios);
      fotos.forEach(foto => formData.append('evidencias', foto));
      
      await returnsService.requestReturn(formData);

      Swal.fire({
        icon: 'success',
        title: 'Solicitud Enviada',
        text: 'Tu solicitud ha sido enviada con éxito. Revisaremos la evidencia y te notificaremos pronto.',
        confirmButtonColor: '#0d47a1'
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo procesar la solicitud en este momento.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose} title="Cerrar">&times;</button>
        
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.headerIcon}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
              <path d="M12 12 7.5 9.4"></path>
            </svg>
          </div>
          <h2 className={styles.title}>Solicitar Devolución</h2>
        </div>
        
        <div className={styles.infoBox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.infoIcon}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            Por favor añade fotografías claras que evidencien el estado del producto (daños, caja abierta, etc). Esto agilizará la aprobación de tu guía de retorno.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="motivo">Motivo de la devolución *</label>
            <select 
              id="motivo" 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)}
              required
            >
              <option value="">-- Selecciona un motivo --</option>
              <option value="Dano_envio">El producto llegó dañado (Paquetería)</option>
              <option value="Defecto_fabrica">El producto tiene un defecto de fábrica</option>
              <option value="Producto_equivocado">Recibí un producto diferente al que compré</option>
              <option value="Arrepentimiento">Ya no lo necesito (Caja sellada)</option>
              <option value="Otro">Otro (Especificar)</option>
            </select>
          </div>

          {motivo === 'Otro' && (
            <div className={styles.formGroup}>
              <label htmlFor="motivoOtro">Especifica el motivo *</label>
              <input 
                type="text"
                id="motivoOtro"
                value={motivoOtro}
                onChange={(e) => setMotivoOtro(e.target.value)}
                placeholder="Escribe el motivo..."
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Evidencia Fotográfica (Max 5)</label>
            <div className={styles.fileInputContainer}>
              <label htmlFor="evidencia_fotos" className={styles.uploadLabel}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"/>
                  <path d="M16 16l-4-4-4 4"/>
                </svg>
                Da clic aquí para subir imágenes
                <span>(Formatos permitidos: JPG, PNG)</span>
              </label>
              <input 
                type="file" 
                id="evidencia_fotos" 
                multiple 
                accept="image/*"
                onChange={handleFileChange}
                disabled={fotos.length >= 5}
              />
            </div>
            
            {fotos.length > 0 && (
              <div className={styles.previewsGrid}>
                {fotos.map((foto, idx) => (
                  <div key={idx} className={styles.previewWrapper}>
                    <img 
                      src={URL.createObjectURL(foto)} 
                      alt={`Preview ${idx}`} 
                      className={styles.imagePreview} 
                    />
                    <button 
                      type="button" 
                      className={styles.removeImage} 
                      onClick={() => removeFoto(idx)}
                      title="Quitar imagen"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comentarios">Detalles adicionales</label>
            <textarea 
              id="comentarios" 
              placeholder="Describe detalladamente el problema con el producto..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              maxLength={500}
            ></textarea>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;
