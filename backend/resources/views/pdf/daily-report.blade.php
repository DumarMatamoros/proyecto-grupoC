<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Diario - {{ $fecha }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 15mm 18mm;
            size: A4 portrait;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #333;
            background: #fff;
        }

        .report-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0 5mm;
        }

        /* Header compacto */
        .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #2563eb;
        }

        .empresa-nombre {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 2px;
        }

        .empresa-ruc {
            font-size: 10px;
            color: #666;
        }

        .report-title {
            font-size: 13px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 6px;
        }

        .report-date {
            font-size: 11px;
            color: #2563eb;
            font-weight: bold;
        }

        /* Resumen compacto en tabla horizontal */
        .summary-section {
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 6px;
            padding: 5px 8px;
            background: #eff6ff;
            border-left: 3px solid #2563eb;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .summary-table td {
            text-align: center;
            padding: 8px 5px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
        }

        .summary-table .value {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            display: block;
        }

        .summary-table .value.success {
            color: #16a34a;
        }

        .summary-table .label {
            font-size: 8px;
            color: #64748b;
            display: block;
            margin-top: 2px;
        }

        /* Tablas de resumen lado a lado */
        .two-columns {
            width: 100%;
            margin-bottom: 10px;
        }

        .two-columns table {
            width: 48%;
            display: inline-table;
            vertical-align: top;
        }

        .two-columns table:first-child {
            margin-right: 3%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        thead th {
            background: #2563eb;
            color: #fff;
            padding: 5px 6px;
            text-align: left;
            font-size: 8px;
            font-weight: 600;
        }

        thead th.text-right {
            text-align: right;
        }

        thead th.text-center {
            text-align: center;
        }

        tbody tr {
            border-bottom: 1px solid #e2e8f0;
        }

        tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        tbody td {
            padding: 4px 6px;
            font-size: 8px;
        }

        tbody td.text-right {
            text-align: right;
        }

        tbody td.text-center {
            text-align: center;
        }

        tfoot td {
            padding: 5px 6px;
            font-weight: bold;
            background: #f1f5f9;
            border-top: 1px solid #2563eb;
            font-size: 8px;
        }

        /* Tabla de detalle de ventas */
        .ventas-detalle table {
            font-size: 8px;
        }

        .ventas-detalle thead th {
            padding: 4px 5px;
            font-size: 7px;
        }

        .ventas-detalle tbody td {
            padding: 3px 5px;
            font-size: 7px;
        }

        .numero-factura {
            font-family: monospace;
            font-weight: bold;
            font-size: 7px;
        }

        /* Gran total compacto */
        .grand-total {
            background: #2563eb;
            color: #fff;
            padding: 10px 15px;
            margin: 10px 0;
            text-align: center;
        }

        .grand-total .label {
            font-size: 9px;
        }

        .grand-total .value {
            font-size: 20px;
            font-weight: bold;
        }

        /* Footer compacto */
        .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 8px;
            color: #64748b;
        }

        .footer-content {
            width: 100%;
        }

        .footer-left {
            display: inline-block;
            width: 60%;
            vertical-align: top;
        }

        .footer-right {
            display: inline-block;
            width: 35%;
            text-align: center;
            vertical-align: top;
        }

        .signature-line {
            border-top: 1px solid #333;
            margin-top: 25px;
            padding-top: 3px;
            font-size: 8px;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="header">
            <div class="empresa-nombre">{{ $empresa['nombre'] }}</div>
            <div class="empresa-ruc">RUC: {{ $empresa['ruc'] }}</div>
            <div class="report-title">REPORTE DIARIO DE VENTAS</div>
            <div class="report-date">{{ $fecha }}</div>
        </div>

        <!-- Resumen del día en tabla horizontal -->
        <div class="summary-section">
            <div class="section-title">RESUMEN DEL DIA</div>
            <table class="summary-table">
                <tr>
                    <td>
                        <span class="value">{{ $totales['facturas'] }}</span>
                        <span class="label">Facturas</span>
                    </td>
                    <td>
                        <span class="value">${{ number_format($totales['subtotal'], 2) }}</span>
                        <span class="label">Subtotal</span>
                    </td>
                    <td>
                        <span class="value">${{ number_format($totales['iva'], 2) }}</span>
                        <span class="label">IVA</span>
                    </td>
                    <td>
                        <span class="value">${{ number_format($totales['descuentos'], 2) }}</span>
                        <span class="label">Descuentos</span>
                    </td>
                    <td>
                        <span class="value success">${{ number_format($totales['total'], 2) }}</span>
                        <span class="label">TOTAL</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Resumen por forma de pago y cajero lado a lado -->
        <div class="two-columns">
            <table>
                <thead>
                    <tr>
                        <th colspan="3" style="text-align: center; background: #1e40af;">VENTAS POR FORMA DE PAGO</th>
                    </tr>
                    <tr>
                        <th>Forma de Pago</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($porFormaPago as $formaPago => $datos)
                        <tr>
                            <td>{{ \App\Models\Factura::FORMAS_PAGO[$formaPago] ?? $formaPago }}</td>
                            <td class="text-center">{{ $datos['cantidad'] }}</td>
                            <td class="text-right">${{ number_format($datos['total'], 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3" style="text-align: center;">Sin ventas</td>
                        </tr>
                    @endforelse
                </tbody>
                <tfoot>
                    <tr>
                        <td>TOTAL</td>
                        <td class="text-center">{{ $totales['facturas'] }}</td>
                        <td class="text-right">${{ number_format($totales['total'], 2) }}</td>
                    </tr>
                </tfoot>
            </table>

            <table>
                <thead>
                    <tr>
                        <th colspan="3" style="text-align: center; background: #1e40af;">VENTAS POR CAJERO</th>
                    </tr>
                    <tr>
                        <th>Cajero</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($porCajero as $cajero => $datos)
                        <tr>
                            <td>{{ Str::limit($cajero, 20) }}</td>
                            <td class="text-center">{{ $datos['cantidad'] }}</td>
                            <td class="text-right">${{ number_format($datos['total'], 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3" style="text-align: center;">Sin ventas</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Gran Total -->
        <div class="grand-total">
            <span class="label">TOTAL RECAUDADO DEL DIA: </span>
            <span class="value">${{ number_format($totales['total'], 2) }}</span>
        </div>

        <!-- Detalle de ventas -->
        <div class="ventas-detalle">
            <div class="section-title">DETALLE DE VENTAS</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 4%;">#</th>
                        <th style="width: 14%;">N. Factura</th>
                        <th style="width: 7%;">Hora</th>
                        <th style="width: 22%;">Cliente</th>
                        <th class="text-right" style="width: 11%;">Subtotal</th>
                        <th class="text-right" style="width: 9%;">IVA</th>
                        <th class="text-right" style="width: 11%;">Total</th>
                        <th class="text-center" style="width: 11%;">Pago</th>
                        <th style="width: 11%;">Cajero</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($facturas as $index => $factura)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td class="numero-factura">{{ $factura->numero_factura }}</td>
                            <td>{{ $factura->hora }}</td>
                            <td>{{ Str::limit($factura->nombre_cliente, 20) }}</td>
                            <td class="text-right">${{ number_format($factura->total_sin_impuestos, 2) }}</td>
                            <td class="text-right">${{ number_format($factura->total_iva, 2) }}</td>
                            <td class="text-right"><strong>${{ number_format($factura->total, 2) }}</strong></td>
                            <td class="text-center">{{ Str::limit($factura->forma_pago_label, 10) }}</td>
                            <td>{{ Str::limit($factura->usuario?->name ?? '-', 12) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="9" style="text-align: center; padding: 15px;">
                                No hay ventas registradas para esta fecha
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                @if($facturas->count() > 0)
                    <tfoot>
                        <tr>
                            <td colspan="4">TOTALES</td>
                            <td class="text-right">${{ number_format($totales['subtotal'], 2) }}</td>
                            <td class="text-right">${{ number_format($totales['iva'], 2) }}</td>
                            <td class="text-right">${{ number_format($totales['total'], 2) }}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                @endif
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-left">
                    <p>Generado: {{ $generado_en }}</p>
                    <p>Por: {{ $usuario?->name ?? 'Sistema' }}</p>
                </div>
                <div class="footer-right">
                    <div class="signature-line">
                        Firma del Responsable
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
