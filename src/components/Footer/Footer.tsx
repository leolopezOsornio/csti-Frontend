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
            Empresa Mexicana, radicada en el Estado de Querétaro con 10 años de
            experiencia en la renta/venta de equipos de impresión, tanto para
            oficina como para la industria.
          </p>

          <div className={styles.socialBlock}>
            <h3 className={`${styles.footerHeading} ${styles.socialHeading}`}>
              Síguenos
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
          <h3 className={styles.footerHeading}>Navegación</h3>
          <ul className={styles.footerLinks}>
            <li><Link to="/home">Inicio</Link></li>
            <li><Link to="/home">Catálogo</Link></li>
            <li><a href="#">Servicios</a></li>
            <li><a href="#">Conócenos</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        <div className={styles.supportCol}>
          <h3 className={styles.footerHeading}>Ofertamos</h3>
          <ul className={styles.footerLinks}>
            <li><a href="#">Impresión Térmica</a></li>
            <li><a href="#">Impresión Laser</a></li>
            <li><a href="#">Impresión en Plotter</a></li>
            <li><a href="#">Soporte Técnico</a></li>
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
              <span>
                Pirineos no. 515 int. 41-J, Parque Industrial Micro Santiago,
                CP 76120, Santiago de Querétaro, Qro.
              </span>
            </p>

            <p className={styles.contactItem}>
              <FontAwesomeIcon icon={faPhone} className={styles.contactIcon} />
              <span>442 251 05 21</span>
            </p>

            <p className={styles.contactItem}>
              <FontAwesomeIcon icon={faEnvelope} className={styles.contactIcon} />
              <span>ventas@csti.com.mx</span>
            </p>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={`container ${styles.footerBottomInner}`}>
          <p className={styles.copyrightText}>
            © {currentYear} FasterClick. Todos los derechos reservados.
          </p>

          <div className={styles.footerLegal}>
            <a href="#">Políticas de Privacidad</a>
            <span className={styles.separator}>•</span>
            <a href="#">Términos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;