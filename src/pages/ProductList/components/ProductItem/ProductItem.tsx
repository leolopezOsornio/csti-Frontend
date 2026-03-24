// src/pages/ProductList/components/ProductItem.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { CartContext } from '../../../../contexts/CartContext';
import { WishlistContext } from '../../../../contexts/WishlistContext';
import { cartService } from '../../../../services/cartService';

import styles from './ProductItem.module.css';

interface ProductItemProps {
  product: any;
}

const ProductItem = ({ product }: ProductItemProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { refreshCart } = useContext(CartContext);
  const { wishlistIds, toggleWishlist } = useContext(WishlistContext);
  const isFav = wishlistIds.includes(product.id);

  const handleCardClick = () => {
    navigate(`/producto/${product.clave}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Inicia sesión!',
        text: 'Debes iniciar sesión para agregar productos al carrito.',
        icon: 'warning',
        confirmButtonColor: '#00b4d8',
      });
      return;
    }

    try {
      await cartService.addToCart(product.id, 1);
      await refreshCart();

      Swal.fire({
        title: '¡Añadido al carrito!',
        text: `${product.descripcion.substring(0, 40)}... se agregó con éxito.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#00b4d8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ir a mi carrito',
        cancelButtonText: 'Seguir comprando',
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
        confirmButtonColor: '#00b4d8',
      });
      return;
    }

    try {
      const added = await toggleWishlist(product.id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: added ? 'success' : 'info',
        title: added ? 'Agregado a favoritos ❤️' : 'Quitado de favoritos 🤍',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error al actualizar favoritos',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  return (
    <article className={styles.card} onClick={handleCardClick}>
      <span className={styles.cardBrand}>{product.marca}</span>

      <img src={product.imagen} alt={product.descripcion} className={styles.cardImg} />

      <h3 className={styles.cardTitle}>{product.descripcion}</h3>

      <div className={styles.cardFooter}>
        <span className={styles.cardPrice}>
          ${product.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>

        <div className={styles.cardActions}>
          <button
            className={`${styles.actionBtn} ${styles.btnFav}`}
            onClick={handleToggleFav}
            title={isFav ? 'Quitar de deseados' : 'Agregar a deseados'}
            type="button"
          >
            <FontAwesomeIcon
              icon={isFav ? faHeartSolid : faHeartRegular}
              className={isFav ? styles.iconFavActive : ''}
            />
          </button>

          <button
            className={`${styles.actionBtn} ${styles.btnCart}`}
            onClick={handleAddToCart}
            title="Agregar al carrito"
            type="button"
          >
            <FontAwesomeIcon icon={faCartShopping} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductItem;