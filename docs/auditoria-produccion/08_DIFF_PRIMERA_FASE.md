# Diff por archivo — primera fase

Fecha: 24/11/2026. Rama: `fix/seguridad-envios-preproduccion`. Archivos versionados comparados contra HEAD `ba824d6`; documentación 02/04 comparada con sus copias locales al inicio de la actualización. Archivos nuevos comparados con /dev/null. No incluye el cambio preexistente de package-lock ni reproduce los demás documentos de auditoría previos. El propio documento de diff se excluye para evitar autorreferencia.

## Inventario

- `package.json`
- `src/pages/Admin/components/Returns/ReturnsList.tsx`
- `src/pages/Payment/Payment.tsx`
- `src/pages/Profile/components/MyProfile/MyProfile.tsx`
- `src/pages/Profile/components/OrderDetail/OrderDetail.tsx`
- `src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx`
- `src/pages/Profile/components/Wishlist/Wishlist.tsx`
- `src/pages/auth/RecoverPassword/RecoverPassword.tsx`
- `src/pages/auth/Register/Register.tsx`
- `src/pages/cart/components/CartItem/CartItem.tsx`
- `src/pages/cart/components/CartSummary/CartSummary.tsx`
- `src/services/Shipping.service.ts`
- `src/utils/alerts.ts`
- `src/components/ShippingQuoteGate.tsx`
- `src/hooks/useShippingQuote.ts`
- `src/pages/Admin/components/Returns/ReturnDetailsContent.tsx`
- `src/services/CheckoutShipping.service.ts`
- `src/utils/reactAlert.tsx`
- `src/utils/returnDisplay.ts`
- `src/utils/safeMediaUrl.ts`
- `tests/README.md`
- `tests/register.mjs`
- `tests/shipping-security.test.mjs`
- `docs/auditoria-produccion/02_HALLAZGOS_FRONTEND.md`
- `docs/auditoria-produccion/04_PRUEBAS_FRONTEND.md`
- `docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md`

## package.json

```diff
diff --git a/package.json b/package.json
index 267fc4f..0fba686 100644
--- a/package.json
+++ b/package.json
@@ -8,6 +8,7 @@
     "dev:https": "vite --mode https --host 127.0.0.1",
     "build": "tsc -b && vite build",
     "lint": "eslint .",
+    "test": "node --test tests/*.test.mjs",
     "preview": "vite preview"
   },
   "dependencies": {
```

## src/pages/Admin/components/Returns/ReturnsList.tsx

```diff
diff --git a/src/pages/Admin/components/Returns/ReturnsList.tsx b/src/pages/Admin/components/Returns/ReturnsList.tsx
index 52685dc..b960962 100644
--- a/src/pages/Admin/components/Returns/ReturnsList.tsx
+++ b/src/pages/Admin/components/Returns/ReturnsList.tsx
@@ -1,3 +1,8 @@
+import { showReactAlert } from '../../../../utils/reactAlert';
+import { safeMediaUrl } from '../../../../utils/safeMediaUrl';
+import ReturnDetailsContent from './ReturnDetailsContent';
+import { formatMotivo } from '../../../../utils/returnDisplay';
+import type { ReturnDetails } from './ReturnDetailsContent';
 import { useState, useEffect } from 'react';
 import Swal from 'sweetalert2';
 import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
@@ -33,85 +38,12 @@ const ReturnsList = () => {
         fetchReturns();
     }, []);
 
-    const formatMotivo = (motivo: string) => {
-        if (!motivo) return 'No especificado';
-        const dict: Record<string, string> = {
-            'Dano_envio': 'Daño en envío',
-            'Arrepentimiento': 'Arrepentimiento',
-            'Defecto_fabrica': 'Defecto de fábrica',
-            'Error_producto': 'Producto incorrecto'
-        };
-        return dict[motivo] || motivo.replace(/_/g, ' ');
-    };
-
-    const verDetalles = (ret: any) => {
-        const fotos = ret.evidencias ? ret.evidencias.map((e: any) => e.imagen) : [];
-        const comentarios = ret.comentarios || 'El cliente no dejó comentarios adicionales.';
-        const motivo = formatMotivo(ret.motivo);
-        const cliente = ret.cliente_nombre || 'Cliente';
-        const email = ret.cliente_email || 'Sin correo';
-        
-        let htmlContent = '';
-        
-        const detallesHtml = `
-            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
-                <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
-                    <h5 style="margin: 0 0 8px 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Información del Cliente</h5>
-                    <div style="color: #0f172a; font-weight: 500; font-size: 1rem; display: flex; alignItems: center; gap: 8px;">
-                        <span style="display: inline-block; width: 32px; height: 32px; background: #eff6ff; color: #3b82f6; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 0.9rem;">${cliente.charAt(0)}</span>
-                        <div>
-                            <div>${cliente}</div>
-                            <div style="font-size: 0.85rem; color: #64748b; font-weight: 400;">${email}</div>
-                        </div>
-                    </div>
-                </div>
-
-                <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
-                    <h5 style="margin: 0 0 8px 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Motivo Declarado</h5>
-                    <div style="color: #0f172a; font-weight: 600; font-size: 1.05rem;">
-                        ${motivo}
-                    </div>
-                </div>
-
-                <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex-grow: 1;">
-                    <h5 style="margin: 0 0 8px 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Detalles Adicionales</h5>
-                    <div style="color: #475569; font-size: 0.95rem; white-space: pre-wrap; line-height: 1.6; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px dashed #cbd5e1; text-align: left;">${comentarios}</div>
-                </div>
-            </div>
-        `;
-        
-        if (fotos.length > 0) {
-            const imagesHtml = fotos.map((f: string) => `<div style="background: #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;"><img src="${f}" style="max-width:100%; border-radius:4px; display: block;" /></div>`).join('');
-            htmlContent = `
-                <div style="display: flex; gap: 24px; text-align: left; max-height: 600px; padding-top: 10px;">
-                    <div style="flex: 1; overflow-y: auto; padding-right: 12px;">
-                        <h4 style="margin-top:0; margin-bottom:16px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Evidencia Fotográfica</h4>
-                        ${imagesHtml}
-                    </div>
-                    <div style="flex: 1; overflow-y: auto;">
-                        <h4 style="margin-top:0; margin-bottom:16px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Desglose de la Solicitud</h4>
-                        ${detallesHtml}
-                    </div>
-                </div>
-            `;
-        } else {
-             htmlContent = `
-                <div style="text-align: left; padding-top: 10px;">
-                    <h4 style="margin-top:0; margin-bottom:16px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Desglose de la Solicitud (Sin Fotos)</h4>
-                    ${detallesHtml}
-                </div>
-            `;
-        }
-
-        Swal.fire({
+    const verDetalles = (ret: ReturnDetails) => {
+        void showReactAlert(<ReturnDetailsContent details={ret} />, {
             title: 'Detalles de la Devolución',
-            html: htmlContent,
-            width: fotos.length > 0 ? '900px' : '550px',
-            confirmButtonText: 'Cerrar',
-            confirmButtonColor: '#0f172a',
-            customClass: {
-                popup: 'swal-wide-popup'
-            }
+            width: Array.isArray(ret.evidencias) && ret.evidencias.length > 0 ? '900px' : '550px',
+            confirmButtonText: 'Cerrar', confirmButtonColor: '#0f172a',
+            customClass: { popup: 'swal-wide-popup' },
         });
     };
 
@@ -189,7 +121,7 @@ const ReturnsList = () => {
                 }
             }
         } catch (error: any) {
-            Swal.fire('Error', error.response?.data?.error || 'Ocurrió un error al actualizar el estado', 'error');
+            Swal.fire({ title: 'Error', text: error.response?.data?.error || 'Ocurrió un error al actualizar el estado', icon: 'error' });
         }
     };
 
@@ -319,13 +251,13 @@ const ReturnsList = () => {
                                                     Atendido por: <strong style={{ color: '#475569' }}>{ret.atendido_por_nombre}</strong>
                                                 </span>
                                             )}
-                                            {ret.estado === 'EN_TRANSITO' && ret.url_guia && (
-                                                <a href={ret.url_guia} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>
+                                            {ret.estado === 'EN_TRANSITO' && safeMediaUrl(ret.url_guia) && (
+                                                <a href={safeMediaUrl(ret.url_guia)!} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>
                                                     Ver Guía Inversa
                                                 </a>
                                             )}
-                                            {ret.estado === 'RECHAZADA' && ret.url_guia_rechazo && (
-                                                <a href={ret.url_guia_rechazo} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#ef4444', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
+                                            {ret.estado === 'RECHAZADA' && safeMediaUrl(ret.url_guia_rechazo) && (
+                                                <a href={safeMediaUrl(ret.url_guia_rechazo)!} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#ef4444', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                     Descargar Guía Retorno
                                                 </a>
                                             )}
```

## src/pages/Payment/Payment.tsx

```diff
diff --git a/src/pages/Payment/Payment.tsx b/src/pages/Payment/Payment.tsx
index 353e0f0..7b5404e 100644
--- a/src/pages/Payment/Payment.tsx
+++ b/src/pages/Payment/Payment.tsx
@@ -1,65 +1,79 @@
-import { useState, useEffect, useContext } from 'react';
+import { useState, useEffect, useContext, useRef } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
 import Swal from 'sweetalert2';
 import { CartContext } from '../../contexts/CartContext';
 import { cartService } from '../../services/Cart.service';
 import { paymentService } from '../../services/Payment.service';
-import { shippingService } from '../../services/Shipping.service';
-import type { ShippingRate } from '../../services/Shipping.service';
+import { cartQuoteKey, shippingService } from '../../services/Shipping.service';
+import { revalidateCheckoutShipping } from '../../services/CheckoutShipping.service';
+import { useShippingQuote } from '../../hooks/useShippingQuote';
+import ShippingQuoteGate from '../../components/ShippingQuoteGate';
+import type { ShippingRate, ShippingCartItem } from '../../services/Shipping.service';
 import { addressService } from '../../services/Address.service';
 import styles from './Payment.module.css';
 
+const EMPTY_ITEMS: ShippingCartItem[] = [];
+
 const Payment = () => {
   const navigate = useNavigate();
   const { refreshCart } = useContext(CartContext);
 
   const [cartData, setCartData] = useState<any>(null);
-  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
-  const [availableRates, setAvailableRates] = useState<ShippingRate[]>([]);
   const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
   const [addressDetails, setAddressDetails] = useState<any>(null);
-  const [loading, setLoading] = useState(true);
+  const [loadAttempt, setLoadAttempt] = useState(0);
+  const [loadedAttempt, setLoadedAttempt] = useState(-1);
+  const [checkoutError, setCheckoutError] = useState<string | null>(null);
+  const paymentInProgress = useRef(false);
   const [showShippingOptions, setShowShippingOptions] = useState(false);
 
+  const items: ShippingCartItem[] = cartData?.items ?? EMPTY_ITEMS;
+  const context = { addressId: selectedAddressId ?? 0, cartKey: cartQuoteKey(items, cartData?.total ?? '') };
+  const { quote, selectedRate: shippingRate, loading: loadingQuote, error: quoteError, retry, selectRate } =
+    useShippingQuote(context, items, JSON.stringify([addressDetails, loadAttempt]));
+  const availableRates = quote?.rates ?? [];
+  const loading = loadedAttempt !== loadAttempt;
+
   useEffect(() => {
+    let active = true;
     const fetchData = async () => {
       try {
-        const rate = shippingService.getSelectedRate();
-        const addressIdStr = localStorage.getItem('selectedAddressId');
-
-        if (!rate || !addressIdStr) {
-          Swal.fire('Información incompleta', 'Debes seleccionar una dirección y método de envío primero.', 'warning');
-          navigate('/carrito');
-          return;
-        }
-
-        const addressId = parseInt(addressIdStr);
-        setShippingRate(rate);
-        setSelectedAddressId(addressId);
-
-        const [cart, addr, allRates] = await Promise.all([
-          cartService.getCart(),
-          addressService.getAddresses(),
-          shippingService.getRates(addressId, [])
-        ]);
-
+        const [cart, addresses] = await Promise.all([cartService.getCart(), addressService.getAddresses()]);
+        if (!active) return;
+        let savedId: number | null = null;
+        try {
+          const value = localStorage.getItem('selectedAddressId') || '';
+          if (/^[1-9]\d*$/.test(value)) savedId = Number(value);
+        } catch { /* Storage is optional. */ }
+        const address = addresses.find((candidate: { id: number }) => candidate.id === savedId) ??
+          addresses.find((candidate: { es_principal?: boolean }) => candidate.es_principal) ?? addresses[0];
         setCartData(cart);
-        setAvailableRates(allRates);
-
-        const selectedAddress = addr.find((a: any) => a.id === addressId);
-        setAddressDetails(selectedAddress);
-
-      } catch (error) {
-        console.error("Error al cargar datos de pago:", error);
-        Swal.fire('Error', 'No se pudieron cargar los datos de la orden.', 'error');
+        setSelectedAddressId(address?.id ?? null);
+        setAddressDetails(address ?? null);
+        setCheckoutError(address ? null : 'Agrega una dirección válida en tu perfil para continuar.');
+      } catch {
+        if (!active) return;
+        setCartData(null);
+        setSelectedAddressId(null);
+        setAddressDetails(null);
+        setCheckoutError('No se pudieron cargar los datos del checkout. Intenta de nuevo.');
       } finally {
-        setLoading(false);
+        if (active) setLoadedAttempt(loadAttempt);
       }
     };
+    void fetchData();
+    return () => { active = false; };
+  }, [loadAttempt]);
 
-    fetchData();
-  }, [navigate]);
+  useEffect(() => {
+    const invalidate = () => {
+      if (!paymentInProgress.current) setLoadAttempt(value => value + 1);
+    };
+    window.addEventListener('focus', invalidate);
+    window.addEventListener('storage', invalidate);
+    return () => { window.removeEventListener('focus', invalidate); window.removeEventListener('storage', invalidate); };
+  }, []);
 
   if (loading) {
     return (
@@ -70,6 +84,14 @@ const Payment = () => {
     );
   }
 
+  if (checkoutError) {
+    return <div className={styles.paymentContainer} role="alert">
+      <p>{checkoutError}</p>
+      <button type="button" onClick={() => setLoadAttempt(value => value + 1)}>Reintentar</button>
+      <Link to="/perfil/direcciones">Revisar direcciones</Link>
+    </div>;
+  }
+
   if (!cartData || !cartData.items || cartData.items.length === 0) {
     return (
       <div className={styles.paymentContainer}>
@@ -87,8 +109,7 @@ const Payment = () => {
   const total = subtotal + shippingCost;
 
   const handleSelectRate = (rate: ShippingRate) => {
-    setShippingRate(rate);
-    shippingService.saveSelectedRate(rate);
+    selectRate(rate.id);
     setShowShippingOptions(false);
   };
 
@@ -234,7 +255,7 @@ const Payment = () => {
             </div>
             <div className={styles.totalRow}>
               <span>Envío ({shippingRate?.title})</span>
-              <span>${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
+              <span>{shippingRate ? `$${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Pendiente de cotización'}</span>
             </div>
             <div className={styles.totalRow}>
               <span>IVA (16%)</span>
@@ -242,11 +263,16 @@ const Payment = () => {
             </div>
             <div className={`${styles.totalRow} ${styles.grandTotal}`}>
               <span>Total a Pagar</span>
-              <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
+              <span>{shippingRate ? `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Pendiente de cotización'}</span>
             </div>
           </div>
 
-          {selectedAddressId && (
+          {(quoteError || loadingQuote) && <div role="status">
+            <p>{quoteError || 'Cotizando envío...'}</p>
+            {quoteError && <button type="button" onClick={retry}>Reintentar cotización</button>}
+          </div>}
+          <ShippingQuoteGate quote={quote} context={context} selectedRateId={shippingRate?.id ?? null}>
+          {selectedAddressId && shippingRate && (
             <div className={styles.paypalContainer}>
               <PayPalScriptProvider options={{
                 clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
@@ -254,9 +280,13 @@ const Payment = () => {
               }}>
                 <PayPalButtons
                   style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
-                  forceReRender={[selectedAddressId, cartData, total]}
-                  createOrder={(_data, actions) => {
-                    return actions.order.create({
+                  forceReRender={[selectedAddressId, cartData, total, shippingRate.id, shippingRate.internalProvider, quote?.expiresAt]}
+                  onClick={() => { paymentInProgress.current = true; }}
+                  onCancel={() => { paymentInProgress.current = false; }}
+                  createOrder={async (_data, actions) => {
+                    try {
+                      await revalidateCheckoutShipping(quote, context, shippingRate.id, addressDetails);
+                      return await actions.order.create({
                       intent: "CAPTURE",
                       purchase_units: [
                         {
@@ -267,11 +297,17 @@ const Payment = () => {
                           description: `Compra en CSTI - ${cartData?.items?.length || 0} productos`
                         }
                       ]
-                    });
+                      });
+                    } catch (error) {
+                      paymentInProgress.current = false;
+                      shippingService.clearSelectedRate();
+                      setLoadAttempt(value => value + 1);
+                      throw error;
+                    }
                   }}
                   onApprove={async (data, _actions) => {
                     try {
-                      const carrierName = shippingRate ? `${shippingRate.internalProvider || shippingRate.title}` : "FedEx Express";
+                      const carrierName = shippingRate.internalProvider;
                       await paymentService.verifyPayment(data.orderID, selectedAddressId, shippingCost, carrierName);
 
                       shippingService.clearSelectedRate();
@@ -289,10 +325,13 @@ const Payment = () => {
                     } catch (error: any) {
                       console.error("Error en la verificación:", error);
                       const errorMsg = error.response?.data?.error || 'El pago se autorizó pero hubo un problema al registrarlo.';
-                      Swal.fire('Error', errorMsg, 'error');
+                      Swal.fire({ title: 'Error', text: errorMsg, icon: 'error' });
+                    } finally {
+                      paymentInProgress.current = false;
                     }
                   }}
                   onError={(err) => {
+                    paymentInProgress.current = false;
                     console.error("PayPal Error:", err);
                     Swal.fire('Error', 'Ocurrió un error con la pasarela de PayPal.', 'error');
                   }}
@@ -300,6 +339,7 @@ const Payment = () => {
               </PayPalScriptProvider>
             </div>
           )}
+          </ShippingQuoteGate>
         </aside>
       </div>
     </div>
```

## src/pages/Profile/components/MyProfile/MyProfile.tsx

```diff
diff --git a/src/pages/Profile/components/MyProfile/MyProfile.tsx b/src/pages/Profile/components/MyProfile/MyProfile.tsx
index a81e06d..01fb2e7 100644
--- a/src/pages/Profile/components/MyProfile/MyProfile.tsx
+++ b/src/pages/Profile/components/MyProfile/MyProfile.tsx
@@ -68,7 +68,7 @@ const MyProfile = () => {
         timer: 2000,
       });
     } catch (error: any) {
-      Swal.fire('Error', error.response?.data?.error || 'No se pudo actualizar', 'error');
+      Swal.fire({ title: 'Error', text: error.response?.data?.error || 'No se pudo actualizar', icon: 'error' });
     }
   };
 
@@ -93,7 +93,7 @@ const MyProfile = () => {
         error.response?.data?.errores ||
         (error.response?.data?.error ? [error.response.data.error] : ['Ocurrió un error']);
 
-      const mensaje = errMsgs.join('<br/>');
+      const mensaje = errMsgs.join('\n');
       let titulo = 'Error de seguridad';
 
       if (mensaje.toLowerCase().includes('anterior') || mensaje.toLowerCase().includes('actual')) {
@@ -103,7 +103,7 @@ const MyProfile = () => {
       Swal.fire({
         icon: 'warning',
         title: titulo,
-        html: mensaje,
+        text: mensaje,
         confirmButtonColor: '#00b8d4',
       });
     }
```

## src/pages/Profile/components/OrderDetail/OrderDetail.tsx

```diff
diff --git a/src/pages/Profile/components/OrderDetail/OrderDetail.tsx b/src/pages/Profile/components/OrderDetail/OrderDetail.tsx
index 872858f..03c0f75 100644
--- a/src/pages/Profile/components/OrderDetail/OrderDetail.tsx
+++ b/src/pages/Profile/components/OrderDetail/OrderDetail.tsx
@@ -1,19 +1,22 @@
 import { useEffect, useState } from 'react';
 import { useParams, Link } from 'react-router-dom';
 import { orderService } from '../../../../services/Order.service';
+import type { TrackingData } from '../../../../services/Shipping.service';
 import { shippingService } from '../../../../services/Shipping.service';
 import { billingService } from '../../../../services/Billing.service';
 import { returnsService } from '../../../../services/Returns.service';
 import type { ReturnRequest } from '../../../../services/Returns.service';
 import ReturnModal from '../Returns/ReturnModal';
 import Swal from 'sweetalert2';
+import { showReactAlert } from '../../../../utils/reactAlert';
+import { safeMediaUrl } from '../../../../utils/safeMediaUrl';
 import TrackingTimeline from './TrackingTimeline';
 import styles from './OrderDetail.module.css';
 
 const OrderDetail = () => {
   const { id } = useParams<{ id: string }>();
   const [order, setOrder] = useState<any>(null);
-  const [trackingData, setTrackingData] = useState<any>(null);
+  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
   const [loading, setLoading] = useState(true);
   const [generatingInvoice, setGeneratingInvoice] = useState(false);
 
@@ -24,12 +27,11 @@ const OrderDetail = () => {
     const fetchOrder = async () => {
       try {
         const orderData = await orderService.getOrderById(id);
-        const tracking = await shippingService.getTracking(id as string, orderData);
-        const retStatus = await returnsService.getReturnStatus(id as string);
-
         setOrder(orderData);
+        const tracking = await shippingService.getTracking(id as string, orderData);
         setTrackingData(tracking);
-        setReturnStatus(retStatus);
+        try { setReturnStatus(await returnsService.getReturnStatus(id as string)); }
+        catch { /* Post-sale errors must not hide confirmed tracking. */ }
       } catch (error) {
         console.error("Error fetching order detail:", error);
       } finally {
@@ -160,7 +162,7 @@ const OrderDetail = () => {
       return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
           <a
-            href={returnStatus.url_guia || '#'}
+            href={safeMediaUrl(returnStatus.url_guia) ?? undefined}
             target="_blank"
             rel="noopener noreferrer"
             style={{ background: '#28a745', color: '#fff', textDecoration: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, display: 'inline-block' }}
@@ -197,32 +199,20 @@ const OrderDetail = () => {
         <button
           onClick={() => {
             if (returnStatus.motivo_rechazo) {
-              Swal.fire({
-                icon: 'error',
-                title: 'Solicitud Rechazada',
-                html: `
-                    <div style="text-align: left; margin-top: 10px; font-size: 0.95rem; color: #334155;">
-                      <div style="margin-bottom: 16px;">
-                        <strong>Motivo del rechazo:</strong>
-                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px; color: #475569;">
-                          ${returnStatus.motivo_rechazo}
-                        </div>
-                      </div>
-                      
-                      <strong>¿Qué sucede ahora?</strong>
-                      <ul style="margin-top: 8px; padding-left: 20px; color: #475569; font-size: 0.9rem; line-height: 1.5;">
-                        <li style="margin-bottom: 6px;">Si el producto aún está contigo, la solicitud queda cerrada de forma definitiva.</li>
-                        ${returnStatus.url_guia_rechazo
-                    ? `<li style="margin-bottom: 6px;"><strong>Tu paquete va de regreso.</strong> El producto ha sido re-empaquetado en nuestra bodega y enviado de vuelta a tu domicilio. Puedes descargar la etiqueta y rastrear el paquete con el número: <strong>${returnStatus.numero_de_guia_rechazo}</strong>.
-                              <br><br>
-                              <a href="${returnStatus.url_guia_rechazo}" target="_blank" style="display:inline-block; padding: 6px 12px; background: #0d47a1; color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Descargar Guía de Regreso</a>
-                             </li>`
-                    : `<li style="margin-bottom: 6px;">Si el producto ya se encontraba en nuestra bodega, un asesor te contactará para coordinar el retorno del artículo a tu domicilio (el costo de paquetería será cubierto por el cliente).</li>`
-                  }
-                        <li>Para dudas o aclaraciones, contacta a <a href="mailto:ventas@csti.com.mx" style="color: #0d47a1; font-weight: 600; text-decoration: none;">Soporte CSTI</a>.</li>
-                      </ul>
-                    </div>
-                `,
+              const guide = safeMediaUrl(returnStatus.url_guia_rechazo);
+              showReactAlert(<div style={{ textAlign: 'left', fontSize: '0.95rem', color: '#334155' }}>
+                <strong>Motivo del rechazo:</strong>
+                <p style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{returnStatus.motivo_rechazo}</p>
+                <strong>¿Qué sucede ahora?</strong>
+                <ul>
+                  <li>Si el producto aún está contigo, la solicitud queda cerrada de forma definitiva.</li>
+                  {guide ? <li>Tu paquete va de regreso. El producto ha sido re-empaquetado en nuestra bodega y enviado de vuelta a tu domicilio. Guía: {returnStatus.numero_de_guia_rechazo}
+                    <p><a href={guide} target="_blank" rel="noopener noreferrer">Descargar Guía de Regreso</a></p>
+                  </li> : <li>Si el producto ya se encontraba en nuestra bodega, un asesor te contactará para coordinar el retorno del artículo a tu domicilio (el costo de paquetería será cubierto por el cliente).</li>}
+                  <li>Para dudas o aclaraciones, contacta a <a href="mailto:ventas@csti.com.mx">Soporte CSTI</a>.</li>
+                </ul>
+              </div>, {
+                icon: 'error', title: 'Solicitud Rechazada',
                 confirmButtonColor: '#0d47a1',
                 confirmButtonText: 'Entendido',
                 width: '600px'
@@ -314,7 +304,7 @@ const OrderDetail = () => {
 
       <div style={{ marginBottom: '30px' }}>
         <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Rastreo de Envío</h3>
-        <TrackingTimeline trackingData={trackingData} order={order} />
+        <TrackingTimeline trackingData={trackingData} />
       </div>
 
       <div className={styles.itemsCard}>
```

## src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx

```diff
diff --git a/src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx b/src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx
index 789f420..1743a65 100644
--- a/src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx
+++ b/src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx
@@ -1,42 +1,29 @@
 import styles from './TrackingTimeline.module.css';
 
-interface TrackingData {
-  carrier: string;
-  tracking_number: string;
-  status: string;
-  estimated_delivery: string;
-  delivered_date?: string | null;
-  destination_city?: string;
-  url_guia?: string | null;
-}
-
-interface TrackingTimelineProps {
-  trackingData: TrackingData | null;
-  order?: any;
-}
+import type { TrackingData } from '../../../../services/Shipping.service';
+interface TrackingTimelineProps { trackingData: TrackingData | null }
 
 const TrackingTimeline = ({ trackingData }: TrackingTimelineProps) => {
   if (!trackingData) {
     return (
       <div className={styles.timelineContainer}>
         <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>
-          Información de rastreo no disponible aún.
+          Rastreo temporalmente no disponible
         </p>
       </div>
     );
   }
 
-  const isDelivered = trackingData.status === 'ENTREGADO' || trackingData.status === 'COMPLETADO';
+  const isDelivered = trackingData.status === 'ENTREGADO';
   const isInTransit = trackingData.status === 'EN_TRANSITO' || trackingData.status === 'RECOLECTADO';
-  const isCreated = trackingData.status === 'CREADO';
 
   const getTrackingUrl = (carrier: string, trackingNumber: string) => {
-    if (!carrier || !trackingNumber) return '#';
+    if (!carrier || !trackingNumber) return null;
     const c = carrier.toLowerCase();
-    if (c.includes('dhl')) return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${trackingNumber}`;
-    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
+    if (c.includes('dhl')) return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${encodeURIComponent(trackingNumber)}`;
+    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
     if (c.includes('estafeta')) return `https://www.estafeta.com/Herramientas/Rastreo`;
-    return `https://www.google.com/search?q=rastreo+${carrier}+${trackingNumber}`;
+    return null;
   };
 
   return (
@@ -53,14 +40,15 @@ const TrackingTimeline = ({ trackingData }: TrackingTimelineProps) => {
         </div>
         <div className={styles.bannerText}>
           <h2 className={styles.bannerTitle}>
-            {isDelivered ? 'Entregado' : isInTransit ? 'En camino' : 'En preparación'}
+            {isDelivered ? 'Entregado' : isInTransit ? 'En camino' : trackingData.status || 'Estado no disponible'}
           </h2>
           <p className={styles.bannerSubtitle}>
-            {isDelivered ? 'El paquete ha sido entregado exitosamente.' : isCreated ? 'Tu pedido está siendo procesado en el almacén.' : 'Tu paquete está en manos de la paquetería.'}
+            {trackingData.message || 'Estado confirmado por el backend de rastreo.'}
           </p>
         </div>
       </div>
 
+      {trackingData.estimated_delivery && <p>Fecha estimada por la paquetería: {new Date(trackingData.estimated_delivery).toLocaleDateString('es-MX')}. No constituye confirmación de entrega.</p>}
       <div className={styles.carrierCard} style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '12px' }}>
         <div className={styles.carrierLeft}>
           <div style={{
@@ -78,16 +66,16 @@ const TrackingTimeline = ({ trackingData }: TrackingTimelineProps) => {
             </svg>
           </div>
           <div>
-            <h4 className={styles.carrierTitle}>{trackingData.carrier || 'Envío Estándar'}</h4>
+            <h4 className={styles.carrierTitle}>{trackingData.carrier || 'Transportista no informado'}</h4>
             <p className={styles.carrierCode}>
               Guía de rastreo: <strong>{trackingData.tracking_number || 'Aún no asignada'}</strong>
             </p>
           </div>
         </div>
 
-        {trackingData.tracking_number && (
+        {trackingData.tracking_number && trackingData.carrier && getTrackingUrl(trackingData.carrier, trackingData.tracking_number) && (
           <a
-            href={getTrackingUrl(trackingData.carrier, trackingData.tracking_number)}
+            href={getTrackingUrl(trackingData.carrier, trackingData.tracking_number)!}
             target="_blank"
             rel="noopener noreferrer"
             className={styles.pdfButton}
```

## src/pages/Profile/components/Wishlist/Wishlist.tsx

```diff
diff --git a/src/pages/Profile/components/Wishlist/Wishlist.tsx b/src/pages/Profile/components/Wishlist/Wishlist.tsx
index d36d117..d97eb07 100644
--- a/src/pages/Profile/components/Wishlist/Wishlist.tsx
+++ b/src/pages/Profile/components/Wishlist/Wishlist.tsx
@@ -61,7 +61,7 @@ const Wishlist = () => {
         toast: true,
         position: 'top-end',
         icon: 'error',
-        title: error.response?.data?.error || 'Error al agregar',
+        titleText: error.response?.data?.error || 'Error al agregar',
         showConfirmButton: false,
         timer: 3000,
       });
```

## src/pages/auth/RecoverPassword/RecoverPassword.tsx

```diff
diff --git a/src/pages/auth/RecoverPassword/RecoverPassword.tsx b/src/pages/auth/RecoverPassword/RecoverPassword.tsx
index 1bf5219..d66d3d1 100644
--- a/src/pages/auth/RecoverPassword/RecoverPassword.tsx
+++ b/src/pages/auth/RecoverPassword/RecoverPassword.tsx
@@ -161,7 +161,7 @@ const RecoverPassword = () => {
       let titulo = 'Contraseña insegura';
 
       if (error.response?.data?.errores) {
-        mensajeError = error.response.data.errores.join('<br>');
+        mensajeError = error.response.data.errores.join('\n');
       } else if (error.response?.data?.error) {
         mensajeError = error.response.data.error;
         if (mensajeError.toLowerCase().includes('actual') || mensajeError.toLowerCase().includes('anterior')) {
@@ -172,7 +172,7 @@ const RecoverPassword = () => {
       Swal.fire({
         icon: 'warning',
         title: titulo,
-        html: mensajeError,
+        text: mensajeError,
         confirmButtonColor: '#00b8d4',
       });
     } finally {
```

## src/pages/auth/Register/Register.tsx

```diff
diff --git a/src/pages/auth/Register/Register.tsx b/src/pages/auth/Register/Register.tsx
index 7ceb31b..0fceae3 100644
--- a/src/pages/auth/Register/Register.tsx
+++ b/src/pages/auth/Register/Register.tsx
@@ -92,7 +92,7 @@ const Register = () => {
       appAlert({
         icon: 'warning',
         title: 'Verifica tus datos',
-        html: emailError,
+        text: emailError,
         confirmButtonColor: '#00b5e2',
       });
       setCargando(false);
@@ -124,14 +124,14 @@ const Register = () => {
       let backendErrors = 'Ocurrio un error inesperado al registrar.';
 
       if (error.response?.data?.errores) {
-        backendErrors = error.response.data.errores.join('<br>');
+        backendErrors = error.response.data.errores.join('\n');
       }
 
       closeAppAlert();
       await appAlert({
         icon: 'error',
         title: 'No se pudo crear la cuenta',
-        html: backendErrors,
+        text: backendErrors,
         confirmButtonColor: '#00b5e2',
       });
       appToast('error', 'Registro no completado', 'Revisa los datos e intenta de nuevo.');
```

## src/pages/cart/components/CartItem/CartItem.tsx

```diff
diff --git a/src/pages/cart/components/CartItem/CartItem.tsx b/src/pages/cart/components/CartItem/CartItem.tsx
index 56d679b..593fbfa 100644
--- a/src/pages/cart/components/CartItem/CartItem.tsx
+++ b/src/pages/cart/components/CartItem/CartItem.tsx
@@ -25,7 +25,7 @@ const CartItem = ({ item, onUpdateQty, onRemove }: CartItemProps) => {
         toast: true,
         position: 'top-end',
         icon: 'error',
-        title: `Solo hay ${producto.disponible} unidades disponibles`,
+        titleText: `Solo hay ${producto.disponible} unidades disponibles`,
         showConfirmButton: false,
         timer: 3000,
       });
```

## src/pages/cart/components/CartSummary/CartSummary.tsx

```diff
diff --git a/src/pages/cart/components/CartSummary/CartSummary.tsx b/src/pages/cart/components/CartSummary/CartSummary.tsx
index de16ec1..18fa9bc 100644
--- a/src/pages/cart/components/CartSummary/CartSummary.tsx
+++ b/src/pages/cart/components/CartSummary/CartSummary.tsx
@@ -1,49 +1,53 @@
 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { addressService } from '../../../../services/Address.service';
-import { shippingService } from '../../../../services/Shipping.service';
-import type { ShippingRate } from '../../../../services/Shipping.service';
+import { cartQuoteKey } from '../../../../services/Shipping.service';
+import { useShippingQuote } from '../../../../hooks/useShippingQuote';
+import type { ShippingCartItem } from '../../../../services/Shipping.service';
 import styles from '../CartSummary/CartSummary.module.css';
 
 interface CartSummaryProps {
   total: number;
-  items: any[];
+  items: ShippingCartItem[];
 }
 
 const CartSummary = ({ total, items }: CartSummaryProps) => {
   const navigate = useNavigate();
   
-  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
-  const [address, setAddress] = useState<any>(null);
-  const [loadingShipping, setLoadingShipping] = useState(true);
+  const [address, setAddress] = useState<{ id: number; codigo_postal: string } | null>(null);
+  const [addressError, setAddressError] = useState<string | null>(null);
+  const [addressAttempt, setAddressAttempt] = useState(0);
   const [isAtBottom, setIsAtBottom] = useState(false);
-  
-  const itemsKey = items?.map((i: any) => `${i.id}-${i.cantidad}`).join(',');
+  const context = { addressId: address?.id ?? 0, cartKey: cartQuoteKey(items, total) };
+  const { quote, selectedRate: shippingRate, loading: loadingShipping, error: quoteError } =
+    useShippingQuote(context, items, JSON.stringify(address));
 
   useEffect(() => {
-    const fetchDefaultShipping = async () => {
-      setLoadingShipping(true);
+    let active = true;
+    addressService.getAddresses().then((addresses: { id: number; codigo_postal: string; es_principal?: boolean }[]) => {
+      if (!active) return;
+      const principal = addresses.find(candidate => candidate.es_principal) ?? addresses[0] ?? null;
+      setAddress(principal);
+      setAddressError(principal ? null : 'Agrega una dirección en tu perfil para continuar.');
       try {
-        const addresses = await addressService.getAddresses();
-        if (addresses && addresses.length > 0) {
-          const principal = addresses.find((a: any) => a.es_principal) || addresses[0];
-          setAddress(principal);
-
-          const defaultRate = await shippingService.getDefaultRate(principal.id, items);
-          setShippingRate(defaultRate);
-          
-          shippingService.saveSelectedRate(defaultRate);
-          localStorage.setItem('selectedAddressId', principal.id.toString());
-        }
-      } catch (error) {
-        console.error("Error obteniendo envío por defecto:", error);
-      } finally {
-        setLoadingShipping(false);
-      }
-    };
+        if (principal) localStorage.setItem('selectedAddressId', String(principal.id));
+        else localStorage.removeItem('selectedAddressId');
+      } catch { /* Storage is optional. */ }
+    }).catch(() => {
+      if (!active) return;
+      setAddress(null);
+      setAddressError('No se pudieron cargar tus direcciones. Intenta de nuevo.');
+    });
+    return () => { active = false; };
+  }, [addressAttempt]);
+
+  useEffect(() => {
+    const invalidate = () => { setAddress(null); setAddressAttempt(value => value + 1); };
+    window.addEventListener('focus', invalidate);
+    window.addEventListener('storage', invalidate);
+    return () => { window.removeEventListener('focus', invalidate); window.removeEventListener('storage', invalidate); };
+  }, []);
 
-    fetchDefaultShipping();
-  }, [itemsKey]);
 
   useEffect(() => {
     const marker = document.getElementById('cart-bottom-marker');
@@ -65,7 +69,7 @@ const CartSummary = ({ total, items }: CartSummaryProps) => {
   }, [total]);
 
   const handleCheckout = () => {
-    navigate('/payment');
+    if (quote && shippingRate && address) navigate('/payment');
   };
 
   const finalTotal = Number(total) + (shippingRate?.price || 0);
@@ -102,14 +106,18 @@ const CartSummary = ({ total, items }: CartSummaryProps) => {
         <div className={`${styles.summaryRow} ${styles.total}`}>
           <span className={styles.labelTotal}>Total</span>
           <span className={styles.valueTotal}>
-            ${Number(finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
+            {shippingRate ? `$${Number(finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Pendiente de cotización'}
           </span>
         </div>
 
-        <button 
+        {(addressError || quoteError) && <div role="alert">
+          <p>{addressError || quoteError}</p>
+          <button type="button" onClick={() => { setAddress(null); setAddressAttempt(value => value + 1); }}>Reintentar cotización</button>
+        </div>}
+        <button
           className={styles.btnCheckout} 
           onClick={handleCheckout}
-          disabled={loadingShipping}
+          disabled={loadingShipping || !quote || !shippingRate || !address}
         >
           {loadingShipping ? 'Espere...' : 'Continuar'}
         </button>
```

## src/services/Shipping.service.ts

```diff
diff --git a/src/services/Shipping.service.ts b/src/services/Shipping.service.ts
index 2951c43..90d0267 100644
--- a/src/services/Shipping.service.ts
+++ b/src/services/Shipping.service.ts
@@ -1,235 +1,132 @@
-import api from './Api.service';
+﻿import api from './Api.service';
 
 export interface ShippingRate {
   id: string;
   type: 'standard' | 'express';
   title: string;
   description: string;
-  days: number;
+  days: number | null;
   price: number;
   internalProvider: string;
 }
-
-const mockRates: ShippingRate[] = [
-  {
-    id: 'estandar_cva',
-    type: 'standard',
-    title: 'Envío Estándar Nacional',
-    description: 'Llega entre 3 a 5 días hábiles.',
-    days: 4,
-    price: 150.0,
-    internalProvider: 'CVA'
-  }
-];
-
+export interface ShippingCartItem {
+  id?: number;
+  producto?: { id: number };
+  product?: { id: number };
+  cantidad: number;
+  precio_unitario?: number | string;
+}
+export interface QuoteContext { addressId: number; cartKey: string }
+export interface ShippingQuote extends QuoteContext { rates: ShippingRate[]; expiresAt: number }
+export interface TrackingData {
+  carrier: string | null;
+  tracking_number: string | null;
+  status: string | null;
+  estimated_delivery: string | null;
+  delivered_date: string | null;
+  source: 'tracking' | 'order' | 'unavailable';
+  message: string | null;
+}
+export class ShippingError extends Error {
+  constructor(message: string) { super(message); this.name = 'ShippingError'; }
+}
+const record = (value: unknown): Record<string, unknown> =>
+  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
+const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
+const money = (value: unknown): number | null => {
+  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value))) return null;
+  const amount = Number(value);
+  return Number.isFinite(amount) && amount >= 0 ? amount : null;
+};
+export function cartQuoteKey(items: ShippingCartItem[], total: number | string): string {
+  return JSON.stringify([String(total), items.map(item => [item.producto?.id ?? item.product?.id ?? item.id,
+    item.cantidad, String(item.precio_unitario ?? '')]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
+}
+export function validateRates(data: unknown): ShippingRate[] {
+  const rates = record(data).rates;
+  if (!Array.isArray(rates)) throw new ShippingError('La respuesta de cotización no es válida. Intenta de nuevo.');
+  if (!rates.length) throw new ShippingError('No hay envíos disponibles para esta dirección y carrito.');
+  const ids = new Set<string>();
+  return rates.map(value => {
+    const rate = record(value);
+    const id = text(rate.id) ?? (typeof rate.id === 'number' && Number.isSafeInteger(rate.id) && rate.id > 0 ? String(rate.id) : null);
+    const title = text(rate.title), carrier = text(rate.carrier), price = money(rate.price);
+    if (!id || !title || !carrier || price === null || ids.has(id)) throw new ShippingError('La cotización contiene tarifas inválidas. Intenta de nuevo.');
+    ids.add(id);
+    const days = typeof rate.estimated_days === 'number' && Number.isFinite(rate.estimated_days) && rate.estimated_days >= 0 ? rate.estimated_days : null;
+    const estimate = text(rate.estimated_days) ?? (days !== null ? String(days) : null);
+    return { id, title, price, internalProvider: carrier,
+      type: title.toLowerCase().includes('express') ? 'express' : 'standard',
+      description: estimate ? `Entrega estimada: ${estimate}` : 'Plazo no informado por la paquetería.', days };
+  });
+}
+export function isQuoteCurrent(quote: ShippingQuote | null, context: QuoteContext): quote is ShippingQuote {
+  return !!quote && quote.addressId === context.addressId && quote.cartKey === context.cartKey &&
+    quote.expiresAt > Date.now() && quote.rates.length > 0;
+}
+// Storage is a method preference only. Prices are never restored from it.
+const readPreference = (context: QuoteContext): string | null => {
+  try {
+    const value = record(JSON.parse(localStorage.getItem('selectedShippingRate') || 'null'));
+    if (value.version === 1 && value.addressId === context.addressId && value.cartKey === context.cartKey && text(value.rateId)) return value.rateId as string;
+    localStorage.removeItem('selectedShippingRate');
+  } catch { /* Storage disabled or corrupt: fresh quotes still work. */ }
+  return null;
+};
+const dateText = (value: unknown): string | null => {
+  const candidate = text(value);
+  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
+};
 export const shippingService = {
-  getRates: async (addressId: number, cartItems: any[] = []): Promise<ShippingRate[]> => {
-    if (!addressId) {
-      return mockRates;
-    }
+  getRates: async (addressId: number, cartItems: ShippingCartItem[] = []): Promise<ShippingRate[]> => {
+    if (!Number.isSafeInteger(addressId) || addressId <= 0) throw new ShippingError('Selecciona una dirección válida para cotizar.');
     try {
-      const productIds = cartItems.map(item => item.product?.id || item.producto?.id || item.id).filter(id => id);
-      const response = await api.post('/api/pagos/envios/cotizar/', { 
-        direccionID: addressId,
-        productos: productIds 
-      });
-      if (response.data && response.data.rates && response.data.rates.length > 0) {
-        return response.data.rates.map((rate: any) => ({
-          id: rate.id,
-          type: (rate.title.toLowerCase().includes('express') || rate.price > 170) ? 'express' : 'standard',
-          title: rate.title,
-          description: `Entrega estimada: ${rate.estimated_days}`,
-          days: rate.title.toLowerCase().includes('express') ? 1 : 4,
-          price: rate.price,
-          internalProvider: rate.carrier
-        }));
-      }
-    } catch (err) {
-      console.warn("No se pudieron cotizar tarifas de Envia en vivo, usando respaldo:", err);
+      const productIds = cartItems.map(item => item.product?.id ?? item.producto?.id ?? item.id).filter(id => Number.isSafeInteger(id) && Number(id) > 0);
+      const response = await api.post('/api/pagos/envios/cotizar/', { direccionID: addressId, productos: productIds }, { timeout: 15000 });
+      return validateRates(response.data);
+    } catch (error) {
+      if (error instanceof ShippingError) throw error;
+      throw new ShippingError('No fue posible cotizar el envío. Revisa tu conexión e intenta de nuevo.');
     }
-    return mockRates;
   },
-
-  getDefaultRate: async (addressId: number, cartItems: any[] = []): Promise<ShippingRate> => {
-    try {
-      const rates = await shippingService.getRates(addressId, cartItems);
-      if (rates && rates.length > 0) {
-        return rates.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
-      }
-    } catch (e) {
-      console.warn("Error getting default rate, falling back to mock");
-    }
-    return mockRates[0];
-  },
-
-  saveSelectedRate: (rate: ShippingRate) => {
-    localStorage.setItem('selectedShippingRate', JSON.stringify(rate));
+  getQuote: async (context: QuoteContext, items: ShippingCartItem[]): Promise<ShippingQuote> => ({
+    ...context, rates: await shippingService.getRates(context.addressId, items),
+    // Client freshness limit; backend must still validate its own quote expiry.
+    expiresAt: Date.now() + 5 * 60 * 1000,
+  }),
+  getDefaultRate: async (addressId: number, items: ShippingCartItem[] = []): Promise<ShippingRate> => {
+    const rates = await shippingService.getRates(addressId, items);
+    return rates.reduce((prev, curr) => prev.price <= curr.price ? prev : curr);
   },
-
-  getSelectedRate: (): ShippingRate | null => {
-    const rate = localStorage.getItem('selectedShippingRate');
-    return rate ? JSON.parse(rate) : null;
+  saveSelectedRate: (rate: ShippingRate, context: QuoteContext) => {
+    try { localStorage.setItem('selectedShippingRate', JSON.stringify({ version: 1, rateId: rate.id, ...context })); }
+    catch { /* Persistence is optional. */ }
   },
-
+  getSelectedRateId: readPreference,
   clearSelectedRate: () => {
-    localStorage.removeItem('selectedShippingRate');
+    try { localStorage.removeItem('selectedShippingRate'); } catch { /* Optional storage. */ }
+  },
+  getTracking: async (orderId: string, orderData: unknown = {}): Promise<TrackingData> => {
+    const order = record(orderData);
+    const fallback: TrackingData = {
+      carrier: text(order.paqueteria), tracking_number: text(order.numero_de_guia), status: text(order.estado_envio),
+      estimated_delivery: null, delivered_date: null, source: 'order',
+      message: 'Rastreo temporalmente no disponible. Se muestra el último estado confirmado por el backend.',
+    };
+    try {
+      if (!orderId || orderId === 'undefined') throw new Error('Missing order');
+      const response = await api.get(`/api/pagos/envios/rastrear/${encodeURIComponent(orderId)}/`, { timeout: 15000 });
+      const data = record(response.data);
+      // Unknown provider payloads must not be interpreted as proof of delivery.
+      const status = text(data.status), tracking = text(data.tracking_number);
+      if (!status && !tracking) throw new Error('No confirmed tracking fields');
+      return { carrier: text(data.carrier) ?? fallback.carrier, tracking_number: tracking ?? fallback.tracking_number,
+        status: status ?? fallback.status, estimated_delivery: dateText(data.estimated_delivery),
+        delivered_date: status === 'ENTREGADO' ? dateText(data.delivered_date) : null, source: 'tracking', message: null };
+    } catch {
+      return fallback.status || fallback.tracking_number ? fallback : {
+        ...fallback, source: 'unavailable', message: 'Rastreo temporalmente no disponible',
+      };
+    }
   },
-
-  getTracking: async (orderId: string, orderData?: any) => {
-    return new Promise(async (resolve) => {
-      const carrier = orderData?.paqueteria || 'FedEx Express';
-      const tracking_number = orderData?.numero_de_guia || '782349102384';
-      let status = orderData?.estado_envio || 'CREADO';
-      const url_guia = orderData?.url_guia || null;
-
-      try {
-        if (orderId && orderId !== 'undefined') {
-          const res = await api.get(`/api/pagos/envios/rastrear/${orderId}/`);
-          if (res.data && res.data.live_tracking) {
-            console.log("📍 [Envia.com API] Datos de rastreo en vivo recibidos:", res.data.live_tracking);
-            if (res.data.status) status = res.data.status;
-          }
-        }
-      } catch (err) {
-        console.log("Nota: Consultando rastreo (usando respaldo logístico para Sandbox):", err);
-      }
-
-      const baseDate = orderData?.creado_en ? new Date(orderData.creado_en) : new Date();
-      const carrierLower = String(carrier || '').toLowerCase();
-
-      let deliveryDays = 3;
-      if (carrierLower.includes('dhl') || carrierLower.includes('siguiente') || carrierLower.includes('domestic')) {
-        deliveryDays = 1;
-      } else if (carrierLower.includes('fedex') || carrierLower.includes('saver') || carrierLower.includes('express')) {
-        deliveryDays = 2;
-      } else if (carrierLower.includes('estafeta') || carrierLower.includes('terrestre') || carrierLower.includes('estándar')) {
-        deliveryDays = 4;
-      }
-
-      const t_creado = new Date(baseDate.getTime());
-      const t_recolectado = new Date(baseDate.getTime() + 1000 * 60 * 60 * (deliveryDays === 1 ? 2 : 4));
-      const t_transito_1 = new Date(baseDate.getTime() + 1000 * 60 * 60 * (deliveryDays === 1 ? 8 : 14));
-      const t_transito_2 = new Date(baseDate.getTime() + 1000 * 60 * 60 * (deliveryDays === 1 ? 16 : deliveryDays * 12));
-
-      const estimatedDeliveryDate = new Date(baseDate.getTime() + 86400000 * deliveryDays);
-      const t_entregado = orderData?.actualizado_en ? new Date(orderData.actualizado_en) : new Date(baseDate.getTime() + 86400000 * deliveryDays);
-
-      const addressStr = orderData?.direccion_envio || "";
-      let destinationCity = "tu ciudad";
-      if (addressStr.includes(',')) {
-        const parts = addressStr.split(',');
-        if (parts.length >= 2) {
-          destinationCity = parts[parts.length - 2].trim() || parts[parts.length - 1].replace(/CP:.*$/, '').trim();
-        }
-      }
-
-      const currentDate = new Date();
-      if ((status === 'EN_TRANSITO' || status === 'CREADO') && currentDate >= estimatedDeliveryDate) {
-        status = 'ENTREGADO';
-      }
-
-      let m1Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'COMPLETED';
-      let m2Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'PENDING';
-      let m3Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'PENDING';
-      let m4Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'PENDING';
-
-      if (status === 'CREADO') {
-        m1Status = 'ACTIVE';
-        m2Status = 'PENDING';
-        m3Status = 'PENDING';
-        m4Status = 'PENDING';
-      } else if (status === 'RECOLECTADO') {
-        m1Status = 'COMPLETED';
-        m2Status = 'ACTIVE';
-        m3Status = 'PENDING';
-        m4Status = 'PENDING';
-      } else if (status === 'EN_TRANSITO') {
-        m1Status = 'COMPLETED';
-        m2Status = 'COMPLETED';
-        m3Status = 'ACTIVE';
-        m4Status = 'PENDING';
-      } else if (status === 'ENTREGADO' || status === 'COMPLETADO') {
-        m1Status = 'COMPLETED';
-        m2Status = 'COMPLETED';
-        m3Status = 'COMPLETED';
-        m4Status = 'COMPLETED';
-      }
-
-      const milestones = [
-        {
-          id: '1',
-          title: 'En preparación',
-          status: m1Status,
-          date: t_creado.toISOString(),
-          location: 'Centro de Distribución',
-          details: [
-            'Tu pedido ha sido confirmado y el pago autorizado por el sistema.',
-            'Estamos empaquetando tus productos con protección de alta seguridad.',
-            `La etiqueta de envío de ${carrier} ha sido generada con guía ${tracking_number}.`
-          ]
-        },
-        {
-          id: '2',
-          title: 'En camino',
-          status: m2Status,
-          date: (m2Status !== 'PENDING' ? t_transito_1 : t_recolectado).toISOString(),
-          location: `Centro Logístico Regional - ${carrier}`,
-          details: m2Status !== 'PENDING' ? [
-            `El paquete fue recolectado por el mensajero de ${carrier} en el Centro de Distribución.`,
-            'Salió del centro de distribución regional y sigue en viaje por carretera.',
-            `En tránsito interurbano hacia el centro logístico de tu zona (${destinationCity}).`
-          ] : [`El paquete será recolectado y transportado por ${carrier}.`]
-        },
-        {
-          id: '3',
-          title: 'En el último tramo del recorrido',
-          status: m3Status,
-          date: (m3Status !== 'PENDING' ? t_transito_2 : new Date(t_transito_2.getTime() + 3600000)).toISOString(),
-          location: `Sucursal Destino - ${destinationCity}`,
-          details: m3Status !== 'PENDING' ? [
-            `Llegó a la central de distribución local de ${carrier} en ${destinationCity}.`,
-            'Tu paquete está muy cerca. El mensajero ha cargado tu envío en la unidad de reparto.',
-            'En reparto a tu domicilio. Recuerda tener a la mano una identificación para recibirlo.'
-          ] : [`Pendiente de arribo al centro de distribución en ${destinationCity}.`]
-        },
-        {
-          id: '4',
-          title: 'Entregado',
-          status: m4Status,
-          date: (m4Status === 'COMPLETED' ? t_entregado : estimatedDeliveryDate).toISOString(),
-          location: 'Domicilio del receptor',
-          details: m4Status === 'COMPLETED' ? [
-            `Entregamos el paquete con éxito en tu dirección (${destinationCity}).`,
-            `Firma y confirmación electrónica registrada por el operador de ${carrier}.`,
-            '¡Gracias por tu confianza y compra en CSTI!'
-          ] : [`Llegada estimada: ${new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(estimatedDeliveryDate)}.`]
-        }
-      ];
-
-      setTimeout(() => {
-        resolve({
-          carrier,
-          tracking_number,
-          url_guia,
-          status,
-          estimated_delivery: estimatedDeliveryDate.toISOString(),
-          delivered_date: m4Status === 'COMPLETED' ? t_entregado.toISOString() : null,
-          destination_city: destinationCity,
-          milestones,
-          events: [
-            {
-              date: t_creado.toISOString(),
-              status: 'CREADO',
-              description: 'La etiqueta de envío ha sido generada en Envia.com.'
-            },
-            ...(status !== 'CREADO' ? [{
-              date: new Date().toISOString(),
-              status: status,
-              description: `El paquete está actualmente en estado: ${status}.`
-            }] : [])
-          ]
-        });
-      }, 300);
-    });
-  }
 };
```

## src/utils/alerts.ts

```diff
diff --git a/src/utils/alerts.ts b/src/utils/alerts.ts
index 98e328d..018c6b4 100644
--- a/src/utils/alerts.ts
+++ b/src/utils/alerts.ts
@@ -42,7 +42,7 @@ export const appToast = (
     toast: true,
     position: 'top-end',
     icon,
-    title,
+    titleText: title,
     text,
     timer,
     timerProgressBar: true,
@@ -54,7 +54,7 @@ export const appLoadingToast = (title: string, text?: string) =>
   Swal.fire({
     toast: true,
     position: 'top-end',
-    title,
+    titleText: title,
     text,
     allowEscapeKey: false,
     showConfirmButton: false,
```

## src/components/ShippingQuoteGate.tsx

```diff
diff --git a/src/components/ShippingQuoteGate.tsx b/src/components/ShippingQuoteGate.tsx
new file mode 100644
index 0000000..2f9784b
--- /dev/null
+++ b/src/components/ShippingQuoteGate.tsx
@@ -0,0 +1,15 @@
+import type { ReactNode } from 'react';
+import { isQuoteCurrent } from '../services/Shipping.service';
+import type { QuoteContext, ShippingQuote } from '../services/Shipping.service';
+
+export default function ShippingQuoteGate({ quote, context, selectedRateId, children }: {
+  quote: ShippingQuote | null;
+  context: QuoteContext;
+  selectedRateId: string | null;
+  children: ReactNode;
+}) {
+  if (!isQuoteCurrent(quote, context) || !quote.rates.some(rate => rate.id === selectedRateId)) {
+    return <p role="status">El pago está bloqueado hasta obtener una cotización válida.</p>;
+  }
+  return children;
+}
```

## src/hooks/useShippingQuote.ts

```diff
diff --git a/src/hooks/useShippingQuote.ts b/src/hooks/useShippingQuote.ts
new file mode 100644
index 0000000..a91e379
--- /dev/null
+++ b/src/hooks/useShippingQuote.ts
@@ -0,0 +1,46 @@
+import { useEffect, useState } from 'react';
+import { isQuoteCurrent, shippingService } from '../services/Shipping.service';
+import type { QuoteContext, ShippingCartItem, ShippingQuote } from '../services/Shipping.service';
+
+export function useShippingQuote(context: QuoteContext, items: ShippingCartItem[], addressVersion: string) {
+  const [attempt, setAttempt] = useState(0);
+  const key = JSON.stringify([context.addressId, context.cartKey, addressVersion, attempt]);
+  const [result, setResult] = useState<{
+    key: string; quote: ShippingQuote | null; selectedId: string | null; error: string | null;
+  }>({ key: '', quote: null, selectedId: null, error: null });
+
+  useEffect(() => {
+    let active = true;
+    let expiry: ReturnType<typeof setTimeout>;
+    const quoteContext = { addressId: context.addressId, cartKey: context.cartKey };
+    const preferredId = shippingService.getSelectedRateId(quoteContext);
+    shippingService.getQuote(quoteContext, items).then(quote => {
+      if (!active) return;
+      const preferred = quote.rates.find(rate => rate.id === preferredId);
+      const selected = preferred ?? quote.rates.reduce((a, b) => a.price <= b.price ? a : b);
+      setResult({ key, quote, selectedId: selected.id, error: null });
+      shippingService.saveSelectedRate(selected, quoteContext);
+      expiry = setTimeout(() => setAttempt(value => value + 1), Math.max(0, quote.expiresAt - Date.now()));
+    }).catch(() => {
+      if (!active) return;
+      shippingService.clearSelectedRate();
+      setResult({ key, quote: null, selectedId: null,
+        error: context.addressId > 0 ? 'No fue posible obtener una cotización válida. Intenta de nuevo.' : 'Agrega una dirección válida para cotizar el envío.' });
+    });
+    return () => { active = false; clearTimeout(expiry); };
+  }, [context.addressId, context.cartKey, items, addressVersion, key]);
+
+  const matches = result.key === key;
+  const quote = matches && isQuoteCurrent(result.quote, context) ? result.quote : null;
+  const selectedRate = quote?.rates.find(rate => rate.id === result.selectedId) ?? null;
+  return {
+    quote, selectedRate, loading: !matches, error: matches ? result.error : null,
+    retry: () => setAttempt(value => value + 1),
+    selectRate: (id: string) => {
+      const rate = quote?.rates.find(candidate => candidate.id === id);
+      if (!rate) return;
+      setResult(previous => ({ ...previous, selectedId: id }));
+      shippingService.saveSelectedRate(rate, context);
+    },
+  };
+}
```

## src/pages/Admin/components/Returns/ReturnDetailsContent.tsx

```diff
diff --git a/src/pages/Admin/components/Returns/ReturnDetailsContent.tsx b/src/pages/Admin/components/Returns/ReturnDetailsContent.tsx
new file mode 100644
index 0000000..ea00693
--- /dev/null
+++ b/src/pages/Admin/components/Returns/ReturnDetailsContent.tsx
@@ -0,0 +1,43 @@
+import { safeMediaUrl } from '../../../../utils/safeMediaUrl';
+import { formatMotivo } from '../../../../utils/returnDisplay';
+
+export interface ReturnDetails {
+  cliente_nombre?: unknown;
+  cliente_email?: unknown;
+  motivo?: unknown;
+  comentarios?: unknown;
+  evidencias?: unknown;
+}
+const text = (value: unknown, fallback: string) => typeof value === 'string' && value ? value : fallback;
+
+export default function ReturnDetailsContent({ details }: { details: ReturnDetails }) {
+  const client = text(details.cliente_nombre, 'Cliente');
+  const evidence = Array.isArray(details.evidencias) ? details.evidencias : [];
+  const images = evidence.map(value => safeMediaUrl(value && typeof value === 'object' ? value.imagen : null)).filter((url): url is string => url !== null);
+  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, textAlign: 'left', maxHeight: 600, overflowY: 'auto', paddingTop: 10 }}>
+    {evidence.length > 0 && <section style={{ flex: '1 1 240px' }}>
+      <h4>Evidencia Fotográfica</h4>
+      {images.map((url, index) => <div key={`${url}-${index}`} style={{ background: '#f1f5f9', padding: 8, borderRadius: 8, marginBottom: 12, border: '1px solid #e2e8f0' }}>
+        <img src={url} alt={`Evidencia ${index + 1}`} referrerPolicy="no-referrer" style={{ maxWidth: '100%', borderRadius: 4, display: 'block' }} />
+      </div>)}
+      {images.length !== evidence.length && <p>Algunas evidencias no se muestran porque su URL no está permitida.</p>}
+    </section>}
+    <section style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 16 }}>
+      <h4>Desglose de la Solicitud {evidence.length === 0 ? '(Sin Fotos)' : ''}</h4>
+      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
+        <h5>Información del Cliente</h5>
+        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
+          <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', padding: 8 }}>{client.charAt(0)}</span>
+          <div>{client}<div style={{ color: '#64748b', fontSize: '0.85rem' }}>{text(details.cliente_email, 'Sin correo')}</div></div>
+        </div>
+      </div>
+      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
+        <h5>Motivo Declarado</h5><p>{formatMotivo(details.motivo)}</p>
+      </div>
+      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
+        <h5>Detalles Adicionales</h5>
+        <p style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 6 }}>{text(details.comentarios, 'El cliente no dejó comentarios adicionales.')}</p>
+      </div>
+    </section>
+  </div>;
+}
```

## src/services/CheckoutShipping.service.ts

```diff
diff --git a/src/services/CheckoutShipping.service.ts b/src/services/CheckoutShipping.service.ts
new file mode 100644
index 0000000..24f4ec5
--- /dev/null
+++ b/src/services/CheckoutShipping.service.ts
@@ -0,0 +1,29 @@
+import { addressService } from './Address.service';
+import { cartService } from './Cart.service';
+import { cartQuoteKey, isQuoteCurrent, shippingService, ShippingError } from './Shipping.service';
+import type { QuoteContext, ShippingQuote } from './Shipping.service';
+
+const addressKey = (value: unknown) => value && typeof value === 'object'
+  ? JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : '';
+
+// Recheck immediately before opening the PayPal order. This does not replace
+// backend authorization, quote binding, stock validation or capture validation.
+export async function revalidateCheckoutShipping(quote: ShippingQuote | null, context: QuoteContext,
+  selectedRateId: string, selectedAddress: unknown) {
+  if (!isQuoteCurrent(quote, context)) throw new ShippingError('La cotización venció. Cotiza de nuevo.');
+  const selected = quote.rates.find(rate => rate.id === selectedRateId);
+  if (!selected) throw new ShippingError('Selecciona una tarifa válida.');
+  const [cart, addresses] = await Promise.all([cartService.getCart(), addressService.getAddresses()]);
+  const address = addresses.find((candidate: { id: number }) => candidate.id === context.addressId);
+  if (!address || addressKey(address) !== addressKey(selectedAddress) || cartQuoteKey(cart.items, cart.total) !== context.cartKey) {
+    throw new ShippingError('Cambió el carrito o la dirección. Revisa una nueva cotización.');
+  }
+  const rates = await shippingService.getRates(context.addressId, cart.items);
+  const fresh = rates.find(rate => rate.id === selectedRateId);
+  if (!fresh || fresh.price !== selected.price || fresh.internalProvider !== selected.internalProvider) {
+    throw new ShippingError('La tarifa cambió. Revisa una nueva cotización.');
+  }
+  // A slow request may have crossed the local freshness boundary.
+  if (!isQuoteCurrent(quote, context)) throw new ShippingError('La cotización venció. Cotiza de nuevo.');
+  return fresh;
+}
```

## src/utils/reactAlert.tsx

```diff
diff --git a/src/utils/reactAlert.tsx b/src/utils/reactAlert.tsx
new file mode 100644
index 0000000..d2d9650
--- /dev/null
+++ b/src/utils/reactAlert.tsx
@@ -0,0 +1,14 @@
+import type { ReactNode } from 'react';
+import { createRoot } from 'react-dom/client';
+import { flushSync } from 'react-dom';
+import Swal from 'sweetalert2';
+import type { SweetAlertOptions } from 'sweetalert2';
+
+// SweetAlert receives an element, never an HTML string containing user data.
+export function showReactAlert(content: ReactNode, options: Pick<SweetAlertOptions,
+  'title' | 'icon' | 'width' | 'confirmButtonText' | 'confirmButtonColor' | 'customClass'>) {
+  const container = document.createElement('div');
+  const root = createRoot(container);
+  flushSync(() => root.render(content));
+  return Swal.fire({ ...options, html: container, didDestroy: () => root.unmount() });
+}
```

## src/utils/returnDisplay.ts

```diff
diff --git a/src/utils/returnDisplay.ts b/src/utils/returnDisplay.ts
new file mode 100644
index 0000000..726860c
--- /dev/null
+++ b/src/utils/returnDisplay.ts
@@ -0,0 +1,8 @@
+const motives: Record<string, string> = {
+  Dano_envio: 'Daño en envío', Arrepentimiento: 'Arrepentimiento',
+  Defecto_fabrica: 'Defecto de fábrica', Error_producto: 'Producto incorrecto', Producto_equivocado: 'Producto incorrecto',
+};
+export function formatMotivo(value: unknown): string {
+  const reason = typeof value === 'string' && value ? value : 'No especificado';
+  return Object.hasOwn(motives, reason) ? motives[reason] : reason.replace(/_/g, ' ');
+}
```

## src/utils/safeMediaUrl.ts

```diff
diff --git a/src/utils/safeMediaUrl.ts b/src/utils/safeMediaUrl.ts
new file mode 100644
index 0000000..9b5016a
--- /dev/null
+++ b/src/utils/safeMediaUrl.ts
@@ -0,0 +1,16 @@
+import { appConfig } from '../config/appConfig';
+
+// Explicit policy: same frontend, configured backend, and Cloudinary image CDN.
+// No wildcard subdomains, credentials, non-HTTPS, data/blob or arbitrary origins.
+export function safeMediaUrl(value: unknown): string | null {
+  if (typeof value !== 'string' || !value.trim() || Array.from(value).some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return null;
+  try {
+    const backend = new URL(appConfig.apiBaseUrl);
+    const url = new URL(value, backend);
+    const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : null;
+    if (url.protocol !== 'https:' || url.username || url.password || /\.svg(?:$|[?#])/i.test(url.href)) return null;
+    if (url.origin === backend.origin || url.origin === frontendOrigin) return url.href;
+    if (url.origin === 'https://res.cloudinary.com' && /^\/[^/]+\/image\/upload\//.test(url.pathname)) return url.href;
+  } catch { /* Malformed configuration or URL fails closed. */ }
+  return null;
+}
```

## tests/README.md

```diff
diff --git a/tests/README.md b/tests/README.md
new file mode 100644
index 0000000..3a40721
--- /dev/null
+++ b/tests/README.md
@@ -0,0 +1,13 @@
+# Regresiones de seguridad y logística
+
+Ejecutar desde la raíz:
+
+```powershell
+npm.cmd test
+```
+
+Usar Node 24 (verificado con 24.11.0); el cargador utiliza `node:module.registerHooks`. No necesita instalar dependencias nuevas. Los tests ejecutan el servicio TypeScript real, la revalidación del checkout y componentes React reales mediante `react-dom/server`. API, configuración pública y CSS se reemplazan en el cargador; no se realizan conexiones, compras, facturas o reembolsos.
+
+La suite cubre tarifas offline/vacías/corruptas, direcciones, storage, invalidación de contexto, bloqueo de PayPal, revalidación antes de pago, rastreo sin simulaciones y XSS/URLs del modal. La prueba AST impide reintroducir HTML dinámico en opciones y argumentos posicionales de SweetAlert.
+
+No es una suite E2E de navegador: falta ensayar Payment/SweetAlert con DOM real y el contrato Django/Envia/PayPal en staging aislado. Ver `docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md`.
```

## tests/register.mjs

```diff
diff --git a/tests/register.mjs b/tests/register.mjs
new file mode 100644
index 0000000..adbf768
--- /dev/null
+++ b/tests/register.mjs
@@ -0,0 +1,31 @@
+import { registerHooks } from 'node:module';
+import { readFileSync, existsSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import ts from 'typescript';
+
+// Real TS/TSX + React server renderer; network/config/styles replaced offline.
+registerHooks({
+  resolve(specifier, context, nextResolve) {
+    if (/Api\.service$/.test(specifier)) return { url: 'mock:api', shortCircuit: true };
+    if (/appConfig$/.test(specifier)) return { url: 'mock:config', shortCircuit: true };
+    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
+      const url = new URL(specifier, context.parentURL);
+      for (const extension of ['', '.ts', '.tsx']) {
+        if (existsSync(fileURLToPath(url) + extension)) return { url: url.href + extension, shortCircuit: true };
+      }
+    }
+    return nextResolve(specifier, context);
+  },
+  load(url, context, nextLoad) {
+    if (url === 'mock:api') return { format: 'module', source: 'export default globalThis.__shippingApi;', shortCircuit: true };
+    if (url === 'mock:config') return { format: 'module', source: "export const appConfig = { apiBaseUrl: 'https://api.example.test' };", shortCircuit: true };
+    if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
+    if (/\.tsx?$/.test(url)) {
+      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: {
+        target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
+      }, fileName: fileURLToPath(url) }).outputText;
+      return { format: 'module', source, shortCircuit: true };
+    }
+    return nextLoad(url, context);
+  },
+});
```

## tests/shipping-security.test.mjs

```diff
diff --git a/tests/shipping-security.test.mjs b/tests/shipping-security.test.mjs
new file mode 100644
index 0000000..daa2dbe
--- /dev/null
+++ b/tests/shipping-security.test.mjs
@@ -0,0 +1,168 @@
+import './register.mjs';
+import test, { beforeEach } from 'node:test';
+import assert from 'node:assert/strict';
+import React from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+import { readFileSync, readdirSync } from 'node:fs';
+import ts from 'typescript';
+
+let posts, gets;
+globalThis.__shippingApi = { post: (...args) => posts(...args), get: (...args) => gets(...args) };
+const { shippingService, validateRates, cartQuoteKey, isQuoteCurrent } = await import('../src/services/Shipping.service.ts');
+const { default: Gate } = await import('../src/components/ShippingQuoteGate.tsx');
+const { default: Timeline } = await import('../src/pages/Profile/components/OrderDetail/TrackingTimeline.tsx');
+const { default: Details } = await import('../src/pages/Admin/components/Returns/ReturnDetailsContent.tsx');
+const { safeMediaUrl } = await import('../src/utils/safeMediaUrl.ts');
+const { revalidateCheckoutShipping } = await import('../src/services/CheckoutShipping.service.ts');
+const item = { id: 1, producto: { id: 99 }, cantidad: 1, precio_unitario: 100 };
+const context = { addressId: 1, cartKey: cartQuoteKey([item], 100) };
+const rawRate = { id: 'rate-1', title: 'Envío estándar', carrier: 'CVA', price: 25, estimated_days: '3-5 días' };
+const rate = () => validateRates({ rates: [rawRate] })[0];
+const quote = () => ({ ...context, rates: [rate()], expiresAt: Date.now() + 60000 });
+const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
+beforeEach(() => {
+  const storage = new Map();
+  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
+  posts = async () => ({ data: { rates: [rawRate] } });
+  gets = async () => { throw Error('offline'); };
+});
+test('1. Envia offline rejects rates and default without a fallback', async () => {
+  posts = async () => { throw Error('offline'); };
+  await assert.rejects(shippingService.getRates(1, [item]), /No fue posible cotizar/);
+  await assert.rejects(shippingService.getDefaultRate(1, [item]), /No fue posible cotizar/);
+});
+test('2. Missing/invalid address cannot quote or call network', async () => {
+  posts = () => { assert.fail('Network must not be called'); };
+  for (const id of [0, -1, null, undefined, NaN, Infinity, 1.2, '1']) await assert.rejects(shippingService.getRates(id, [item]));
+});
+test('3. Empty, corrupt, duplicate and invalid tariffs reject entire response', () => {
+  for (const data of [null, {}, { rates: {} }, { rates: [] }, { rates: [null] }, { rates: [rawRate, rawRate] }]) assert.throws(() => validateRates(data));
+  for (const price of [-1, NaN, Infinity, '', ' ', '-1', 'NaN', null, true, {}, '1e2']) assert.throws(() => validateRates({ rates: [{ ...rawRate, price }] }));
+  for (const change of [{ id: '' }, { id: null }, { title: 1 }, { carrier: '' }]) assert.throws(() => validateRates({ rates: [{ ...rawRate, ...change }] }));
+});
+test('Valid quotes normalize decimal strings, accept zero and send product ids', async () => {
+  assert.equal(validateRates({ rates: [{ ...rawRate, price: '12.50' }] })[0].price, 12.5);
+  assert.equal(validateRates({ rates: [{ ...rawRate, price: 0 }] })[0].price, 0);
+  posts = async (url, body, options) => {
+    assert.match(url, /cotizar/); assert.deepEqual(body, { direccionID: 1, productos: [99] });
+    assert.equal(options.timeout, 15000); return { data: { rates: [rawRate] } };
+  };
+  assert.equal((await shippingService.getQuote(context, [item])).rates[0].price, 25);
+});
+test('4. Corrupt/legacy/manipulated localStorage never throws or supplies a price', () => {
+  for (const value of ['{', 'null', '[]', JSON.stringify({ ...rawRate, price: -150 }), JSON.stringify({ ...rawRate, price: 1 })]) {
+    localStorage.setItem('selectedShippingRate', value);
+    assert.equal(shippingService.getSelectedRateId(context), null);
+  }
+  shippingService.saveSelectedRate(rate(), context);
+  assert.deepEqual(JSON.parse(localStorage.getItem('selectedShippingRate')), { version: 1, rateId: 'rate-1', ...context });
+  assert.equal(shippingService.getSelectedRateId(context), 'rate-1');
+  assert.equal(shippingService.getSelectedRateId({ ...context, addressId: 2 }), null);
+});
+test('Storage access denied is recoverable', () => {
+  globalThis.localStorage = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); }, removeItem() { throw Error('denied'); } };
+  assert.equal(shippingService.getSelectedRateId(context), null);
+  assert.doesNotThrow(() => shippingService.saveSelectedRate(rate(), context));
+  assert.doesNotThrow(() => shippingService.clearSelectedRate());
+});
+test('5. PayPal child never mounts without fresh current quote and selected rate', () => {
+  let renders = 0;
+  const FakePayPal = () => { renders++; return React.createElement('button', null, 'PAYPAL_MOCK'); };
+  for (const candidate of [null, { ...quote(), expiresAt: 0 }, { ...quote(), addressId: 2 }, { ...quote(), cartKey: 'changed' }, { ...quote(), rates: [] }]) {
+    const html = render(Gate, { quote: candidate, context, selectedRateId: 'rate-1', children: React.createElement(FakePayPal) });
+    assert.doesNotMatch(html, /PAYPAL_MOCK/); assert.match(html, /bloqueado/);
+  }
+  assert.equal(renders, 0);
+  assert.doesNotMatch(render(Gate, { quote: quote(), context, selectedRateId: 'tampered', children: React.createElement(FakePayPal) }), /PAYPAL_MOCK/);
+  assert.match(render(Gate, { quote: quote(), context, selectedRateId: 'rate-1', children: React.createElement(FakePayPal) }), /PAYPAL_MOCK/);
+  assert.equal(renders, 1);
+});
+test('Cart quantity, price, total and address changes invalidate previous quote', () => {
+  for (const key of [cartQuoteKey([{ ...item, cantidad: 2 }], 100), cartQuoteKey([{ ...item, precio_unitario: 200 }], 100), cartQuoteKey([item], 200)]) assert.equal(isQuoteCurrent(quote(), { ...context, cartKey: key }), false);
+  assert.equal(isQuoteCurrent(quote(), { ...context, addressId: 2 }), false);
+});
+const address = { id: 1, codigo_postal: '76120', calle: 'Calle de prueba' };
+const checkoutGets = async url => ({ data: url.includes('mi-carrito') ? { items: [item], total: 100 } : [address] });
+test('Checkout revalidates current cart, address and backend rate before proceeding', async () => {
+  gets = checkoutGets;
+  assert.equal((await revalidateCheckoutShipping(quote(), context, 'rate-1', address)).price, 25);
+});
+test('Checkout rejects changed/removed cart, address and rate or provider offline', async () => {
+  gets = async url => ({ data: url.includes('mi-carrito') ? { items: [{ ...item, cantidad: 2 }], total: 200 } : [address] });
+  await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', address), /carrito o la dirección/);
+  gets = checkoutGets;
+  await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', { ...address, codigo_postal: '00000' }));
+  for (const rates of [[], [{ ...rawRate, price: 99 }], [{ ...rawRate, id: 'new' }]]) {
+    posts = async () => ({ data: { rates } });
+    await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', address));
+  }
+  posts = async () => { throw Error('offline'); };
+  await assert.rejects(revalidateCheckoutShipping(quote(), context, 'rate-1', address));
+});
+test('A valid-looking stored price cannot replace fresh backend rate', async () => {
+  localStorage.setItem('selectedShippingRate', JSON.stringify({ version: 1, rateId: 'rate-1', ...context, price: 0 }));
+  const preferred = shippingService.getSelectedRateId(context);
+  const fresh = await shippingService.getQuote(context, [item]);
+  assert.equal(fresh.rates.find(candidate => candidate.id === preferred).price, 25);
+});
+test('6/7. Ancient EN_TRANSITO stays in transit offline without invented guide/carrier/events', async () => {
+  const data = await shippingService.getTracking('1', { estado_envio: 'EN_TRANSITO', creado_en: '2000-01-01', actualizado_en: '2000-01-02' });
+  assert.equal(data.status, 'EN_TRANSITO'); assert.equal(data.tracking_number, null); assert.equal(data.carrier, null);
+  assert.equal(data.delivered_date, null); assert.equal(data.estimated_delivery, null); assert.equal(data.events, undefined);
+  assert.equal(data.source, 'order'); assert.match(data.message, /último estado confirmado/);
+  const html = render(Timeline, { trackingData: data });
+  assert.doesNotMatch(html, /782349102384|FedEx|Entregado|firma electrónica/);
+  assert.match(html, /En camino/); assert.match(html, /Aún no asignada/);
+});
+test('Unavailable tracking does not manufacture an initial status', async () => {
+  const data = await shippingService.getTracking('1');
+  assert.equal(data.source, 'unavailable'); assert.equal(data.status, null);
+  assert.match(render(Timeline, { trackingData: data }), /Rastreo temporalmente no disponible/);
+});
+test('Past backend estimate never confirms delivery', async () => {
+  gets = async () => ({ data: { status: 'EN_TRANSITO', carrier: 'Real', tracking_number: 'CONFIRMED-1', estimated_delivery: '2000-01-01', delivered_date: '2000-01-02' } });
+  const data = await shippingService.getTracking('1');
+  assert.equal(data.status, 'EN_TRANSITO'); assert.equal(data.tracking_number, 'CONFIRMED-1'); assert.equal(data.delivered_date, null);
+  assert.match(render(Timeline, { trackingData: data }), /No constituye confirmación de entrega/);
+});
+test('Unknown provider payload falls back to confirmed order', async () => {
+  gets = async () => ({ data: { live_tracking: [{ date: '2000-01-01' }] } });
+  const data = await shippingService.getTracking('1', { estado_envio: 'RECOLECTADO', numero_de_guia: 'REAL' });
+  assert.equal(data.status, 'RECOLECTADO'); assert.equal(data.tracking_number, 'REAL'); assert.equal(data.source, 'order');
+});
+test('8. Modal treats user HTML as escaped text in all fields', () => {
+  const payload = '<img src=x onerror="alert(1)"><script>injected()</script>';
+  const html = render(Details, { details: { cliente_nombre: payload, cliente_email: payload, motivo: payload, comentarios: payload } });
+  assert.doesNotMatch(html, /<script|<img|<iframe|<svg/);
+  assert.ok(html.includes('&lt;img')); assert.ok(html.includes('&lt;script&gt;'));
+  assert.ok(html.includes('Información del Cliente')); assert.ok(html.includes('Detalles Adicionales'));
+});
+test('9. Dangerous evidence URLs create no active images or links', () => {
+  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg onload=alert(1)>', 'blob:https://api.example.test/a', 'http://api.example.test/a.png', 'https://evil.test/x.png', 'https://api.example.test.evil.test/x.png', 'https://u:p@api.example.test/x.png', 'https://api.example.test/x.svg', '//evil.test/x.png']) {
+    assert.equal(safeMediaUrl(url), null);
+    const html = render(Details, { details: { evidencias: [{ imagen: url }] } });
+    assert.doesNotMatch(html, /<img|<a\b|<iframe|<script/); assert.match(html, /URL no está permitida/);
+  }
+});
+test('Allowed evidence preserves images without injecting HTML attributes', () => {
+  for (const url of ['https://api.example.test/media/evidence.png', '/media/evidence.png', 'https://res.cloudinary.com/account/image/upload/evidence.jpg']) {
+    assert.ok(safeMediaUrl(url)); assert.match(render(Details, { details: { evidencias: [{ imagen: url }] } }), /<img/);
+  }
+  const html = render(Details, { details: { evidencias: [{ imagen: 'https://api.example.test/a.png"onerror="evil()' }] } });
+  assert.doesNotMatch(html, /\sonerror=/);
+});
+test('SweetAlert user-controlled errors cannot regress to HTML sinks', () => {
+  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
+    entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
+  const violations = [];
+  for (const file of walk('src').filter(name => /\.tsx?$/.test(name))) {
+    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
+    const visit = node => {
+      if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'html' && file !== 'src/utils/reactAlert.tsx') violations.push(`${file}: dynamic html option`);
+      if (ts.isCallExpression(node) && node.expression.getText(source) === 'Swal.fire' && node.arguments.length > 1 && !ts.isStringLiteralLike(node.arguments[1])) violations.push(`${file}: dynamic positional HTML argument`);
+      ts.forEachChild(node, visit);
+    };
+    visit(source);
+  }
+  assert.deepEqual(violations, []);
+});
```

## docs/auditoria-produccion/02_HALLAZGOS_FRONTEND.md

```diff
diff --git a/docs/auditoria-produccion/02_HALLAZGOS_FRONTEND.md b/docs/auditoria-produccion/02_HALLAZGOS_FRONTEND.md
index 1de342a..7ec0b95 100644
--- a/docs/auditoria-produccion/02_HALLAZGOS_FRONTEND.md
+++ b/docs/auditoria-produccion/02_HALLAZGOS_FRONTEND.md
@@ -1,5 +1,7 @@
 # Hallazgos y evidencia
 
+**Actualización 24/11/2026 — primera fase:** F02/F03 y el rastreo F07 tienen mitigaciones frontend y pruebas persistentes en `fix/seguridad-envios-preproduccion`. No se declaran cerrados contra integración real. Ver [registro de correcciones](07_PRIMERA_FASE_CORRECCIONES.md) y [diff por archivo](08_DIFF_PRIMERA_FASE.md). Las descripciones y líneas de la auditoría original se conservan como evidencia histórica del 23/11.
+
 Fecha y revisión: 23/11/2026, HEAD `ba824d6`; lock local con cambio previo. P0 bloquea producción; P1 debe resolverse antes del lanzamiento; P2 mejora posterior. Las líneas corresponden al código inspeccionado. Una ausencia de garantía backend se clasifica como pendiente de verificación, no como vulnerabilidad explotada del servidor.
 
 ## Tabla de hallazgos
@@ -89,3 +91,13 @@ ReturnModal sí deshabilita enviar/cancelar mediante `isSubmitting`, lo que redu
 ## Límites de los hallazgos
 
 No se validaron productos reales con stock incorrecto, precios concretos inconsistentes, exposición efectiva de facturas ajenas ni endpoints inexistentes. Se documentan defectos de código y riesgos de contrato, con pruebas pendientes específicas. No se probaron CVEs: la auditoría npm no pudo acceder al servicio de advisories. Tampoco se midieron contraste, Core Web Vitals o compatibilidad en navegador.
+
+## Seguimiento de F02/F03/F07 — 24/11/2026
+
+| Hallazgo | Cambio implementado | Evidencia ejecutada | Estado y pendiente |
+|---|---|---|---|
+| F02 | Eliminados mockRates y respaldo de getDefaultRate; dirección obligatoria, respuesta/tarifas validadas y timeout; storage guarda solo preferencia de ID/contexto; carrito/checkout consultan tarifas frescas y bloquean pago sin ellas; revalidación de carrito/dirección/tarifa antes de crear orden | `npm test`: casos offline, dirección ausente, respuestas corruptas/vacías, importes inválidos, JSON/storage inaccesible, bloqueo real del hijo PayPal en render React, cambios de contexto y revalidación inmediata | Mitigado en frontend, pendiente de integración Envia/CVA y de cotización autoritativa vinculada/captura en backend (F01 sigue abierto) |
+| F03 | Modal administrativo con React montado en HTMLElement de SweetAlert, sin interpolación HTML; URLs HTTPS de lista explícita; rechazo cliente también usa React; errores de registro/recuperación/perfil usan text; errores posicionales y títulos controlables corregidos | Render de componente real con payloads HTML en cuatro campos; URLs javascript/data/blob/http/origen ajeno/credenciales/SVG rechazadas; prueba AST evita reintroducir sinks inseguros | Mitigado en sinks revisados; pendiente validar payload/hosts reales y ciclo abrir/cerrar del modal en navegador de staging. No se probó persistencia de payloads en backend |
+| F07 / M02 | Rastreo no inventa guía, transportista, fechas, eventos ni entrega; muestra campos normalizados del backend o último estado del pedido con advertencia | Pedido EN_TRANSITO del año 2000 permanece EN_TRANSITO offline; sin guía o transportista por defecto; fecha estimada pasada no declara entrega; payload desconocido usa estado confirmado del pedido | Mitigado en frontend; pendiente confirmar contrato de rastreo real. Un backend que siga enviando datos simulados no se detecta por este cambio |
+
+Resultado de fase: 19 pruebas pasan sin red/pagos, TypeScript pasa, build con configLoader runner pasa. Lint global conserva 126 errores/7 advertencias preexistentes; comparación por archivo/regla/mensaje no encuentra diagnósticos añadidos. No se tocó backend, Railway ni el lock previo. Sin commit, push, integración o despliegue.
```

## docs/auditoria-produccion/04_PRUEBAS_FRONTEND.md

```diff
diff --git a/docs/auditoria-produccion/04_PRUEBAS_FRONTEND.md b/docs/auditoria-produccion/04_PRUEBAS_FRONTEND.md
index d7998f9..900944c 100644
--- a/docs/auditoria-produccion/04_PRUEBAS_FRONTEND.md
+++ b/docs/auditoria-produccion/04_PRUEBAS_FRONTEND.md
@@ -1,5 +1,7 @@
 # Pruebas ejecutadas y matriz pendiente
 
+**Actualización 24/11/2026:** esta primera sección describe la auditoría original; ahora existen pruebas persistentes para F02/F03 y rastreo. Ver el seguimiento al final y [registro de fase](07_PRIMERA_FASE_CORRECCIONES.md).
+
 Fecha: 23/11/2026, America/Mexico_City. HEAD `ba824d6`; Node 24.11.0, npm 11.6.1, dependencias preexistentes y lock ya modificado. Se probaron servicios aislados, no operaciones financieras. **No se ejecutó checkout sandbox ni un E2E completo.**
 
 ## Comprobaciones ejecutadas
@@ -124,3 +126,22 @@ Todos los casos siguientes están **diseñados, pendientes de ejecución integra
 ## Registro necesario para futuras ejecuciones
 
 Por caso guardar fecha, SHA, build, navegador, tipo de entorno (mock/sandbox), datos sintéticos, resultado observado, esperado y evidencia redactada. Para pagos registrar IDs sintéticos de operación/captura/pedido y conteos de cobros. Para privacidad demostrar denegación A/B/anónimo; evitar almacenar documentos fiscales reales, tokens o secretos en esta carpeta.
+
+## Primera fase de correcciones — ejecución 24/11/2026
+
+Rama `fix/seguridad-envios-preproduccion`, base `ba824d6`, cambios sin commit. Pruebas en `tests/shipping-security.test.mjs`, cargador `tests/register.mjs`; ejecutar `npm.cmd test` con Node 24 (usado 24.11.0). No se añadieron dependencias ni se modificó package-lock. El cargador transpila los archivos TypeScript/TSX reales y sustituye exclusivamente API/configuración/CSS; React y su renderer de servidor son reales. Los callbacks de API son mocks, no red.
+
+| Verificación | Resultado final |
+|---|---|
+| `npm.cmd test` | 19 pruebas, 19 pasan, 0 fallos |
+| `node_modules/.bin/tsc.cmd -b` | Pasa |
+| `npm.cmd run build` | TypeScript pasa; esbuild bloqueado por permisos al leer directorio padre, como antes del cambio |
+| `npm.cmd run build -- --configLoader runner` | Pasa, 873 módulos; JS 1,033.82 kB / 314.75 gzip; CSS 118.18 kB / 22.51 gzip |
+| `npm.cmd run lint` | Falla con 126 errores y 7 warnings frente a 141/8 previos; no se desactivaron reglas |
+| Comparación lint con ESLint API | Multiconjunto de diagnósticos por archivo/regla/mensaje: cero diagnósticos nuevos; las líneas se desplazan por cambios |
+| `git diff --check` | Pasa; avisos de normalización LF/CRLF no son errores de whitespace |
+| SHA256 package-lock antes/después | Igual: `BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436` |
+
+Cobertura de las nueve pruebas obligatorias: (1) offline rechaza getRates/getDefaultRate; (2) dirección ausente/inválida no llama API; (3) rechaza vacíos, duplicados, estructura e importes corruptos; (4) JSON inválido/storage inaccesible devuelve preferencia nula sin excepción y nunca suministra precio; (5) el componente real ShippingQuoteGate no renderiza al hijo PayPal simulado si la cotización falta/venció/cambió de contexto o ID; (6) EN_TRANSITO antiguo no cambia a ENTREGADO; (7) sin guía backend no hay guía ni transportista inventados; (8) HTML de usuario se escapa en el componente real del modal; (9) URLs peligrosas no producen imágenes/enlaces activos. Hay casos adicionales de revalidación de carrito/dirección/tarifa, normalización monetaria, payload de rastreo desconocido y prevención estática de sinks HTML.
+
+Límites: no hay prueba E2E de la página Payment montada en un navegador, ni se cargó el SDK PayPal; el bloqueo del componente se verifica con renderizado React de servidor. No se ha ensayado el ciclo visual abrir/cerrar de SweetAlert, carreras en dos pestañas o proveedores reales. La lista de orígenes de medios debe cotejarse con respuestas reales antes de producción. Los casos integrales T07/T15/T25 permanecen pendientes de staging aunque estas regresiones locales pasan.
```

## docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md

```diff
diff --git a/docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md b/docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md
new file mode 100644
index 0000000..77a84c4
--- /dev/null
+++ b/docs/auditoria-produccion/07_PRIMERA_FASE_CORRECCIONES.md
@@ -0,0 +1,52 @@
+# Primera fase — tarifas, rastreo y XSS
+
+Fecha: 24/11/2026. Rama: `fix/seguridad-envios-preproduccion`; base main `ba824d6`, sin commit. La rama main no se modificó. Se preservaron los seis documentos de auditoría previos (dos actualizados por seguimiento) y el cambio local de package-lock. Sin backend, variables Railway, compras, reembolsos, push, merge o despliegue.
+
+## Cambios
+
+- Shipping.service elimina tarifas y rastreo simulados. getRates/getDefaultRate fallan explícitamente; rechazan respuestas vacías, IDs duplicados/ausentes, estructura incorrecta y precios no finitos/negativos. Aceptan precio numérico o decimal string estricto. Las consultas tienen timeout de 15 segundos y la UI ofrece reintento.
+- El storage conserva solo versión, ID preferido, dirección y huella del carrito; nunca se recupera un precio. JSON inválido o storage deshabilitado no lanza a la UI. Un ID manipulado solo puede seleccionar una tarifa de una respuesta nueva y validada.
+- useShippingQuote vincula cada resultado a dirección, datos de domicilio, productos, cantidades, precios y total; descarta respuestas tardías de solicitudes anteriores. La cotización tiene una vigencia local máxima de cinco minutos; no sustituye la vigencia del proveedor/backend. Cambios de contexto la invalidan inmediatamente en render. Payment vuelve a leer carrito/direcciones al recuperar foco o cambiar storage; omite esa recarga mientras procesa la ventana PayPal.
+- Carrito bloquea Continuar sin tarifa; Payment no monta PayPal sin cotización vigente. Los totales muestran pendiente cuando no hay tarifa, no envío gratuito. Antes de crear la orden, CheckoutShipping vuelve a leer carrito/dirección y cotiza: si precio, proveedor, método, domicilio o carrito cambiaron, bloquea y requiere revisar la nueva cotización. Este paso todavía no crea una cotización firmada ni mueve el cálculo financiero al servidor.
+- Rastreo solo muestra campos confirmados de la respuesta normalizada o los datos del pedido previamente recibido del backend. Si el proveedor no responde o el formato es desconocido, indica último estado confirmado o “Rastreo temporalmente no disponible”. No calcula entrega por antigüedad, no genera eventos, no usa guías/transportistas de ejemplo. Estado COMPLETADO no se transforma por sí solo en entrega logística. El detalle del pedido no se oculta porque falle la consulta de devolución.
+- Modal admin renderiza ReturnDetailsContent con React dentro de un HTMLElement entregado a SweetAlert y desmonta su raíz al destruir el modal. No hay HTML dinámico imprescindible ni sanitización casera: React escapa los valores y conserva datos, fotos, distribución en columnas y desplazamiento. Rechazo cliente usa el mismo mecanismo seguro. Errores de registro/recuperación/perfil/pago/devoluciones usan text; títulos backend de wishlist/carrito y helpers usan titleText. Esto incluye corregir el segundo argumento posicional de Swal.fire, que se interpreta como HTML.
+
+## Política de URLs
+
+safeMediaUrl admite solo HTTPS sin credenciales ni caracteres de control/espacios. Lista explícita: origen exacto del frontend, origen exacto de appConfig.apiBaseUrl y `https://res.cloudinary.com` exclusivamente bajo `/<cuenta>/image/upload/`. No se admiten comodines, javascript/data/blob/http, otros orígenes ni SVG explícitos. URLs relativas se resuelven contra el backend y se aplica la misma política. Se usan propiedades React, no atributos construidos con cadenas HTML.
+
+Una evidencia bloqueada se reemplaza por un aviso, nunca por un enlace activo. Las guías en vistas de devolución también se limitan a la política; proveedores que devuelvan un origen distinto necesitan una incorporación deliberada después de verificar el contrato real. **Pendiente:** confirmar hosts/cuenta Cloudinary usados realmente; la cuenta CDN no está fijada por falta de esa evidencia. La política no sustituye control de acceso a documentos en backend ni valida el contenido binario servido.
+
+## Archivos funcionales y de pruebas
+
+El [diff por archivo](08_DIFF_PRIMERA_FASE.md) contiene la lista completa y cada cambio. Grupos:
+
+- Servicios: Shipping.service.ts y nuevo CheckoutShipping.service.ts.
+- Cotización/UI: nuevo useShippingQuote.ts y ShippingQuoteGate.tsx; Payment.tsx y CartSummary.tsx.
+- Rastreo/detalle: TrackingTimeline.tsx y OrderDetail.tsx.
+- Modal: ReturnsList.tsx y nuevo ReturnDetailsContent.tsx; nuevos reactAlert.tsx, safeMediaUrl.ts y returnDisplay.ts.
+- Otros sinks F03: Register.tsx, RecoverPassword.tsx, MyProfile.tsx, Wishlist.tsx, CartItem.tsx y utils/alerts.ts.
+- Ejecución persistente: package.json (solo script test), tests/register.mjs, tests/shipping-security.test.mjs y tests/README.md.
+- Documentación: seguimiento en 02_HALLAZGOS_FRONTEND.md y 04_PRUEBAS_FRONTEND.md; este registro y el diff.
+
+No se modificó package-lock.json: SHA256 previo y final `BD64971F0DD3411A7E8A4E63592A2A1D894CDC73AC53F16C38AB6725A310B436`. La incorporación de un script npm no añade dependencias ni necesita regenerarlo.
+
+## Verificación
+
+19/19 pruebas persistentes sin red pasan. TypeScript pasa. Build con `npm.cmd run build -- --configLoader runner` pasa (873 módulos; JS 1,033.82 kB / 314.75 gzip). El build estándar sigue limitado por esbuild/EACCES al leer el directorio padre, como en la auditoría previa. Se utilizó npm.cmd por la ExecutionPolicy de PowerShell, sin cambiarla.
+
+Lint global: 126 errores y 7 advertencias, frente a 141 y 8 al iniciar esta fase. Comparación por archivo/regla/mensaje: cero diagnósticos nuevos. Permanecen any, reglas de hooks y otros errores previos fuera de alcance; no se desactivaron reglas ni se corrigieron otros hallazgos para obtener un resultado verde. Persisten advertencias de bundle grande e import estático/dinámico de SweetAlert. `git diff --check` pasa.
+
+Los tests usan los módulos reales TS/TSX y React SSR, con API/config/CSS mockeados. No montan Payment ni SweetAlert en navegador, no cargan el SDK PayPal y no son una prueba de integración Django. Requieren Node 24 como runtime verificado. El cargador no es parte del bundle de producción.
+
+## Pendientes y riesgos backend
+
+F02/F03/F07 quedan **mitigados localmente, pendientes de integración**, no cerrados para producción. Verificar:
+
+1. Contrato real de tarifas: campos id/title/carrier/price y estimated_days. Respuestas distintas fallan de forma segura y podrían bloquear checkout hasta acordar el contrato.
+2. Backend debe recalcular importes, validar stock/dirección/propiedad, ligar cotización vigente a carrito y orden PayPal, y deduplicar captura/pedido. F01/F05 siguen abiertos; JavaScript siempre puede alterarse.
+3. Rastreo debe devolver estados y guías auténticos en campos normalizados; un proveedor/backend que devuelva simulaciones no puede distinguirse desde el cliente. Payload live desconocido no se interpreta ni se convierte en eventos.
+4. Probar en staging el ciclo real de SweetAlert, URLs reales de evidencias/guías y layout móvil; la prueba SSR verifica escape y ausencia de elementos activos, no apariencia visual.
+5. Ensayar checkout sandbox aislado: error/recuperación de cotización, cambio de domicilio/carrito en otra pestaña y durante una ventana PayPal larga (incluida caducidad local). No se acredita conciliación/idempotencia financiera en esta fase.
+
+No se instalaron paquetes, no se ejecutaron APIs comerciales ni se aplicó ningún cambio remoto. El trabajo queda en la rama indicada para revisión local, sin integración automática.
```

