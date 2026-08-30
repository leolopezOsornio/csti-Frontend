import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

import { cartService } from '../../services/Cart.service';
import { CartContext } from '../../contexts/CartContext';

import EmptyCart from './components/EmptyCart/EmptyCart';
import CartItem from './components/CartItem/CartItem';
import CartSummary from './components/CartSummary/CartSummary';
import styles from '../cart/Cart.module.css';

const Cart = () => {
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  
  const { refreshCart } = useContext(CartContext);

  const fetchCart = async () => {
    try {
      const data = await cartService.getCart();
      setCartData(data);
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    try {
      await cartService.updateQuantity(itemId, newQty);
      await fetchCart();
      refreshCart();
    } catch (error) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error al actualizar',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartService.removeItem(itemId);
      const updatedData = await cartService.getCart();
      setCartData(updatedData);
      refreshCart();
      
      const updatedTotalPages = Math.ceil((updatedData?.items?.length || 0) / itemsPerPage);
      if (currentPage > updatedTotalPages && updatedTotalPages > 0) {
        setCurrentPage(updatedTotalPages);
      }
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Artículo eliminado',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'No se pudo eliminar',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        Cargando tu carrito... ⏳
      </div>
    );
  }

  const totalItems = cartData?.items?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cartData?.items?.slice(indexOfFirstItem, indexOfLastItem) || [];

  return (
    <div className={styles.cartPageWrapper}>
      {cartData && cartData.total_items > 0 ? (
        <div className={styles.cartGrid}>
          <div className={styles.cartItemsCol}>
            <h1 className={styles.cartHeading}>
              Tu Carrito ({cartData.total_items} artículos)
            </h1>

            <div className={styles.cartItemsList}>
              {currentItems.map((item: any) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQty={handleUpdateQty}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <button 
                  className={styles.navBtn} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  &#10094;
                </button>

                <div className={styles.paginationDots}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`${styles.dot} ${page === currentPage ? styles.activeDot : ''}`}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Ir a la página ${page}`}
                    />
                  ))}
                </div>

                <button 
                  className={styles.navBtn} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                >
                  &#10095;
                </button>
              </div>
            )}

            <Link to="/home" className={styles.continueShopping}>
              ← Seguir comprando
            </Link>
            
            <div id="cart-bottom-marker" style={{ height: '1px', marginTop: '16px' }}></div>
          </div>

          <CartSummary total={cartData.total} items={cartData.items} />
        </div>
      ) : (
        <EmptyCart />
      )}
    </div>
  );
};

export default Cart;
