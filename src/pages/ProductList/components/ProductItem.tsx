// File: src/pages/ProductList/components/ProductItem.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

import { AuthContext } from '../../../contexts/AuthContext';
import { CartContext } from '../../../contexts/CartContext';
import { WishlistContext } from '../../../contexts/WishlistContext';

import { cartService } from '../../../services/cartService';

interface ProductItemProps {
  product: any;
}

const ProductItem = ({ product }: ProductItemProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { refreshCart } = useContext(CartContext); // Extraemos la función para actualizar el badge
  const { wishlistIds, toggleWishlist } = useContext(WishlistContext);
  const isFav = wishlistIds.includes(product.id);

  const handleCardClick = () => {
    navigate(`/producto/${product.clave}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra el detalle

    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Inicia sesión!',
        text: 'Debes iniciar sesión para agregar productos al carrito.',
        icon: 'warning',
        confirmButtonColor: '#00b4d8'
      });
      return;
    }

    try {
      await cartService.addToCart(product.id, 1); // Agrega 1 unidad
      await refreshCart(); // Actualizamos el badge del Navbar

      // Lanzamos la alerta bonita
      Swal.fire({
        title: '¡Añadido al carrito!',
        text: `${product.descripcion.substring(0, 40)}... se agregó con éxito.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#00b4d8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ir a mi carrito',
        cancelButtonText: 'Seguir comprando'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/carrito');
        }
      });

    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.error || 'Ocurrió un error al agregar', 'error');
    }
  };

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Inicia sesión!',
        text: 'Debes iniciar sesión para agregar productos a tus favoritos.',
        icon: 'warning',
        confirmButtonColor: '#00b4d8'
      });
      return;
    }

    try {
      const added = await toggleWishlist(product.id);
      if (added) {
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: 'Agregado a favoritos ❤️', showConfirmButton: false, timer: 2000
        });
      } else {
        Swal.fire({
          toast: true, position: 'top-end', icon: 'info',
          title: 'Quitado de favoritos 🤍', showConfirmButton: false, timer: 2000
        });
      }
    } catch (error) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error al actualizar favoritos', showConfirmButton: false, timer: 3000 });
    }
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
          <button
            className="pl-action-btn pl-btn-fav"
            onClick={handleToggleFav}
            title={isFav ? "Quitar de deseados" : "Agregar a deseados"}
          >
            <FontAwesomeIcon
              icon={isFav ? faHeartSolid : faHeartRegular}
              style={{ color: isFav ? '#ff4757' : 'inherit' }} // Se pinta rojo si es favorito
            />
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