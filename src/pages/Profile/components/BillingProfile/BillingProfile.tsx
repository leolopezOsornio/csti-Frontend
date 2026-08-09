import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { billingService, FiscalData } from '../../../../services/Billing.service';
import styles from './BillingProfile.module.css';

const BillingProfile = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FiscalData>({
    rfc: '',
    razon_social: '',
    codigo_postal: '',
    regimen_fiscal: '',
    uso_cfdi: 'G03', // Por defecto Gastos en general
  });
  const [errors, setErrors] = useState<Partial<FiscalData>>({});

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const data = await billingService.getFiscalData();
        if (data) {
          setFormData(data);
        }
      } catch (error) {
        console.error("Error al obtener datos fiscales", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);

  const validate = () => {
    const newErrors: Partial<FiscalData> = {};
    if (!formData.rfc) newErrors.rfc = "El RFC es obligatorio";
    else if (!/^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/.test(formData.rfc.toUpperCase())) {
      newErrors.rfc = "El formato del RFC no es válido";
    }

    if (!formData.razon_social.trim()) newErrors.razon_social = "La razón social es obligatoria (Como en su Constancia)";
    if (!formData.codigo_postal) newErrors.codigo_postal = "El código postal es obligatorio";
    else if (!/^\d{5}$/.test(formData.codigo_postal)) newErrors.codigo_postal = "Debe ser un código postal de 5 dígitos";

    if (!formData.regimen_fiscal) newErrors.regimen_fiscal = "Seleccione un régimen fiscal";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rfc' ? value.toUpperCase() : value
    }));
    // Limpiar error al escribir
    if (errors[name as keyof FiscalData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await billingService.saveFiscalData(formData);
      Swal.fire({
        icon: 'success',
        title: '¡Datos Guardados!',
        text: 'Tus datos fiscales se han actualizado correctamente.',
        confirmButtonColor: '#007bff'
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Hubo un problema al guardar tus datos.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando datos fiscales...</p>
      </div>
    );
  }

  return (
    <div className={styles.billingContainer}>
      <h2>Datos Fiscales</h2>
      <p className={styles.subtitle}>
        Guarde su información fiscal (CFDI 4.0) para poder emitir facturas de sus compras automáticamente. 
        Debe coincidir exactamente con su Constancia de Situación Fiscal.
      </p>

      <form className={styles.formGrid} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>RFC *</label>
          <input 
            type="text" 
            name="rfc" 
            value={formData.rfc} 
            onChange={handleChange} 
            className={errors.rfc ? styles.errorInput : ''}
            placeholder="Ej. XAXX010101000"
            maxLength={13}
          />
          {errors.rfc && <span className={styles.errorText}>{errors.rfc}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Código Postal *</label>
          <input 
            type="text" 
            name="codigo_postal" 
            value={formData.codigo_postal} 
            onChange={handleChange} 
            className={errors.codigo_postal ? styles.errorInput : ''}
            placeholder="Código Postal (5 dígitos)"
            maxLength={5}
          />
          {errors.codigo_postal && <span className={styles.errorText}>{errors.codigo_postal}</span>}
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label>Razón Social (Sin SA de CV) *</label>
          <input 
            type="text" 
            name="razon_social" 
            value={formData.razon_social} 
            onChange={handleChange} 
            className={errors.razon_social ? styles.errorInput : ''}
            placeholder="Ej. JUAN PEREZ MARTINEZ"
          />
          {errors.razon_social && <span className={styles.errorText}>{errors.razon_social}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Régimen Fiscal *</label>
          <select 
            name="regimen_fiscal" 
            value={formData.regimen_fiscal} 
            onChange={handleChange}
            className={errors.regimen_fiscal ? styles.errorInput : ''}
          >
            <option value="">Seleccione una opción...</option>
            <option value="601">601 - General de Ley Personas Morales</option>
            <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
            <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados</option>
            <option value="606">606 - Arrendamiento</option>
            <option value="608">608 - Demás ingresos</option>
            <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
            <option value="616">616 - Sin obligaciones fiscales</option>
            <option value="621">621 - Incorporación Fiscal</option>
            <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
          </select>
          {errors.regimen_fiscal && <span className={styles.errorText}>{errors.regimen_fiscal}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Uso de CFDI *</label>
          <select 
            name="uso_cfdi" 
            value={formData.uso_cfdi} 
            onChange={handleChange}
          >
            <option value="G01">G01 - Adquisición de mercancias</option>
            <option value="G03">G03 - Gastos en general</option>
            <option value="S01">S01 - Sin efectos fiscales</option>
            <option value="D04">D04 - Donativos</option>
          </select>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Datos Fiscales'}
        </button>
      </form>
    </div>
  );
};

export default BillingProfile;
