// src/components/Footer/Footer.tsx
import { Link } from 'react-router-dom';
import './Footer.css';

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
    <footer className="main-footer">
      <div className="footer-content">
        
        <div className="brand-col">
          <Link to="/home">
            <img src="/img/logo_csti.png" alt="CSTI" className="footer-logo" />
          </Link>

          <p className="footer-desc">
            Empresa Mexicana, radicada en el Estado de Querétaro 
            con 10 años de experiencia en la renta/venta de equipos 
            de impresión, tanto para oficina como para la industria.
          </p>
          
          <div style={{ marginTop: '20px' }}>
            <h3 className="footer-heading" style={{ fontSize: '1rem', marginBottom: '15px' }}>
              Síguenos
            </h3> 
            <div className="social-icons">
              <a href="#" className="social-link" title="Facebook">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="social-link" title="LinkedIn">
                <FontAwesomeIcon icon={faLinkedinIn} />
              </a>
              <a href="#" className="social-link" title="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>
        </div>

        <div className="nav-col">
          <h3 className="footer-heading">Navegación</h3>
          <ul className="footer-links">
            <li><Link to="/home">Inicio</Link></li>
            <li><Link to="/home">Catálogo</Link></li>
            <li><a href="#">Servicios</a></li>
            <li><a href="#">Conócenos</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        <div className="support-col">
          <h3 className="footer-heading">Ofertamos</h3>
          <ul className="footer-links">
            <li><a href="#">Impresión Térmica</a></li>
            <li><a href="#">Impresión Laser</a></li>
            <li><a href="#">Impresión en Plotter</a></li>
            <li><a href="#">Soporte Técnico</a></li>
          </ul>
        </div>

        <div className="contact-col">
          <h3 className="footer-heading">Formas de contacto</h3>
          <div className="footer-contact">
            <p style={{ alignItems: 'flex-start' }}>
              <FontAwesomeIcon icon={faLocationDot} style={{ marginTop: '4px' }} />
              <span>
                Pirineos no. 515 int. 41-J, Parque Industrial Micro Santiago, 
                CP 76120, Santiago de Querétaro, Qro.
              </span>
            </p>
            <p>
              <FontAwesomeIcon icon={faPhone} /> 442 251 05 21
            </p>
            <p>
              <FontAwesomeIcon icon={faEnvelope} /> ventas@csti.com.mx
            </p>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom__inner">
          <p className="copyright-text">
            © {currentYear} CSTI Soluciones en TI. Todos los derechos reservados.
          </p>

          <div className="footer-legal">
            <a href="#">Políticas de Privacidad</a>
            <span className="separator">•</span>
            <a href="#">Términos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
