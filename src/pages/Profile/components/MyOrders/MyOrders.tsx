// src/pages/Profile/components/MyOrders/MyOrders.tsx
const MyOrders = () => {
  return (
    <>
      <h1>Historial de Pedidos</h1>

      <div className="orders-list">
        
        {/* Pedido 1 */}
        <div className="order-card">
          <div className="order-header">
            <span className="order-id">Pedido #ORD-123456</span>
            <span className="status-pill processing">En Proceso</span>
          </div>
          
          <div className="order-body">
            <div className="order-date">Fecha: 23 Ene 2026</div>
            <div className="order-preview">
              <div className="order-thumbs">
                <img src="/img/laptop.png" className="thumb-mini" alt="Producto" />
                <img src="/img/brand-placeholder.png" className="thumb-mini" alt="Producto" />
              </div>
              <span className="more-items">+ 1 artículo más</span>
            </div>
          </div>

          <div className="order-footer">
            <span className="order-total">Total: $47,558.84</span>
            <a href="#" className="btn-details">Ver Detalles</a>
          </div>
        </div>

        {/* Pedido 2 */}
        <div className="order-card">
          <div className="order-header">
            <span className="order-id">Pedido #ORD-987654</span>
            <span className="status-pill delivered">Entregado</span>
          </div>
          
          <div className="order-body">
            <div className="order-date">Fecha: 15 Dic 2025</div>
            <div className="order-preview">
              <div className="order-thumbs">
                <img src="/img/laptop.png" className="thumb-mini" alt="Producto" />
              </div>
              <span className="more-items">1 artículo</span>
            </div>
          </div>

          <div className="order-footer">
            <span className="order-total">Total: $12,200.00</span>
            <a href="#" className="btn-details">Ver Detalles</a>
          </div>
        </div>

      </div>
    </>
  );
};

export default MyOrders;