// src/components/ProductCarousel/ProductCarousel.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import BrandCard from '../BrandCard/BrandCard';
import styles from '../ProductCarousel/ProductCarousel.module.css';

/**
 * COMPONENTE: ProductCarousel
 * UBICACIÓN: src/components/ProductCarousel/ProductCarousel.tsx
 *
 * FUNCIÓN:
 * Componente Híbrido:
 * - PC: Contenedor horizontal deslizable (slider) con flechas.
 * - Móvil: Cuadrícula (Grid) estática de 2x2 que se expande hacia abajo.
 * Dependiendo del prop "tipo" renderiza ProductCard o BrandCard.
 */

interface ProductCarouselProps {
  titulo: string;
  items: any[];
  tipo?: 'producto' | 'marca';
  linkVerMas?: string;
}

const ProductCarousel = ({
  titulo,
  items,
  tipo = 'producto',
  linkVerMas = '/catalogo',
}: ProductCarouselProps) => {
  const cintaRef = useRef<HTMLDivElement>(null);
  
  // Detección de dispositivo
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const defaultMobileCount = 4;
  const initialCount = isMobile ? defaultMobileCount : items.length;
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(isMobile ? defaultMobileCount : items.length);
  }, [isMobile, items.length]);

  if (!items || items.length === 0) return null;

  const scroll = (direccion: 'izq' | 'der') => {
    if (cintaRef.current) {
      const scrollAmount = 260 * 3 * (direccion === 'der' ? 1 : -1);
      cintaRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleVerMas = () => {
    setVisibleCount((prev) => prev + 4);
  };

  const handleOcultar = () => {
    setVisibleCount(defaultMobileCount);
    if (cintaRef.current) {
        cintaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visibleItems = items.slice(0, visibleCount);

  return (
    <section className={styles.bloque}>
      <div className={styles.bloqueHeader}>
        <h2 className={styles.bloqueTitulo}>{titulo.toUpperCase()}</h2>
        <Link to={linkVerMas} className={styles.verMas}>
          Ir al catálogo <span>&rarr;</span>
        </Link>
      </div>

      {!isMobile && (
        <>
          <button
            type="button"
            className={`${styles.ctrl} ${styles.flecha} ${styles.izq}`}
            onClick={() => scroll('izq')}
            aria-label={`Desplazar ${titulo} a la izquierda`}
          >
            &#10094;
          </button>
          <button
            type="button"
            className={`${styles.ctrl} ${styles.flecha} ${styles.der}`}
            onClick={() => scroll('der')}
            aria-label={`Desplazar ${titulo} a la derecha`}
          >
            &#10095;
          </button>
        </>
      )}

      <div className={styles.cinta} ref={cintaRef}>
        {visibleItems.map((item, idx) =>
          tipo === 'producto' ? (
            <div className={styles.item} key={item.clave || idx}>
              <ProductCard producto={item} />
            </div>
          ) : (
            <div className={styles.item} key={item.id || idx}>
              <BrandCard brand={item} />
            </div>
          )
        )}
      </div>

      {isMobile && (
        <div className={styles.footerCentrado}>
          {visibleCount < items.length ? (
            <button className={styles.botonVerMasAbajo} onClick={handleVerMas}>
              Ver más {titulo.toLowerCase()} <span>&darr;</span>
            </button>
          ) : items.length > defaultMobileCount ? (
            <button className={styles.botonVerMasAbajo} onClick={handleOcultar}>
              Ocultar {titulo.toLowerCase()} <span>&uarr;</span>
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default ProductCarousel;