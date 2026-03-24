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
  if (!categorias || categorias.length === 0) return null;

  return (
    <section className={styles.bloque}>
      <div className={styles.bloqueHeader}>
        <h2 className={styles.bloqueTitulo}>CATEGORÍAS POPULARES</h2>
      </div>

      <div className={styles.catGrid}>
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
    </section>
  );
};

export default CategoryGrid;