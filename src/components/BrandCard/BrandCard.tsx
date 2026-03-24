import { Link } from 'react-router-dom';
import styles from '../BrandCard/BrandCard.module.css';

/**
 * COMPONENTE: BrandCard
 * UBICACIÓN: src/components/BrandCard/BrandCard.tsx
 *
 * FUNCIÓN:
 * Representa la unidad visual de una marca destacada.
 * Recibe un objeto "brand" y renderiza su logotipo centrado.
 * Funciona como enlace hacia la página de la marca.
 */

interface BrandCardProps {
  brand: {
    id: number;
    name: string;
    slug: string;
    logo_url: string;
  };
}

const BrandCard = ({ brand }: BrandCardProps) => {
  return (
    <Link to={`/marca/${brand.slug}`} className={styles.catalogoLink}>
      <article className={styles.brandCard}>
        <img
          src={brand.logo_url || '/img/brand-placeholder.png'}
          alt={brand.name}
          className={styles.brandLogo}
        />

        <h3 className={styles.brandName}>
          {brand.name}
        </h3>

        <span className={styles.brandCta}>
          Ver productos
        </span>
      </article>
    </Link>
  );
};

export default BrandCard;