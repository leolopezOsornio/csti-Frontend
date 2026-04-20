// src/pages/Admin/components/Dashboard/Dashboard.tsx
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillTrendUp, faCartShopping, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import styles from './Dashboard.module.css';

// Mock Data Orden (coincidiendo con Django)
const recentOrders = [
  { id: '00000007', user: { username: 'Admin Sarosla' }, estado_pago: 'COMPLETADO', monto_total: '$45,200 MXN' },
  { id: '00000008', user: { username: 'Juan Pérez' }, estado_pago: 'PENDIENTE', monto_total: '$12,500 MXN' },
  { id: '00000009', user: { username: 'María García' }, estado_pago: 'COMPLETADO', monto_total: '$3,400 MXN' },
  { id: '00000010', user: { username: 'Carlos López' }, estado_pago: 'PENDIENTE', monto_total: '$1,200 MXN' },
  { id: '00000011', user: { username: 'Ana Martínez' }, estado_pago: 'FALLIDO', monto_total: '$8,900 MXN' },
];

// Mock Data Performance (7 days)
const chartData = [
  { name: 'Lun', sales: 12000 },
  { name: 'Mar', sales: 19000 },
  { name: 'Mie', sales: 15000 },
  { name: 'Jue', sales: 22000 },
  { name: 'Vie', sales: 30000 },
  { name: 'Sab', sales: 25000 },
  { name: 'Dom', sales: 35000 },
];

const Dashboard = () => {
  return (
    <div className={styles.container}>
      <header>
        <h1 className={styles.title}>Panel de Control / <span style={{ color: '#64748b', fontWeight: 400 }}>Resumen</span></h1>
      </header>

      {/* Summary Cards */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FontAwesomeIcon icon={faMoneyBillTrendUp} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Ventas Hoy</span>
            <span className={styles.statValue}>$45,200 MXN</span>
            <span className={`${styles.statTrend} ${styles.trendPositive}`}>+12% vs ayer</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pedidos Pendientes</span>
            <span className={styles.statValue}>14</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Productos (CVA)</span>
            <span className={styles.statValue}>15,430</span>
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className={styles.chartSection}>
        <h2 className={styles.chartTitle}>Rendimiento de Ventas (Últimos 7 días)</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Table */}
      <section className={styles.tableContainer}>
        <h2 className={styles.tableTitle}>Órdenes Recientes</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.user.username}</td>
                <td>
                  <span className={`${styles.pill} ${
                    order.estado_pago === 'COMPLETADO' ? styles.pillCompletado : 
                    order.estado_pago === 'PENDIENTE' ? styles.pillPendiente : 
                    styles.pillFallido
                  }`}>
                    {order.estado_pago === 'COMPLETADO' ? 'Pagado' : 
                     order.estado_pago === 'PENDIENTE' ? 'Pendiente' : 'Fallido'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{order.monto_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Dashboard;
