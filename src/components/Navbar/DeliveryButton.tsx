// src/components/Navbar/DeliveryButton.tsx
import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { addressService } from '../../services/Address.service';
import styles from './DeliveryButton.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faChevronDown, faChevronUp, faTruck } from '@fortawesome/free-solid-svg-icons';

const DeliveryButton = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      addressService.getAddresses()
        .then((addresses: any[]) => {
          if (addresses && addresses.length > 0) {
            const principal = addresses.find(a => a.es_principal) || addresses[0];
            setDefaultAddress(principal);
          } else {
            setDefaultAddress(null);
          }
        })
        .catch(err => console.error("Error fetching addresses", err));
    } else {
      setDefaultAddress(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleActionClick = () => {
    setIsOpen(false);
    if (isAuthenticated) {
      navigate('/perfil/direcciones');
    } else {
      navigate('/login');
    }
  };

  const mainText = defaultAddress 
    ? `Enviar a ${defaultAddress.alias || defaultAddress.ciudad_municipio}` 
    : '¿Dónde lo enviamos?';
    
  const subText = defaultAddress
    ? `CP ${defaultAddress.codigo_postal}`
    : (isAuthenticated ? 'Agregar dirección' : 'Inicia sesión para envío');

  return (
    <div className={styles.deliveryWrapper} ref={wrapperRef}>
      <button 
        className={`${styles.deliveryBtn} ${isOpen ? styles.open : ''}`} 
        onClick={toggleDropdown} 
        type="button"
      >
        <div className={styles.iconCircle}>
          <FontAwesomeIcon icon={faMapMarkerAlt} />
        </div>
        <div className={styles.textContainer}>
          <span className={styles.mainTitle}>{mainText}</span>
          <span className={styles.subTitle}>{subText}</span>
        </div>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <FontAwesomeIcon icon={faTruck} className={styles.cardIcon} />
              </div>
              <div className={styles.cardTextContent}>
                <h4 className={styles.cardTitle}>
                  {defaultAddress ? 'Tus productos llegarán a:' : 'Agrega una dirección para recibir el pedido'}
                </h4>
                <p className={styles.cardSubtitle}>
                  {defaultAddress 
                    ? `${defaultAddress.calle}, ${defaultAddress.colonia}` 
                    : (isAuthenticated ? 'Configura tu domicilio en tu perfil' : 'Ingresa para ver tus direcciones guardadas')}
                </p>
              </div>
            </div>
            <button className={styles.actionBtn} onClick={handleActionClick}>
              {defaultAddress ? 'Cambiar o agregar dirección' : 'Agregar dirección'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryButton;
