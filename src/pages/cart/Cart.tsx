// src/pages/cart/Cart.tsx
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
      await fetchCart();
      refreshCart();
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

  return (
    <div className={styles.cartPageWrapper}>
      {cartData && cartData.total_items > 0 ? (
        <div className={styles.cartGrid}>
          <div className={styles.cartItemsCol}>
            <h1 className={styles.cartHeading}>
              Tu Carrito ({cartData.total_items} artículos)
            </h1>

            <div className={styles.cartItemsList}>
              {cartData.items.map((item: any) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQty={handleUpdateQty}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            <Link to="/home" className={styles.continueShopping}>
              ← Seguir comprando
            </Link>
          </div>

          <CartSummary total={cartData.total} />
        </div>
      ) : (
        <EmptyCart />
      )}
    </div>
  );
};

export default Cart;