// src/pages/Payment/Payment.tsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Swal from 'sweetalert2';
import { CartContext } from '../../contexts/CartContext';
import { cartService } from '../../services/cartService';
import { paymentService } from '../../services/paymentService';
import { addressService } from '../../services/addressService';
import styles from './Payment.module.css';

const Payment = () => {
  const navigate = useNavigate();
  const { refreshCart } = useContext(CartContext);

  const [cartData, setCartData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cart, addr] = await Promise.all([
          cartService.getCart(),
          addressService.getAddresses()
        ]);

        setCartData(cart);
        setAddresses(addr);

        if (addr.length > 0) {
          const principal = addr.find((a: any) => a.es_principal);
          if (principal) {
            setSelectedAddressId(principal.id);
          } else {
            setSelectedAddressId(addr[0].id);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos de pago:", error);
        Swal.fire('Error', 'No se pudieron cargar los datos de la orden.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className={styles.paymentContainer}>
      <h1 className={styles.paymentTitle}>Finalizar Compra</h1>

      <div className={styles.paymentLayout}>
        {/* Columna Izquierda: Direcciones y Resumen */}
        <div className={styles.paymentMain}>
          <section>
            <h2 className={styles.sectionTitle}>
              <i className="fa-solid fa-location-dot"></i> Selecciona Dirección de Envío
            </h2>

            {addresses.length === 0 ? (
              <div className={styles.noAddresses}>
                <p>No tienes direcciones de envío registradas.</p>
                <Link to="/perfil" className={styles.linkProfile}>
                  Ir a mi perfil para agregar una dirección
                </Link>
              </div>
            ) : (
              <div className={styles.addressList}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selectedAddress : ''}`}
                    onClick={() => setSelectedAddressId(addr.id)}
                  >
                    <div className={styles.addressHeader}>
                      <span className={styles.destinatario}>{addr.destinatario}</span>
                      {addr.es_principal && <span className={`${styles.badge} ${styles.badgePrincipal}`}>Principal</span>}
                    </div>
                    <div className={styles.addressDetails}>
                      <p>{addr.calle} {addr.numero_exterior}{addr.numero_interior ? `, Int. ${addr.numero_interior}` : ''}</p>
                      <p>{addr.colonia}, CP: {addr.codigo_postal}</p>
                      <p>{addr.ciudad_municipio}, {addr.estado}</p>
                      <p>Tel: {addr.telefono_contacto}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.cartPreview}>
            <h2 className={styles.sectionTitle}>
              <i className="fa-solid fa-basket-shopping"></i> Resumen de Productos
            </h2>
            {cartData.items.map((item: any) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span>{item.producto.descripcion}</span>
                  <span className={styles.itemQuantity}>Cantidad: {item.cantidad}</span>
                </div>
                <span className={styles.itemPrice}>
                  ${(item.precio_unitario * item.cantidad).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </section>
        </div>

        {/* Columna Derecha: Resumen de Pago y PayPal */}
        <aside className={styles.paymentSidebar}>
          <div className={styles.orderTotalSection}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${Number(cartData.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Envío</span>
              <span>¡Gratis!</span>
            </div>
            <div className={styles.totalRow}>
              <span>IVA (16%)</span>
              <span>Incluido</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Total a Pagar</span>
              <span>${Number(cartData.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {addresses.length > 0 && selectedAddressId && (
            <div className={styles.paypalContainer}>
              <PayPalScriptProvider options={{
                clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
                currency: "MXN"
              }}>
                <PayPalButtons
                  style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  forceReRender={[selectedAddressId, cartData]}
                  createOrder={(_data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: {
                            value: cartData.total.toString(),
                            currency_code: "MXN"
                          },
                          description: `Compra en CSTI - ${cartData?.items?.length || 0} productos`
                        }
                      ]
                    });
                  }}
                  onApprove={async (data, _actions) => {
                    if (!selectedAddressId) {
                      Swal.fire('Error', 'No se detectó una dirección de envío seleccionada.', 'error');
                      return;
                    }

                    try {
                      // 1. Mostramos un modal de carga para que el usuario no toque nada
                      // sin destruir el componente de React.
                      Swal.fire({
                        title: 'Procesando pago...',
                        text: 'Por favor, no cierres esta ventana.',
                        allowOutsideClick: false,
                        didOpen: () => {
                          Swal.showLoading();
                        }
                      });

                      // 2. Capturamos el dinero en PayPal
                      if (_actions.order) {
                        await _actions.order.capture();
                      }

                      // 3. Avisamos a Django
                      await paymentService.verifyPayment(data.orderID, selectedAddressId);

                      // 4. Actualizamos el frontend
                      await refreshCart();

                      // 5. Mostramos el éxito y redirigimos
                      Swal.fire({
                        title: '¡Pago Exitoso!',
                        text: 'Tu orden ha sido procesada y creada correctamente.',
                        icon: 'success',
                        confirmButtonColor: '#00b4d8',
                      }).then(() => {
                        navigate('/home');
                      });

                    } catch (error) {
                      console.error("Error al procesar el pago:", error);
                      Swal.fire('Error', 'Hubo un problema al verificar tu pago. Por favor contacta a soporte.', 'error');
                    }
                    // Quitamos el bloque 'finally' para que no interfiera.
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