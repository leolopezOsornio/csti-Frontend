// src/pages/cart/components/CartItem.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

interface CartItemProps {
  item: any;
  onUpdateQty: (itemId: number, newQty: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItem = ({ item, onUpdateQty, onRemove }: CartItemProps) => {
  const { producto, id, cantidad, subtotal, precio_unitario } = item;

  const handleQtyChange = (change: number) => {
    const newQty = cantidad + change;
    
    // Si intenta bajar de 1, confirmamos si quiere eliminarlo
    if (newQty < 1) {
      handleRemove();
      return;
    }
    
    // Validación extra: No dejar que supere el stock disponible
    if (newQty > producto.disponible) {
        Swal.fire({
            toast: true, position: 'top-end', icon: 'error',
            title: `Solo hay ${producto.disponible} unidades disponibles`,
            showConfirmButton: false, timer: 3000
        });
        return;
    }

    onUpdateQty(id, newQty);
  };

  const handleRemove = () => {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: "Se quitará este artículo de tu carrito.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onRemove(id);
      }
    });
  };

  return (
    <article className="cart-item-card">
      <div className="item-img-wrapper">
        <img 
          src={producto.imagen || '/img/no-image.png'} 
          alt={producto.clave} 
          className="item-img" 
        />
      </div>

      <div className="item-details">
        <div className="item-brand">{producto.marca || "MARCA"}</div>
        <h3 className="item-title">{producto.descripcion.substring(0, 80)}...</h3>
        
        <div className="item-controls">
          <div className="qty-selector-sm">
            <button type="button" className="qty-btn-sm" onClick={() => handleQtyChange(-1)}>-</button>
            <input 
              type="number" 
              value={cantidad} 
              className="qty-input-sm" 
              readOnly 
            />
            <button type="button" className="qty-btn-sm" onClick={() => handleQtyChange(1)}>+</button>
          </div>

          <button onClick={handleRemove} className="btn-delete" title="Eliminar artículo" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}>
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      </div>

      <div className="item-price-col">
        <div className="item-price">${Number(subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <small style={{ color: '#999', fontSize: '0.8rem' }}>
          Unit: ${Number(precio_unitario).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </small>
      </div>
    </article>
  );
};

export default CartItem;