import { Link } from 'react-router-dom';
import styles from '../Footer/Footer.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faPhone,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF,
  faLinkedinIn,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import { appConfig } from '../../config/appConfig';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.mainFooter}>
      <div className={styles.footerContent}>
        <div className={styles.brandCol}>
          <Link to="/home">
            <img
              src="/img/Fasterclick2.webp"
              alt="CSTI"
              className={styles.footerLogo}
            />
          </Link>

          <p className={styles.footerDesc}>
            Tu tienda en linea de confianza para equipos, laptops, consumibles de
            impresion y perifericos. Calidad y servicio para tu area de computo.
          </p>

          <div className={styles.socialBlock}>
            <h3 className={`${styles.footerHeading} ${styles.socialHeading}`}>
              Siguenos
            </h3>

            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialLink} title="Facebook" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className={styles.socialLink} title="LinkedIn" aria-label="LinkedIn">
                <FontAwesomeIcon icon={faLinkedinIn} />
              </a>
              <a href="#" className={styles.socialLink} title="Instagram" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.navCol}>
          <h3 className={styles.footerHeading}>Navegacion</h3>
          <ul className={styles.footerLinks}>
            <li><Link to="/home">Inicio</Link></li>
            <li><Link to="/home">Catalogo</Link></li>
            <li><a href="#">Conocenos</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        <div className={styles.contactCol}>
          <h3 className={styles.footerHeading}>Formas de contacto</h3>

          <div className={styles.footerContact}>
            <p className={styles.contactItemTop}>
              <FontAwesomeIcon
                icon={faLocationDot}
                className={styles.contactIconTop}
              />
              <span>{appConfig.contactAddress}</span>
            </p>

            <p className={styles.contactItem}>
              <FontAwesomeIcon icon={faPhone} className={styles.contactIcon} />
              <span>{appConfig.contactPhone}</span>
            </p>

            <p className={styles.contactItem}>
              <FontAwesomeIcon icon={faEnvelope} className={styles.contactIcon} />
              <span>{appConfig.contactEmail}</span>
            </p>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={`container ${styles.footerBottomInner}`}>
          <p className={styles.copyrightText}>
            &copy; {currentYear} FasterClick. Todos los derechos reservados.
          </p>

          <div className={styles.footerLegal}>
            <a href="#">Politicas de Privacidad</a>
            <span className={styles.separator}>|</span>
            <a href="#">Terminos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
