import {
  FaUsers,
  FaTags,
  FaBoxOpen,
  FaShoppingCart,
} from "react-icons/fa";
import Chart from "chart.js/auto";
import { useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function PanelPrincipal() {
  const ventasChartRef = useRef(null);
  const chartInstance = useRef(null);

  const [stats, setStats] = useState({
    usuarios: 0,
    categorias: 0,
    productos: 0,
    ventas: 0,
  });

  // =====================================
  // CARGAR ESTADISTICAS DEL BACKEND
  // =====================================
  useEffect(() => {
    async function fetchStats() {
      try {
        // Usuarios (admin)
        const resUsuarios = await api.get("/admin/usuarios");
        const totalUsuarios = resUsuarios.data.data?.total ?? 0;

        // Categorías
        const resCategorias = await api.get("/categorias");

        // Productos
        const resProductos = await api.get("/productos");

        // Ventas (facturas)
        const resVentas = await api.get("/facturas");

        const totalVentas = resVentas.data.data?.data?.length ?? 0;

        setStats({
          usuarios: totalUsuarios,
          categorias: resCategorias.data.length,
          productos: resProductos.data.length,
          ventas: totalVentas,
        });
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      }
    }

    fetchStats();
  }, []);

  // =====================================
  // GRAFICO (SEGURO Y SIN ERRORES)
  // =====================================
  useEffect(() => {
    if (!ventasChartRef.current) return;

    // Si ya existe un gráfico, destruirlo
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = ventasChartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        datasets: [
          {
            label: "Ventas del año",
            data: [2, 5, 3, 8, 4, 7],
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.3)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6 text-center">
        Panel de Control — Inventario y Facturación
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card color="bg-green-500" icon={<FaUsers />} title="Usuarios" value={stats.usuarios} />
        <Card color="bg-orange-500" icon={<FaTags />} title="Categorías" value={stats.categorias} />
        <Card color="bg-blue-500" icon={<FaBoxOpen />} title="Productos" value={stats.productos} />
        <Card color="bg-yellow-500" icon={<FaShoppingCart />} title="Ventas" value={stats.ventas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        <div className="bg-white shadow-lg rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-3">Ventas por mes</h2>
          <canvas ref={ventasChartRef} height={120}></canvas>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-5">Últimas Ventas</h2>

          <ul className="space-y-3">
            <li className="p-3 bg-gray-100 rounded-lg">🟦 Venta #102 — $25.00</li>
            <li className="p-3 bg-gray-100 rounded-lg">🟩 Venta #101 — $12.50</li>
            <li className="p-3 bg-gray-100 rounded-lg">🟧 Venta #100 — $7.40</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

function Card({ color, icon, title, value }) {
  return (
    <div className={`text-white p-6 rounded-xl shadow-md flex items-center justify-between ${color} cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200`}>
      <div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm">{title}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  );
}
