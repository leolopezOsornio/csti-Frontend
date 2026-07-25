// src/pages/Payment/Payment.tsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Swal from 'sweetalert2';
import { CartContext } from '../../contexts/CartContext';
import { cartService } from '../../services/Cart.service';
import { paymentService } from '../../services/Payment.service';
import { shippingService, ShippingRate } from '../../services/Shipping.service';
import { addressService } from '../../services/Address.service';
import styles from './Payment.module.css';

const Payment = () => {
  const navigate = useNavigate();
  const { refreshCart } = useContext(CartContext);

  const [cartData, setCartData] = useState<any>(null);
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
  const [availableRates, setAvailableRates] = useState<ShippingRate[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShippingOptions, setShowShippingOptions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rate = shippingService.getSelectedRate();
        const addressIdStr = localStorage.getItem('selectedAddressId');

        if (!rate || !addressIdStr) {
          Swal.fire('Información incompleta', 'Debes seleccionar una dirección y método de envío primero.', 'warning');
          navigate('/carrito');
          return;
        }

        const addressId = parseInt(addressIdStr);
        setShippingRate(rate);
        setSelectedAddressId(addressId);

        const [cart, addr, allRates] = await Promise.all([
          cartService.getCart(),
          addressService.getAddresses(),
          shippingService.getRates(addressId, [])
        ]);

        setCartData(cart);
        setAvailableRates(allRates);

        const selectedAddress = addr.find((a: any) => a.id === addressId);
        setAddressDetails(selectedAddress);

      } catch (error) {
        console.error("Error al cargar datos de pago:", error);
        Swal.fire('Error', 'No se pudieron cargar los datos de la orden.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando detalles de tu pago...</p>
      </div>
    );
  }

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    return (
      <div className={styles.paymentContainer}>
        <div className={styles.noAddresses}>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega algunos productos antes de proceder al pago.</p>
          <Link to="/home" className={styles.linkProfile}>Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  const subtotal = Number(cartData.total);
  const shippingCost = shippingRate?.price || 0;
  const total = subtotal + shippingCost;

  const handleSelectRate = (rate: ShippingRate) => {
    setShippingRate(rate);
    shippingService.saveSelectedRate(rate);
    setShowShippingOptions(false);
  };

  return (
    <div className={styles.paymentContainer}>
      <h1 className={styles.paymentTitle}>Finalizar Compra</h1>

      <div className={styles.paymentLayout}>
        <div className={styles.paymentMain}>
          <section>
            <h2 className={styles.sectionTitle}>
              <i className="fa-solid fa-truck"></i> Información de Envío
            </h2>

            {addressDetails && (
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '2px solid #eaeaea', marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Entregar a: {addressDetails.destinatario}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                  {addressDetails.calle} {addressDetails.numero_exterior}{addressDetails.numero_interior ? `, Int. ${addressDetails.numero_interior}` : ''}
                  <br />
                  {addressDetails.colonia}, CP: {addressDetails.codigo_postal}
                  <br />
                  {addressDetails.ciudad_municipio}, {addressDetails.estado}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <Link to="/perfil/direcciones" style={{ color: '#00b4d8', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-pen"></i> Cambiar Dirección
                  </Link>
                </div>
              </div>
            )}

            {shippingRate && (
              <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', border: '2px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: shippingRate.type === 'express' ? '#fef3c7' : '#f1f5f9',
                      color: shippingRate.type === 'express' ? '#d97706' : '#64748b',
                      fontSize: '1.2rem'
                    }}>
                      {shippingRate.type === 'express' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                      )}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#1f2937' }}>{shippingRate.title}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{shippingRate.description}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#10b981' }}>
                    ${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  {!showShippingOptions ? (
                    <button
                      onClick={() => setShowShippingOptions(true)}
                      style={{ background: 'none', border: 'none', color: '#00b4d8', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                    >
                      Elegir otra opción de envío
                    </button>
                  ) : (
                    <div>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Otras opciones disponibles:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {availableRates.map((rate) => (
                          <div
                            key={rate.id}
                            onClick={() => handleSelectRate(rate)}
                            style={{
                              display: 'flex', justifyContent: 'space-between', padding: '0.75rem',
                              border: rate.id === shippingRate.id ? '1px solid #10b981' : '1px solid #cbd5e1',
                              borderRadius: '8px', cursor: 'pointer', background: rate.id === shippingRate.id ? '#f0fdf4' : 'white'
                            }}
                          >
                            <span style={{ fontWeight: rate.id === shippingRate.id ? 600 : 400 }}>{rate.title}</span>
                            <span>${rate.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowShippingOptions(false)}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', padding: 0 }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className={styles.cartPreview} style={{ marginTop: '2.5rem' }}>
            <h2 className={styles.sectionTitle}>
              <i className="fa-solid fa-basket-shopping"></i> Resumen de Productos
            </h2>
            <div className={styles.productsList}>
              {cartData.items.map((item: any) => (
                <div key={item.id} className={styles.productCard}>
                  <div className={styles.productImageContainer}>
                    <img
                      src={item.producto.imagen || '/img/no-image.png'}
                      alt={item.producto.descripcion}
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.productDetails}>
                    <span className={styles.productDescription}>{item.producto.descripcion}</span>
                    <span className={styles.productQuantity}>Cantidad: {item.cantidad}</span>
                  </div>
                  <div className={styles.productPriceContainer}>
                    <span className={styles.productPrice}>
                      ${(item.precio_unitario * item.cantidad).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.paymentSidebar}>
          <div className={styles.orderTotalSection}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Envío ({shippingRate?.title})</span>
              <span>${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.totalRow}>
              <span>IVA (16%)</span>
              <span>Incluido</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Total a Pagar</span>
              <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {selectedAddressId && (
            <div className={styles.paypalContainer}>
              <PayPalScriptProvider options={{
                clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
                currency: "MXN"
              }}>
                <PayPalButtons
                  style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  forceReRender={[selectedAddressId, cartData, total]}
                  createOrder={(_data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: {
                            value: total.toFixed(2).toString(),
                            currency_code: "MXN"
                          },
                          description: `Compra en CSTI - ${cartData?.items?.length || 0} productos`
                        }
                      ]
                    });
                  }}
                  onApprove={async (data, _actions) => {
                    try {
                      await paymentService.verifyPayment(data.orderID, selectedAddressId, shippingCost);

                      shippingService.clearSelectedRate();
                      localStorage.removeItem('selectedAddressId');

                      await refreshCart();
                      Swal.fire({
                        title: '¡Pago Exitoso!',
                        text: 'Tu orden ha sido procesada y creada correctamente.',
                        icon: 'success',
                        confirmButtonColor: '#00b4d8',
                      }).then(() => {
                        navigate('/perfil/pedidos');
                      });
                    } catch (error: any) {
                      console.error("Error en la verificación:", error);
                      const errorMsg = error.response?.data?.error || 'El pago se autorizó pero hubo un problema al registrarlo.';
                      Swal.fire('Error', errorMsg, 'error');
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal Error:", err);
                    Swal.fire('Error', 'Ocurrió un error con la pasarela de PayPal.', 'error');
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Payment;