<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Factura;
use App\Models\Configuracion;
use App\Exports\SalesExport;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Exportar ventas a Excel/CSV
     */
    public function exportExcel(Request $request)
    {
        $filters = [
            'fecha_inicio' => $request->input('fecha_inicio'),
            'fecha_fin' => $request->input('fecha_fin'),
            'search' => $request->input('search'),
            'estado' => $request->input('estado'),
            'forma_pago' => $request->input('forma_pago'),
        ];

        $export = new SalesExport($filters);
        $format = $request->input('format', 'excel'); // 'excel' o 'csv'
        $filename = 'ventas_' . now()->format('Y-m-d_H-i-s');

        if ($format === 'csv') {
            return $export->downloadCsv($filename . '.csv');
        }

        return $export->downloadExcel($filename . '.xls');
    }

    /**
     * Exportar ventas a PDF (Reporte horizontal)
     */
    public function exportPdf(Request $request)
    {
        $filters = [
            'fecha_inicio' => $request->input('fecha_inicio'),
            'fecha_fin' => $request->input('fecha_fin'),
            'search' => $request->input('search'),
            'estado' => $request->input('estado'),
            'forma_pago' => $request->input('forma_pago'),
        ];

        $facturas = Factura::with(['cliente', 'sucursal', 'usuario'])
            ->filterByDate($filters['fecha_inicio'], $filters['fecha_fin'])
            ->search($filters['search'])
            ->filterByEstado($filters['estado'])
            ->filterByFormaPago($filters['forma_pago'])
            ->orderBy('fecha_emision', 'desc')
            ->get();

        // Calcular totales
        $totales = [
            'count' => $facturas->count(),
            'subtotal' => $facturas->sum('total_sin_impuestos'),
            'iva' => $facturas->sum('total_iva'),
            'descuento' => $facturas->sum('descuento'),
            'total' => $facturas->sum('total'),
        ];

        // Datos de la empresa
        $empresa = [
            'nombre' => Configuracion::obtener('empresa_nombre', 'Mi Empresa'),
            'ruc' => Configuracion::obtener('ruc_empresa', '0000000000001'),
            'direccion' => Configuracion::obtener('empresa_direccion', 'Dirección no configurada'),
            'telefono' => Configuracion::obtener('empresa_telefono', ''),
        ];

        $pdf = Pdf::loadView('pdf.sales-report', [
            'facturas' => $facturas,
            'totales' => $totales,
            'filters' => $filters,
            'empresa' => $empresa,
            'usuario' => $request->user(),
            'generado_en' => now()->format('d/m/Y H:i:s'),
        ]);

        $pdf->setPaper('a4', 'landscape');

        $filename = 'reporte_ventas_' . now()->format('Y-m-d_H-i-s') . '.pdf';

        return $pdf->stream($filename);
    }

    /**
     * Generar Ticket de venta (formato térmico 80mm)
     */
    public function ticket(Request $request, $id)
    {
        $factura = Factura::with(['detalles.producto', 'sucursal', 'usuario'])
            ->findOrFail($id);

        // Datos de la empresa
        $empresa = [
            'nombre' => Configuracion::obtener('empresa_nombre', 'Mi Empresa'),
            'ruc' => Configuracion::obtener('ruc_empresa', '0000000000001'),
            'direccion' => Configuracion::obtener('empresa_direccion', 'Dirección'),
            'telefono' => Configuracion::obtener('empresa_telefono', ''),
            'email' => Configuracion::obtener('empresa_email', ''),
        ];

        // Si se solicita como PDF
        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('pdf.ticket', [
                'factura' => $factura,
                'empresa' => $empresa,
            ]);

            // Configurar tamaño para impresora térmica 80mm
            // 80mm = 226.77 puntos, altura variable
            $pdf->setPaper([0, 0, 226.77, 600], 'portrait');

            return $pdf->stream("ticket_{$factura->numero_factura}.pdf");
        }

        // Renderizar vista HTML para impresión directa
        return view('pdf.ticket', [
            'factura' => $factura,
            'empresa' => $empresa,
        ]);
    }

    /**
     * Generar Factura formal A4
     */
    public function invoice(Request $request, $id)
    {
        $factura = Factura::with(['detalles.producto', 'sucursal', 'usuario', 'cliente'])
            ->findOrFail($id);

        // Datos de la empresa
        $empresa = [
            'nombre' => Configuracion::obtener('empresa_nombre', 'Mi Empresa'),
            'ruc' => Configuracion::obtener('ruc_empresa', '0000000000001'),
            'direccion' => Configuracion::obtener('empresa_direccion', 'Dirección'),
            'telefono' => Configuracion::obtener('empresa_telefono', ''),
            'email' => Configuracion::obtener('empresa_email', ''),
            'ciudad' => Configuracion::obtener('empresa_ciudad', 'Ciudad'),
        ];

        // Si se solicita como PDF
        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('pdf.invoice', [
                'factura' => $factura,
                'empresa' => $empresa,
            ]);

            $pdf->setPaper('a4', 'portrait');

            return $pdf->stream("factura_{$factura->numero_factura}.pdf");
        }

        // Renderizar vista HTML para impresión directa
        return view('pdf.invoice', [
            'factura' => $factura,
            'empresa' => $empresa,
        ]);
    }

    /**
     * Reporte diario de ventas (JSON para frontend)
     */
    public function dailyReportData(Request $request)
    {
        $fecha = $request->input('fecha', now()->format('Y-m-d'));
        $fechaAnterior = Carbon::parse($fecha)->subDay()->format('Y-m-d');

        // Facturas del día seleccionado
        $facturas = Factura::with(['detalles.producto', 'usuario'])
            ->whereDate('fecha_emision', $fecha)
            ->validas()
            ->orderBy('created_at', 'asc')
            ->get();

        // Facturas del día anterior para comparación
        $facturasAyer = Factura::whereDate('fecha_emision', $fechaAnterior)
            ->validas()
            ->get();

        // Calcular totales del día
        $ventasHoy = $facturas->sum('total');
        $ventasAyer = $facturasAyer->sum('total');
        $transaccionesHoy = $facturas->count();
        $transaccionesAyer = $facturasAyer->count();

        // Productos vendidos
        $productosVendidos = $facturas->flatMap(function ($f) {
            return $f->detalles;
        })->sum('cantidad');

        $productosAyer = Factura::with('detalles')
            ->whereDate('fecha_emision', $fechaAnterior)
            ->validas()
            ->get()
            ->flatMap(function ($f) {
                return $f->detalles;
            })->sum('cantidad');

        // Ticket promedio
        $ticketPromedio = $transaccionesHoy > 0 ? $ventasHoy / $transaccionesHoy : 0;
        $ticketPromedioAyer = $transaccionesAyer > 0 ? $ventasAyer / $transaccionesAyer : 0;

        // Calcular porcentajes de variación
        $variacionVentas = $ventasAyer > 0 ? (($ventasHoy - $ventasAyer) / $ventasAyer) * 100 : 0;
        $variacionTransacciones = $transaccionesAyer > 0 ? (($transaccionesHoy - $transaccionesAyer) / $transaccionesAyer) * 100 : 0;
        $variacionTicket = $ticketPromedioAyer > 0 ? (($ticketPromedio - $ticketPromedioAyer) / $ticketPromedioAyer) * 100 : 0;
        $variacionProductos = $productosAyer > 0 ? (($productosVendidos - $productosAyer) / $productosAyer) * 100 : 0;

        // Agrupar por hora
        $ventasPorHora = $facturas->groupBy(function ($f) {
            return Carbon::parse($f->hora)->format('H:00');
        })->map(function ($group) {
            return [
                'cantidad' => $group->count(),
                'total' => round($group->sum('total'), 2),
            ];
        })->sortKeys();

        // Rellenar horas faltantes
        $horasCompletas = [];
        for ($h = 0; $h < 24; $h++) {
            $hora = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
            $horasCompletas[$hora] = $ventasPorHora[$hora] ?? ['cantidad' => 0, 'total' => 0];
        }

        // Agrupar por forma de pago
        $porFormaPago = $facturas->groupBy('forma_pago')->map(function ($group, $key) {
            return [
                'forma_pago' => $key,
                'label' => $this->getFormaPagoLabel($key),
                'cantidad' => $group->count(),
                'total' => round($group->sum('total'), 2),
            ];
        })->values();

        // Top 10 productos más vendidos
        $topProductos = $facturas->flatMap(function ($f) {
            return $f->detalles;
        })->groupBy('producto_id')->map(function ($detalles) {
            $producto = $detalles->first()->producto;
            return [
                'producto_id' => $detalles->first()->producto_id,
                'nombre' => $producto?->nombre ?? 'Producto eliminado',
                'codigo' => $producto?->codigo_principal ?? '-',
                'cantidad' => $detalles->sum('cantidad'),
                'total' => round($detalles->sum('total_detalle'), 2),
            ];
        })->sortByDesc('cantidad')->take(10)->values();

        // Resumen por cajero
        $porCajero = $facturas->groupBy(function ($f) {
            return $f->usuario_id ?? 0;
        })->map(function ($group) {
            $usuario = $group->first()->usuario;
            return [
                'usuario_id' => $group->first()->usuario_id,
                'nombre' => $usuario?->name ?? 'Sistema',
                'cantidad' => $group->count(),
                'total' => round($group->sum('total'), 2),
            ];
        })->values();

        // Totales generales
        $totales = [
            'subtotal' => round($facturas->sum('total_sin_impuestos'), 2),
            'iva' => round($facturas->sum('total_iva'), 2),
            'descuentos' => round($facturas->sum('descuento'), 2),
            'total' => round($ventasHoy, 2),
        ];

        return response()->json([
            'fecha' => $fecha,
            'fecha_formateada' => Carbon::parse($fecha)->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY'),
            'resumen' => [
                'ventas_totales' => round($ventasHoy, 2),
                'ventas_ayer' => round($ventasAyer, 2),
                'variacion_ventas' => round($variacionVentas, 1),
                'transacciones' => $transaccionesHoy,
                'transacciones_ayer' => $transaccionesAyer,
                'variacion_transacciones' => round($variacionTransacciones, 1),
                'ticket_promedio' => round($ticketPromedio, 2),
                'ticket_promedio_ayer' => round($ticketPromedioAyer, 2),
                'variacion_ticket' => round($variacionTicket, 1),
                'productos_vendidos' => $productosVendidos,
                'productos_ayer' => $productosAyer,
                'variacion_productos' => round($variacionProductos, 1),
            ],
            'ventas_por_hora' => $horasCompletas,
            'formas_pago' => $porFormaPago,
            'top_productos' => $topProductos,
            'por_cajero' => $porCajero,
            'totales' => $totales,
        ]);
    }

    /**
     * Obtener label de forma de pago
     */
    private function getFormaPagoLabel($formaPago)
    {
        $labels = [
            'efectivo' => 'Efectivo',
            'tarjeta' => 'Tarjeta',
            'transferencia' => 'Transferencia',
            'cheque' => 'Cheque',
            'credito' => 'Crédito',
        ];
        return $labels[$formaPago] ?? ucfirst($formaPago);
    }

    /**
     * Reporte diario de ventas (PDF)
     */
    public function dailyReport(Request $request)
    {
        $fecha = $request->input('fecha', now()->format('Y-m-d'));

        $facturas = Factura::with(['detalles.producto', 'usuario'])
            ->whereDate('fecha_emision', $fecha)
            ->validas()
            ->orderBy('created_at', 'asc')
            ->get();

        // Agrupar por forma de pago
        $porFormaPago = $facturas->groupBy('forma_pago')->map(function ($group) {
            return [
                'cantidad' => $group->count(),
                'total' => $group->sum('total'),
            ];
        });

        // Agrupar por usuario/cajero
        $porCajero = $facturas->groupBy(function ($f) {
            return $f->usuario?->name ?? 'Sin asignar';
        })->map(function ($group) {
            return [
                'cantidad' => $group->count(),
                'total' => $group->sum('total'),
            ];
        });

        // Totales del día
        $totales = [
            'facturas' => $facturas->count(),
            'subtotal' => $facturas->sum('total_sin_impuestos'),
            'iva' => $facturas->sum('total_iva'),
            'descuentos' => $facturas->sum('descuento'),
            'total' => $facturas->sum('total'),
        ];

        // Datos de la empresa
        $empresa = [
            'nombre' => Configuracion::obtener('empresa_nombre', 'Mi Empresa'),
            'ruc' => Configuracion::obtener('ruc_empresa', '0000000000001'),
        ];

        $pdf = Pdf::loadView('pdf.daily-report', [
            'facturas' => $facturas,
            'fecha' => Carbon::parse($fecha)->format('d/m/Y'),
            'porFormaPago' => $porFormaPago,
            'porCajero' => $porCajero,
            'totales' => $totales,
            'empresa' => $empresa,
            'usuario' => $request->user(),
            'generado_en' => now()->format('d/m/Y H:i:s'),
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = 'reporte_diario_' . $fecha . '.pdf';

        return $pdf->stream($filename);
    }
}
