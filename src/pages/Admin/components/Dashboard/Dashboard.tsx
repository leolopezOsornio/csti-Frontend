import { useState, useEffect } from 'react';
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
import adminPanelService from '../../../../services/AdminPanel.service';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ ventas_hoy: 0, ordenes_pendientes: 0, total_productos: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, ordersRes] = await Promise.all([
        adminPanelService.getDashboardStats(),
        adminPanelService.getSalesChart(),
        adminPanelService.getOrders()
      ]);
      setStats(statsRes);
      // La API devuelve { fecha: 'DD/MM', total: X }
      // Recharts espera que el campo coincida con dataKey (sales)
      const formattedChart = chartRes.map((d: any) => ({
        name: d.fecha,
        sales: d.total
      }));
      setChartData(formattedChart);
      setRecentOrders(ordersRes.slice(0, 5));
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Cargando panel...</div>;
  }

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
            <span className={styles.statValue}>${Number(stats.ventas_hoy).toLocaleString()} MXN</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pedidos Pendientes</span>
            <span className={styles.statValue}>{stats.ordenes_pendientes}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Productos (CVA)</span>
            <span className={styles.statValue}>{Number(stats.total_productos).toLocaleString()}</span>
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
            {recentOrders.map((order: any) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.user_data?.first_name} {order.user_data?.last_name}</td>
                <td>
                  <span className={`${styles.pill} ${order.estado_pago === 'COMPLETADO' ? styles.pillCompletado :
                      order.estado_pago === 'PENDIENTE' ? styles.pillPendiente :
                        styles.pillFallido
                    }`}>
                    {order.estado_pago === 'COMPLETADO' ? 'Pagado' :
                      order.estado_pago === 'PENDIENTE' ? 'Pendiente' : 'Fallido'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>${Number(order.monto_total).toLocaleString()} MXN</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Dashboard;
