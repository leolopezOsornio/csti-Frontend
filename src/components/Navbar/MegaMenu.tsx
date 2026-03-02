// src/components/Navbar/MegaMenu.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MegaMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('brands');
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic afuera (reemplazo del Vanilla JS)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`mega-menu-wrapper ${isOpen ? 'open' : ''}`} ref={menuRef}>
      <button 
        className="mega-trigger-btn" 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fa-solid fa-bars"></i> 
        <span className="mega-btn-text">Categorías</span>
      </button>

      <div className="mega-menu">
        <div className="mega-layout">
          <aside className="mega-sidebar">
            {/* Aquí iteraremos las categorías reales más adelante */}
            <button 
              type="button" 
              className={`mega-cat ${activePanel === 'portatiles' ? 'is-active' : ''}`} 
              onMouseEnter={() => setActivePanel('portatiles')}
            >
              Portátiles
            </button>
            <button 
              type="button" 
              className={`mega-cat ${activePanel === 'impresoras' ? 'is-active' : ''}`} 
              onMouseEnter={() => setActivePanel('impresoras')}
            >
              Impresoras
            </button>
            <button 
              type="button" 
              className={`mega-cat ${activePanel === 'brands' ? 'is-active' : ''}`} 
              onMouseEnter={() => setActivePanel('brands')}
            >
              Marcas
            </button>
          </aside>

          <div className="mega-panels-wrapper">
            <section className={`mega-panel ${activePanel === 'brands' ? 'active' : ''}`}>
              <h3 className="mega-title">Marcas destacadas</h3>
              <div className="mega-brands-grid">
                 {/* Links de ejemplo, los alimentaremos con la API después */}
                 <Link to="/marca/hp" className="brand-chip" onClick={() => setIsOpen(false)}>HP</Link>
                 <Link to="/marca/lenovo" className="brand-chip" onClick={() => setIsOpen(false)}>Lenovo</Link>
              </div>
            </section>
            
            <section className={`mega-panel ${activePanel === 'portatiles' ? 'active' : ''}`}>
              <h3 className="mega-title">Portátiles</h3>
              <div className="mega-brands-grid">
                <Link to="/listado?grupo=PORTATILES" className="brand-chip" onClick={() => setIsOpen(false)}>Ver Laptops</Link>
              </div>
            </section>

            <section className={`mega-panel ${activePanel === 'impresoras' ? 'active' : ''}`}>
              <h3 className="mega-title">Impresoras</h3>
              <div className="mega-brands-grid">
                <Link to="/listado?grupo=IMPRESORAS" className="brand-chip" onClick={() => setIsOpen(false)}>Ver Impresoras</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;