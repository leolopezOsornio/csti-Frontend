import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Navbar/MegaMenu.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const MegaMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('brands');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.megaMenuWrapper} ${isOpen ? styles.open : ''}`}
      ref={menuRef}
    >
      <button
        className={styles.megaTriggerBtn}
        type="button"
        onClick={handleToggleMenu}
        aria-expanded={isOpen}
        aria-label="Abrir menú de categorías"
      >
        <FontAwesomeIcon icon={faBars} />
        <span className={styles.megaBtnText}>Categorías</span>
      </button>

      <div className={styles.megaMenu}>
        <div className={styles.megaLayout}>
          <aside className={styles.megaSidebar}>
            <button
              type="button"
              className={`${styles.megaCat} ${activePanel === 'portatiles' ? styles.isActive : ''
                }`}
              onMouseEnter={() => setActivePanel('portatiles')}
              onClick={() => setActivePanel('portatiles')}
            >
              Portátiles
            </button>

            <button
              type="button"
              className={`${styles.megaCat} ${activePanel === 'impresoras' ? styles.isActive : ''
                }`}
              onMouseEnter={() => setActivePanel('impresoras')}
              onClick={() => setActivePanel('impresoras')}
            >
              Impresoras
            </button>

            <button
              type="button"
              className={`${styles.megaCat} ${activePanel === 'brands' ? styles.isActive : ''
                }`}
              onMouseEnter={() => setActivePanel('brands')}
              onClick={() => setActivePanel('brands')}
            >
              Marcas
            </button>
          </aside>

          <div className={styles.megaPanelsWrapper}>
            <section
              className={`${styles.megaPanel} ${activePanel === 'brands' ? styles.active : ''
                }`}
            >
              <h3 className={styles.megaTitle}>Marcas destacadas</h3>
              <div className={styles.megaBrandsGrid}>
                <Link
                  to="/marca/hp"
                  className={styles.brandChip}
                  onClick={handleCloseMenu}
                >
                  HP
                </Link>

                <Link
                  to="/marca/lenovo"
                  className={styles.brandChip}
                  onClick={handleCloseMenu}
                >
                  Lenovo
                </Link>
              </div>
            </section>

            <section
              className={`${styles.megaPanel} ${activePanel === 'portatiles' ? styles.active : ''
                }`}
            >
              <h3 className={styles.megaTitle}>Portátiles</h3>
              <div className={styles.megaBrandsGrid}>
                <Link
                  to="/listado?grupo=PORTATILES"
                  className={styles.brandChip}
                  onClick={handleCloseMenu}
                >
                  Ver Laptops
                </Link>
              </div>
            </section>

            <section
              className={`${styles.megaPanel} ${activePanel === 'impresoras' ? styles.active : ''
                }`}
            >
              <h3 className={styles.megaTitle}>Impresoras</h3>
              <div className={styles.megaBrandsGrid}>
                <Link
                  to="/listado?grupo=IMPRESORAS"
                  className={styles.brandChip}
                  onClick={handleCloseMenu}
                >
                  Ver Impresoras
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;