// src/components/CategoryGrid/CategoryGrid.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../CategoryGrid/CategoryGrid.module.css';

/**
 * COMPONENTE: CategoryGrid
 * UBICACIÓN: src/components/CategoryGrid/CategoryGrid.tsx
 *
 * FUNCIÓN:
 * Renderiza una cuadrícula de categorías.
 * Cada categoría redirige a la página de listado filtrada.
 */

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
}

interface CategoryGridProps {
  categorias: Category[];
}

const CategoryGrid = ({ categorias }: CategoryGridProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!categorias || categorias.length === 0) return null;

  const handleScroll = () => {
    if (gridRef.current && isMobile) {
      const scrollLeft = gridRef.current.scrollLeft;
      // Ancho de una tarjeta (aproximadamente la mitad de la pantalla)
      const cardWidth = gridRef.current.clientWidth / 2; 
      // Calculamos el índice base: cada 2 elementos es una "página"
      const currentIndex = Math.round(scrollLeft / (cardWidth * 2));
      setActiveIndex(currentIndex);
    }
  };

  const totalPages = Math.ceil(categorias.length / 2);

  return (
    <section className={styles.bloque}>
      <div className={styles.bloqueHeader}>
        <h2 className={styles.bloqueTitulo}>CATEGORÍAS POPULARES</h2>
      </div>

      <div 
        className={styles.catGrid} 
        ref={gridRef} 
        onScroll={handleScroll}
      >
        {categorias.map((cat) => (
          <Link
            to={`/listado?categoria=${cat.slug}`}
            key={cat.id}
            className={styles.catCard}
          >
            <img
              src={cat.image_url || '/img/category-placeholder.png'}
              alt={cat.name}
              className={styles.catImg}
            />
            <div className={styles.catTitle}>{cat.name}</div>
          </Link>
        ))}
      </div>

      {isMobile && totalPages > 1 && (
        <div className={styles.dotsContainer}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <div
              key={idx}
              className={`${styles.dot} ${activeIndex === idx ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;