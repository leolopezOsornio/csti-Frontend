// src/components/BrandCard/BrandCard.tsx
import { Link } from 'react-router-dom';
import './BrandCard.css';

/**
 * COMPONENTE: BrandCard
 * UBICACIÓN: src/components/BrandCard/BrandCard.tsx
 * * FUNCIÓN: 
 * Representa la unidad visual de una marca destacada. Recibe un objeto "brand" 
 * y renderiza su logotipo centrado. Funciona como un enlace que redirigirá al usuario 
 * al detalle de esa marca para ver todos los productos asociados a ella.
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
    <Link to={`/marca/${brand.slug}`} className="catalogo-link">
      <article className="brand-card">
        <img 
          src={brand.logo_url || '/img/brand-placeholder.png'} 
          alt={brand.name} 
          className="brand-logo" 
        />
        <h3 className="brand-name">{brand.name}</h3>
        <span className="brand-cta">Ver productos</span>
      </article>
    </Link>
  );
};

export default BrandCard;