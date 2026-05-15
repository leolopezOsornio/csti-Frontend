// src/pages/ProductList/components/ProductItem.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { CartContext } from '../../../../contexts/CartContext';
import { WishlistContext } from '../../../../contexts/WishlistContext';
import { cartService } from '../../../../services/Cart.service';
import { appAlert, appToast } from '../../../../utils/alerts';

import styles from '../ProductItem/ProductItem.module.css';

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

  const showLoginRequired = async (text: string) => {
    const result = await appAlert({
      title: 'Inicia sesion',
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ir al login',
      cancelButtonText: 'Seguir viendo',
    });

    if (result.isConfirmed) {
      navigate('/login');
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      await showLoginRequired('Debes iniciar sesion para agregar productos al carrito.');
      return;
    }

    try {
      await cartService.addToCart(product.id, 1);
      await refreshCart();

      const result = await appAlert({
        title: 'Anadido al carrito',
        text: `${product.descripcion.substring(0, 40)}... se agrego con exito.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Ir a mi carrito',
        cancelButtonText: 'Seguir comprando',
      });

      if (result.isConfirmed) {
        navigate('/carrito');
      }
    } catch (error: any) {
      appToast('error', 'No se pudo agregar', error.response?.data?.error || 'Ocurrio un error al agregar');
    }
  };

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      await showLoginRequired('Debes iniciar sesion para agregar productos a tus favoritos.');
      return;
    }

    try {
      const added = await toggleWishlist(product.id);
      appToast('success', added ? 'Agregado a favoritos' : 'Quitado de favoritos');
    } catch (error) {
      appToast('error', 'Error al actualizar favoritos');
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
