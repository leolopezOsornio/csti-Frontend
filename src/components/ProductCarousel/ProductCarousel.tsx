import { useRef } from 'react';
import ProductCard from '../ProductCard/ProductCard';
import BrandCard from '../BrandCard/BrandCard';
import styles from '../ProductCarousel/ProductCarousel.module.css';

/**
 * COMPONENTE: ProductCarousel
 * UBICACIÓN: src/components/ProductCarousel/ProductCarousel.tsx
 *
 * FUNCIÓN:
 * Contenedor horizontal deslizable (slider).
 * Usa useRef para controlar el scroll horizontal mediante botones.
 * Dependiendo del prop "tipo" renderiza ProductCard o BrandCard.
 */

interface ProductCarouselProps {
  titulo: string;
  items: any[];
  tipo?: 'producto' | 'marca';
}

const ProductCarousel = ({
  titulo,
  items,
  tipo = 'producto',
}: ProductCarouselProps) => {
  const cintaRef = useRef<HTMLDivElement>(null);

  const scroll = (direccion: 'izq' | 'der') => {
    if (cintaRef.current) {
      const scrollAmount = 260 * 3 * (direccion === 'der' ? 1 : -1);
      cintaRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className={styles.bloque}>
      <div className={styles.bloqueHeader}>
        <h2 className={styles.bloqueTitulo}>{titulo.toUpperCase()}</h2>
      </div>

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

      <div className={styles.cinta} ref={cintaRef}>
        {items.map((item, idx) =>
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
    </section>
  );
};

export default ProductCarousel;