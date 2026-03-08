// src/pages/Profile/components/Wishlist/Wishlist.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

import { wishlistService } from '../../../../services/wishlistService';
import { cartService } from '../../../../services/cartService';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      setWishlist(data.items);
    } catch (error) {
      console.error("Error al cargar lista de deseos", error);
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
      // Aquí idealmente también llamarías a refreshCart() del CartContext
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', 
        title: 'Agregado al carrito', showConfirmButton: false, timer: 2000
      });
    } catch (error: any) {
      Swal.fire({
        toast: true, position: 'top-end', icon: 'error', 
        title: error.response?.data?.error || 'Error al agregar', showConfirmButton: false, timer: 3000
      });
    }
  };

  const handleRemove = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    
    Swal.fire({
      title: '¿Quitar de favoritos?',
      text: "El producto se eliminará de tu lista de deseos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await wishlistService.removeItem(itemId);
          // Filtramos el estado local para no recargar la página entera
          setWishlist(wishlist.filter(item => item.id !== itemId)); 
          Swal.fire({
            toast: true, position: 'top-end', icon: 'info', 
            title: 'Producto eliminado', showConfirmButton: false, timer: 2000
          });
        } catch (error) {
           console.error("Error al quitar item", error);
        }
      }
    });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando favoritos... ⏳</div>;

  return (
    <>
      <h1 style={{ marginBottom: '5px' }}>Lista de Deseos</h1>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>Tus productos favoritos guardados.</p>
      
      {wishlist.length > 0 ? (
        <div className="wishlist-container">
          {wishlist.map((item) => (
            <article 
              key={item.id} 
              className="wishlist-item" 
              onClick={() => goToDetail(item.producto.clave)}
            >
              
              <div className="wl-img-wrapper">
                <img src={item.producto.imagen || '/img/no-image.png'} alt={item.producto.clave} className="wl-img" />
              </div>

              <div className="wl-details">
                <div>
                  <div className="wl-brand">{item.producto.marca}</div>
                  <h3 className="wl-title">{item.producto.descripcion}</h3>
                  <div className="wl-meta">
                    <span>Clave: <strong>{item.producto.clave}</strong></span>
                  </div>
                </div>
                
                <div className={`wl-stock ${item.producto.disponible > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {item.producto.disponible > 0 
                    ? `✓ Disponible (${item.producto.disponible} pzas)` 
                    : '✗ Sin inventario temporalmente'}
                </div>
              </div>

              <div className="wl-actions">
                <div className="wl-price">
                  ${Number(item.producto.precio).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                
                <button 
                  className="wl-btn-cart" 
                  disabled={item.producto.disponible <= 0}
                  onClick={(e) => handleAddToCart(e, item.producto)}
                  title={item.producto.disponible <= 0 ? "Sin stock" : "Agregar al carrito"}
                >
                  <FontAwesomeIcon icon={faCartShopping} /> Agregar
                </button>

                <button className="wl-btn-remove" onClick={(e) => handleRemove(e, item.id)}>
                  <FontAwesomeIcon icon={faTrashCan} /> Quitar
                </button>
              </div>

            </article>
          ))}
        </div>
      ) : (
        <div className="empty-cart" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
          <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: '40px', color: '#dee2e6', marginBottom: '15px' }} />
          <h3 style={{ color: '#495057' }}>Tu lista está vacía</h3>
          <p style={{ color: '#868e96' }}>Aún no tienes productos en tu lista de deseos.</p>
        </div>
      )}
    </>
  );
};

export default Wishlist;