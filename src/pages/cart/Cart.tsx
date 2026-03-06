// src/pages/cart/Cart.tsx
import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

import { cartService } from '../../services/cartService';
import { CartContext } from '../../contexts/CartContext';

import EmptyCart from './components/EmptyCart';
import CartItem from './components/CartItem';
import CartSummary from './components/CartSummary';
import './Cart.css'; // <-- Tu CSS original de Django va aquí

const Cart = () => {
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { refreshCart } = useContext(CartContext); // Para sincronizar el Navbar

  const fetchCart = async () => {
    try {
      const data = await cartService.getCart();
      setCartData(data);
    } catch (error) {
      console.error("Error obteniendo carrito:", error);
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
      await fetchCart(); // Refresca los datos y el total de esta vista
      refreshCart();     // Refresca el badge del Navbar
    } catch (error) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error al actualizar', showConfirmButton: false, timer: 3000 });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartService.removeItem(itemId);
      await fetchCart();
      refreshCart();
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Artículo eliminado', showConfirmButton: false, timer: 2000 });
    } catch (error) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo eliminar', showConfirmButton: false, timer: 3000 });
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando tu carrito... ⏳</div>;

  return (
    <div className="cart-page-wrapper">
      {cartData && cartData.total_items > 0 ? (
        <div className="cart-grid">
          
          <div className="cart-items-col">
            <h1 className="cart-heading">Tu Carrito ({cartData.total_items} artículos)</h1>
            
            <div className="cart-items-list">
              {cartData.items.map((item: any) => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onUpdateQty={handleUpdateQty} 
                  onRemove={handleRemoveItem} 
                />
              ))}
            </div>

            <Link to="/home" className="continue-shopping">← Seguir comprando</Link>
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