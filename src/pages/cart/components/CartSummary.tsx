// src/pages/cart/components/CartSummary.tsx
import Swal from 'sweetalert2';

interface CartSummaryProps {
  total: number;
}

const CartSummary = ({ total }: CartSummaryProps) => {
  
  const handleCheckout = () => {
    Swal.fire({
      title: 'Procesando...',
      text: 'Redirigiendo a la pasarela de pago segura.',
      icon: 'info',
      confirmButtonColor: '#00b4d8',
      timer: 2000,
      showConfirmButton: false
    });
    // Aquí podrías redirigir a una página de checkout: navigate('/checkout')
  };

  return (
    <div className="cart-summary-col">
      <div className="cart-summary-card">
        <h2 className="summary-title">Resumen del Pedido</h2>
        
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}*</span> 
        </div>
        
        <div className="summary-row">
          <span>IVA (16%)</span>
          <span>Calculado al final</span>
        </div>

        <div className="summary-row total">
          <span className="label-total">Total</span>
          <span className="value-total">${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        <button className="btn-checkout" onClick={handleCheckout}>Proceder al Pago</button>
        
        <div className="trust-signal">
          <i className="fa-solid fa-lock"></i> Transacción 100% Segura
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '15px', textAlign: 'center' }}>
          * Los precios incluyen IVA si aplica. El desglose final se mostrará en la factura.
        </p>
      </div>
    </div>
  );
};

export default CartSummary;