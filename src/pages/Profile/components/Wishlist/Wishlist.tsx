import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { wishlistService } from '../../../../services/wishlistService';
import { cartService } from '../../../../services/cartService';
import { WishlistContext } from '../../../../contexts/WishlistContext';
import { CartContext } from '../../../../contexts/CartContext';
import styles from './Wishlist.module.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { refreshWishlist } = useContext(WishlistContext);
  const { refreshCart } = useContext(CartContext);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      setWishlist(data.items);
    } catch (error) {
      console.error('Error al cargar lista de deseos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const goToDetail = (clave: string) => {
    navigate(`/producto/${clave}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, producto: any) => {
    e.stopPropagation();

    try {
      await cartService.addToCart(producto.id, 1);
      await refreshCart();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Agregado al carrito',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error: any) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: error.response?.data?.error || 'Error al agregar',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleRemove = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();

    Swal.fire({
      title: '¿Quitar de favoritos?',
      text: 'El producto se eliminará de tu lista de deseos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setWishlist((prev) => prev.filter((item) => item.id !== itemId));
          await wishlistService.removeItem(itemId);
          await refreshWishlist();

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Producto eliminado',
            showConfirmButton: false,
            timer: 2000,
          });
        } catch (error) {
          console.error('Error al quitar item', error);
        }
      }
    });
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando favoritos... ⏳</div>;
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Lista de Deseos</h1>
      <p className={styles.pageSubtitle}>Tus productos favoritos guardados.</p>

      {wishlist.length > 0 ? (
        <div className={styles.wishlistContainer}>
          {wishlist.map((item) => (
            <article
              key={item.id}
              className={styles.wishlistItem}
              onClick={() => goToDetail(item.producto.clave)}
            >
              <div className={styles.wlImgWrapper}>
                <img
                  src={item.producto.imagen || '/img/no-image.png'}
                  alt={item.producto.clave}
                  className={styles.wlImg}
                />
              </div>

              <div className={styles.wlDetails}>
                <div>
                  <div className={styles.wlBrand}>{item.producto.marca}</div>
                  <h3 className={styles.wlTitle}>{item.producto.descripcion}</h3>
                  <div className={styles.wlMeta}>
                    <span>
                      Clave: <strong>{item.producto.clave}</strong>
                    </span>
                  </div>
                </div>

                <div
                  className={`${styles.wlStock} ${item.producto.disponible > 0 ? styles.inStock : styles.outOfStock
                    }`}
                >
                  {item.producto.disponible > 0
                    ? `✓ Disponible (${item.producto.disponible} pzas)`
                    : '✗ Sin inventario temporalmente'}
                </div>
              </div>

              <div className={styles.wlActions}>
                <div className={styles.wlPrice}>
                  ${Number(item.producto.precio).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>

                <button
                  className={styles.wlBtnCart}
                  disabled={item.producto.disponible <= 0}
                  onClick={(e) => handleAddToCart(e, item.producto)}
                  title={item.producto.disponible <= 0 ? 'Sin stock' : 'Agregar al carrito'}
                  type="button"
                >
                  <FontAwesomeIcon icon={faCartShopping} /> Agregar
                </button>

                <button
                  className={styles.wlBtnRemove}
                  onClick={(e) => handleRemove(e, item.id)}
                  type="button"
                >
                  <FontAwesomeIcon icon={faTrashCan} /> Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={faCartShopping} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Tu lista está vacía</h3>
          <p className={styles.emptyText}>
            Aún no tienes productos en tu lista de deseos.
          </p>
        </div>
      )}
    </>
  );
};

export default Wishlist;