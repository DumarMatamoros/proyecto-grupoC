<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Ventas</title>
    <style>
        @page {
            margin: 15mm;
            size: A4 portrait;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 8px;
            line-height: 1.2;
            color: #333;
            background: #fff;
        }

        .report-container {
            width: 100%;
            max-width: 100%;
        }

        /* Header compacto en tabla */
        .header-table {
            width: 100%;
            margin-bottom: 8px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 6px;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
            padding: 0;
        }

        .empresa-nombre {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
        }

        .empresa-ruc {
            font-size: 9px;
            color: #666;
        }

        .report-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
        }

        .report-subtitle {
            text-align: center;
            font-size: 9px;
            color: #64748b;
        }

        .report-meta {
            text-align: right;
            font-size: 8px;
            color: #64748b;
        }

        /* Filtros en linea */
        .filters-info {
            background: #f1f5f9;
            padding: 4px 8px;
            margin-bottom: 6px;
            font-size: 8px;
            border-left: 3px solid #2563eb;
        }

        .filters-info span {
            margin-right: 12px;
        }

        .filters-info strong {
            color: #2563eb;
        }

        /* Resumen horizontal compacto */
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .summary-table td {
            text-align: center;
            padding: 6px 4px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            width: 20%;
        }

        .summary-table .value {
            font-size: 12px;
            font-weight: bold;
            color: #2563eb;
            display: block;
        }

        .summary-table .value.success {
            color: #16a34a;
        }

        .summary-table .label {
            font-size: 7px;
            color: #64748b;
            display: block;
            margin-top: 1px;
        }

        /* Tabla principal */
        table.ventas-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        table.ventas-table thead th {
            background: #2563eb;
            color: #fff;
            padding: 4px 3px;
            text-align: left;
            font-size: 7px;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
        }

        table.ventas-table thead th.text-right {
            text-align: right;
        }

        table.ventas-table thead th.text-center {
            text-align: center;
        }

        table.ventas-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
        }

        table.ventas-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        table.ventas-table tbody td {
            padding: 3px 3px;
            font-size: 7px;
            vertical-align: middle;
        }

        table.ventas-table tbody td.text-right {
            text-align: right;
        }

        table.ventas-table tbody td.text-center {
            text-align: center;
        }

        .numero-factura {
            font-family: monospace;
            font-weight: bold;
            font-size: 6px;
        }

        /* Estados */
        .estado-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 8px;
            font-size: 6px;
            font-weight: bold;
        }

        .estado-emitida { background: #dcfce7; color: #166534; }
        .estado-pagada { background: #dbeafe; color: #1e40af; }
        .estado-anulada { background: #fee2e2; color: #991b1b; }
        .estado-pendiente { background: #fef3c7; color: #92400e; }

        /* Totales a la derecha */
        .totales-wrapper {
            text-align: right;
            margin-bottom: 6px;
        }

        .totales-box {
            display: inline-block;
            width: 180px;
            border: 1px solid #e2e8f0;
            text-align: left;
        }

        .total-row {
            padding: 3px 8px;
            font-size: 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        .total-row:last-child {
            border-bottom: none;
        }

        .total-row span {
            display: inline-block;
        }

        .total-row .label {
            width: 65%;
        }

        .total-row .amount {
            width: 35%;
            text-align: right;
        }

        .total-row.grand-total {
            background: #2563eb;
            color: #fff;
            font-size: 9px;
            font-weight: bold;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            font-size: 7px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header en tabla -->
        <table class="header-table">
            <tr>
                <td style="width: 25%;">
                    <div class="empresa-nombre">{{ $empresa['nombre'] }}</div>
                    <div class="empresa-ruc">RUC: {{ $empresa['ruc'] }}</div>
                </td>
                <td style="width: 50%;">
                    <div class="report-title">REPORTE DE VENTAS</div>
                    <div class="report-subtitle">
                        @if($filters['fecha_inicio'] && $filters['fecha_fin'])
                            Del {{ \Carbon\Carbon::parse($filters['fecha_inicio'])->format('d/m/Y') }} 
                            al {{ \Carbon\Carbon::parse($filters['fecha_fin'])->format('d/m/Y') }}
                        @elseif($filters['fecha_inicio'])
                            Desde {{ \Carbon\Carbon::parse($filters['fecha_inicio'])->format('d/m/Y') }}
                        @elseif($filters['fecha_fin'])
                            Hasta {{ \Carbon\Carbon::parse($filters['fecha_fin'])->format('d/m/Y') }}
                        @else
                            Todas las fechas
                        @endif
                    </div>
                </td>
                <td style="width: 25%;">
                    <div class="report-meta">
                        Generado: {{ $generado_en }}<br>
                        Por: {{ $usuario?->name ?? 'Sistema' }}
                    </div>
                </td>
            </tr>
        </table>

        <!-- Filtros aplicados -->
        @if($filters['search'] || $filters['estado'] || $filters['forma_pago'])
            <div class="filters-info">
                <strong>Filtros:</strong>
                @if($filters['search'])
                    <span>Busqueda: "{{ $filters['search'] }}"</span>
                @endif
                @if($filters['estado'])
                    <span>Estado: {{ \App\Models\Factura::ESTADOS[$filters['estado']] ?? $filters['estado'] }}</span>
                @endif
                @if($filters['forma_pago'])
                    <span>Pago: {{ \App\Models\Factura::FORMAS_PAGO[$filters['forma_pago']] ?? $filters['forma_pago'] }}</span>
                @endif
            </div>
        @endif

        <!-- Resumen horizontal -->
        <table class="summary-table">
            <tr>
                <td>
                    <span class="value">{{ $totales['count'] }}</span>
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
                    <span class="value">${{ number_format($totales['descuento'], 2) }}</span>
                    <span class="label">Descuentos</span>
                </td>
                <td>
                    <span class="value success">${{ number_format($totales['total'], 2) }}</span>
                    <span class="label">TOTAL</span>
                </td>
            </tr>
        </table>

        <!-- Tabla de facturas -->
        <table class="ventas-table">
            <thead>
                <tr>
                    <th style="width: 9%;">N. Factura</th>
                    <th style="width: 7%;">Fecha</th>
                    <th style="width: 5%;">Hora</th>
                    <th style="width: 9%;">CI/RUC</th>
                    <th style="width: 16%;">Cliente</th>
                    <th class="text-right" style="width: 9%;">Subtotal</th>
                    <th class="text-right" style="width: 7%;">IVA</th>
                    <th class="text-right" style="width: 6%;">Desc.</th>
                    <th class="text-right" style="width: 9%;">Total</th>
                    <th class="text-center" style="width: 8%;">F. Pago</th>
                    <th class="text-center" style="width: 7%;">Estado</th>
                    <th style="width: 8%;">Usuario</th>
                </tr>
            </thead>
            <tbody>
                @forelse($facturas as $factura)
                    <tr>
                        <td class="numero-factura">{{ $factura->numero_factura }}</td>
                        <td>{{ $factura->fecha_emision?->format('d/m/Y') }}</td>
                        <td>{{ $factura->hora }}</td>
                        <td>{{ Str::limit($factura->cedula_cliente, 12) }}</td>
                        <td title="{{ $factura->nombre_cliente }}">
                            {{ Str::limit($factura->nombre_cliente, 22) }}
                        </td>
                        <td class="text-right">${{ number_format($factura->total_sin_impuestos, 2) }}</td>
                        <td class="text-right">${{ number_format($factura->total_iva, 2) }}</td>
                        <td class="text-right">${{ number_format($factura->descuento, 2) }}</td>
                        <td class="text-right"><strong>${{ number_format($factura->total, 2) }}</strong></td>
                        <td class="text-center">{{ Str::limit($factura->forma_pago_label, 10) }}</td>
                        <td class="text-center">
                            <span class="estado-badge estado-{{ $factura->estado }}">
                                {{ $factura->estado_label }}
                            </span>
                        </td>
                        <td>{{ Str::limit($factura->usuario?->name ?? '-', 10) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="12" style="text-align: center; padding: 15px; color: #64748b;">
                            No se encontraron facturas con los filtros aplicados
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Totales finales -->
        <div class="totales-wrapper">
            <div class="totales-box">
                <div class="total-row">
                    <span class="label">Subtotal:</span>
                    <span class="amount">${{ number_format($totales['subtotal'], 2) }}</span>
                </div>
                <div class="total-row">
                    <span class="label">IVA:</span>
                    <span class="amount">${{ number_format($totales['iva'], 2) }}</span>
                </div>
                <div class="total-row">
                    <span class="label">Descuentos:</span>
                    <span class="amount">-${{ number_format($totales['descuento'], 2) }}</span>
                </div>
                <div class="total-row grand-total">
                    <span class="label">TOTAL:</span>
                    <span class="amount">${{ number_format($totales['total'], 2) }}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            {{ $empresa['nombre'] }} | RUC: {{ $empresa['ruc'] }} | Generado: {{ $generado_en }} | Documento interno sin validez tributaria
        </div>
    </div>
</body>
</html>
