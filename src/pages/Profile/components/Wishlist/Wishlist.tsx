// src/pages/Profile/components/Wishlist/Wishlist.tsx
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import './Wishlist.css';

// MOCK DATA: Simulando la estructura que nos devolverá el backend
const mockWishlist = [
  {
    id: 101, // ID del registro en la lista de deseos
    producto: {
      id: 55,
      clave: 'LT-8492',
      codigo_fabricante: 'HP-ENVY-14',
      marca: 'HP',
      descripcion: 'Laptop HP Envy 14" Intel Core i7, 16GB RAM, 512GB SSD, Windows 11 Home',
      precio: 24500.00,
      imagen: '/img/laptop.png',
      disponible: 12,
    }
  },
  {
    id: 102,
    producto: {
      id: 88,
      clave: 'MN-9921',
      codigo_fabricante: 'DELL-U2723QE',
      marca: 'DELL',
      descripcion: 'Monitor Dell UltraSharp 27" 4K USB-C Hub Monitor',
      precio: 12999.00,
      imagen: '/img/laptop.png',
      disponible: 0, // Simulamos un producto sin stock
    }
  }
];

const Wishlist = () => {
  const navigate = useNavigate();

  // Manejador para ir al detalle del producto
  const goToDetail = (clave: string) => {
    navigate(`/producto/${clave}`);
  };

  // Manejador para simular agregar al carrito
  const handleAddToCart = (e: React.MouseEvent, producto: any) => {
    e.stopPropagation(); // Evita que el clic en el botón te lleve al detalle
    
    // Aquí a futuro llamaremos a cartService.addToCart(...)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Agregado al carrito',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Manejador para simular eliminación
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
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí a futuro llamaremos al endpoint de eliminar del backend
        Swal.fire({
          toast: true, position: 'top-end', icon: 'info', title: 'Producto eliminado', showConfirmButton: false, timer: 2000
        });
      }
    });
  };

  return (
    <>
      <h1 style={{ marginBottom: '5px' }}>Lista de Deseos</h1>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>Tus productos favoritos guardados.</p>
      
      {mockWishlist.length > 0 ? (
        <div className="wishlist-container">
          {mockWishlist.map((item) => (
            <article 
              key={item.id} 
              className="wishlist-item" 
              onClick={() => goToDetail(item.producto.clave)}
            >
              
              <div className="wl-img-wrapper">
                <img src={item.producto.imagen} alt={item.producto.clave} className="wl-img" />
              </div>

              <div className="wl-details">
                <div>
                  <div className="wl-brand">{item.producto.marca}</div>
                  <h3 className="wl-title">{item.producto.descripcion}</h3>
                  <div className="wl-meta">
                    <span>Modelo: <strong>{item.producto.codigo_fabricante}</strong></span>
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
                  ${item.producto.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                
                <button 
                  className="wl-btn-cart" 
                  disabled={item.producto.disponible === 0}
                  onClick={(e) => handleAddToCart(e, item.producto)}
                  title={item.producto.disponible === 0 ? "Sin stock" : "Agregar al carrito"}
                >
                  <FontAwesomeIcon icon={faCartShopping} /> 
                  Agregar
                </button>

                <button 
                  className="wl-btn-remove" 
                  onClick={(e) => handleRemove(e, item.id)}
                >
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