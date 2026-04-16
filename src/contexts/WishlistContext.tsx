// src/contexts/WishlistContext.tsx
import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { wishlistService } from '../services/Wishlist.service';
import { AuthContext } from './AuthContext';

interface WishlistContextType {
  wishlistIds: number[]; // Guardaremos solo los IDs para búsquedas rápidas
  toggleWishlist: (productoId: number) => Promise<boolean>; // Retorna true si se agregó, false si se quitó
  refreshWishlist: () => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: [],
  toggleWishlist: async () => false,
  refreshWishlist: async () => {},
});

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  const refreshWishlist = async () => {
    if (isAuthenticated) {
      try {
        const data = await wishlistService.getWishlist();
        // Extraemos solo los IDs de los productos para hacer validaciones rápidas en el frontend
        const ids = data.items.map((item: any) => item.producto.id);
        setWishlistIds(ids);
      } catch (error) {
        console.error("Error al cargar la wishlist:", error);
      }
    } else {
      setWishlistIds([]);
    }
  };

  const toggleWishlist = async (productoId: number) => {
    try {
      const response = await wishlistService.toggleWishlist(productoId);
      // Actualizamos el estado local sin tener que volver a consultar al backend
      if (response.is_fav) {
        setWishlistIds((prev) => [...prev, productoId]);
      } else {
        setWishlistIds((prev) => prev.filter(id => id !== productoId));
      }
      return response.is_fav; // Retornamos el estado para que el componente dispare el SweetAlert correcto
    } catch (error) {
      console.error("Error al hacer toggle en wishlist:", error);
      throw error;
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};