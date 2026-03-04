// src/components/ProductCard/ProductCard.tsx
import { Link } from 'react-router-dom';
import './ProductCard.css';

/**
 * COMPONENTE: ProductCard
 * UBICACIÓN: src/components/ProductCard/ProductCard.tsx
 * * FUNCIÓN: 
 * Representa la unidad visual mínima de un producto. Recibe un objeto "producto" como prop 
 * y se encarga de renderizar su imagen, título recortado, marca y precio. 
 * Contiene la lógica condicional visual para detectar si el producto tiene un descuento 
 * activo y, de ser así, renderizar la etiqueta roja de porcentaje y tachar el precio viejo.
 */

interface ProductCardProps {
  producto: any;
}

const ProductCard = ({ producto }: ProductCardProps) => {
  // Determinamos si es una oferta basándonos en si trae porcentaje_descuento del backend
  const esOferta = producto.porcentaje_descuento && producto.porcentaje_descuento > 0;

  return (
    <Link to={`/producto/${producto.clave}`} className="catalogo-link">
      <article className="catalogo-card card-prod" style={{ position: 'relative' }}>
        
        {esOferta && (
          <div className="badge-offer">-{Math.round(producto.porcentaje_descuento)}%</div>
        )}

        <img 
          src={producto.imagen || '/img/no-image.png'} 
          alt={producto.descripcion} 
          className="catalogo-img card-prod__img" 
        />
        
        <h3 className="catalogo-nombre card-prod__title">
          {producto.descripcion.substring(0, 60)}{producto.descripcion.length > 60 ? '...' : ''}
        </h3>
        <p className="catalogo-marca">{producto.marca}</p>
        
        <div className="catalogo-precio-container">
          {esOferta ? (
            <>
              <span className="price-old">${Number(producto.precio_regular).toFixed(2)}</span>
              <span className="price-new">${Number(producto.precio_oferta).toFixed(2)}</span>
            </>
          ) : (
            <p className="catalogo-precio">${Number(producto.precio).toFixed(2)}</p>
          )}
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;