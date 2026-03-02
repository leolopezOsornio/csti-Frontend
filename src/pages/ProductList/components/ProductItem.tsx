// File: src/pages/ProductList/components/ProductItem.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ProductItemProps {
  product: any;
}

const ProductItem = ({ product }: ProductItemProps) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);

  const handleCardClick = () => {
    navigate(`/producto/${product.clave}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra el detalle
    console.log("Agregado al carrito:", product.clave);
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra el detalle
    setIsFav(!isFav);
  };

  return (
    <article className="pl-card" onClick={handleCardClick}>
      <span className="pl-card-brand">{product.marca}</span>
      
      <img src={product.imagen} alt={product.descripcion} className="pl-card-img" />
      
      <h3 className="pl-card-title">{product.descripcion}</h3>
      
      <div className="pl-card-footer">
        <span className="pl-card-price">${product.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        
        <div className="pl-card-actions">
          {/* Botón de Favorito (Cian claro) */}
          <button className="pl-action-btn pl-btn-fav" onClick={toggleFav} title="Agregar a deseados">
            <FontAwesomeIcon icon={isFav ? faHeartSolid : faHeartRegular} />
          </button>
          
          {/* Botón de Carrito (Cian oscuro) */}
          <button className="pl-action-btn pl-btn-cart" onClick={handleAddToCart} title="Agregar al carrito">
            <FontAwesomeIcon icon={faCartShopping} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductItem;