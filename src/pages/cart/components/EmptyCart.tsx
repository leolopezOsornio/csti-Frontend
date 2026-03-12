// src/pages/cart/components/EmptyCart.tsx
import { Link } from 'react-router-dom';

const EmptyCart = () => {
  return (
    <div className="empty-cart">
      <img 
        src="/img/carrito.png" 
        alt="Carrito Vacío" 
        style={{ width: '80px', opacity: 0.5, marginBottom: '20px' }} 
      />
      <h2>Tu carrito está vacío</h2>
      <p>Parece que aún no has agregado productos.</p>
      <Link to="/home" className="btn-checkout" style={{ display: 'inline-block', width: 'auto', textDecoration: 'none' }}>
        Ir al Catálogo
      </Link>
    </div>
  );
};

export default EmptyCart;