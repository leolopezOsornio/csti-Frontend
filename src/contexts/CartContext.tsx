// src/contexts/CartContext.tsx
import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { cartService } from '../services/cartService';
import { AuthContext } from './AuthContext';

interface CartContextType {
  cartItemsCount: number;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType>({
  cartItemsCount: 0,
  refreshCart: async () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  const refreshCart = async () => {
    if (isAuthenticated) {
      try {
        const cartData = await cartService.getCart();
        setCartItemsCount(cartData.total_items || 0);
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
      }
    } else {
      setCartItemsCount(0); // Si no está logueado, es 0
    }
  };

  // Se ejecuta cada vez que el usuario inicia o cierra sesión
  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  return (
    <CartContext.Provider value={{ cartItemsCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};