<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura {{ $factura->numero_factura }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 15mm;
            size: A4 portrait;
        }

        @media print {
            .no-print {
                display: none !important;
            }
        }

        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: #fff;
            padding: 20px;
        }

        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            background: #fff;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
        }

        .empresa-info {
            flex: 1;
        }

        .empresa-nombre {
            font-size: 22px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .empresa-datos {
            font-size: 10px;
            color: #666;
            line-height: 1.5;
        }

        .factura-box {
            text-align: right;
            padding: 15px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            min-width: 200px;
        }

        .factura-tipo {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .factura-numero {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
        }

        .factura-fecha {
            font-size: 11px;
            color: #64748b;
            margin-top: 5px;
        }

        /* Estado */
        .estado-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
            margin-top: 8px;
        }

        .estado-emitida { background: #dcfce7; color: #166534; }
        .estado-pagada { background: #dbeafe; color: #1e40af; }
        .estado-anulada { background: #fee2e2; color: #991b1b; }
        .estado-pendiente { background: #fef3c7; color: #92400e; }

        /* Sección de datos */
        .info-section {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }

        .info-box {
            flex: 1;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .info-title {
            font-size: 12px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
        }

        .info-row {
            display: flex;
            margin-bottom: 5px;
            font-size: 11px;
        }

        .info-label {
            width: 100px;
            color: #64748b;
            font-weight: 500;
        }

        .info-value {
            flex: 1;
            color: #1e293b;
        }

        /* Tabla de productos */
        .productos-section {
            margin-bottom: 20px;
        }

        .productos-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead th {
            background: #2563eb;
            color: #fff;
            padding: 10px 8px;
            text-align: left;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        thead th:first-child {
            border-radius: 5px 0 0 0;
        }

        thead th:last-child {
            border-radius: 0 5px 0 0;
            text-align: right;
        }

        thead th.text-center {
            text-align: center;
        }

        thead th.text-right {
            text-align: right;
        }

        tbody tr {
            border-bottom: 1px solid #e2e8f0;
        }

        tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        tbody td {
            padding: 10px 8px;
            font-size: 10px;
        }

        tbody td.text-center {
            text-align: center;
        }

        tbody td.text-right {
            text-align: right;
        }

        .producto-codigo {
            font-size: 9px;
            color: #64748b;
        }

        /* Totales */
        .totales-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
        }

        .totales-box {
            width: 280px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
        }

        .total-row:last-child {
            border-bottom: none;
        }

        .total-row.grand-total {
            background: #2563eb;
            color: #fff;
            font-size: 14px;
            font-weight: bold;
            padding: 12px 15px;
        }

        .total-label {
            color: #64748b;
        }

        .total-row.grand-total .total-label {
            color: #fff;
        }

        .total-value {
            font-weight: 600;
            color: #1e293b;
        }

        .total-row.grand-total .total-value {
            color: #fff;
        }

        /* Información adicional */
        .additional-info {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }

        .pago-box, .observaciones-box {
            flex: 1;
            padding: 12px 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .pago-box strong, .observaciones-box strong {
            color: #2563eb;
            font-size: 10px;
            text-transform: uppercase;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
        }

        .footer p {
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="empresa-info">
                <div class="empresa-nombre">{{ $empresa['nombre'] }}</div>
                <div class="empresa-datos">
                    <p><strong>RUC:</strong> {{ $empresa['ruc'] }}</p>
                    <p><strong>Dirección:</strong> {{ $empresa['direccion'] }}</p>
                    @if($empresa['telefono'])
                        <p><strong>Teléfono:</strong> {{ $empresa['telefono'] }}</p>
                    @endif
                    @if($empresa['email'] ?? null)
                        <p><strong>Email:</strong> {{ $empresa['email'] }}</p>
                    @endif
                </div>
            </div>
            <div class="factura-box">
                <div class="factura-tipo">
                    {{ $factura->tipo_documento === 'factura' ? 'FACTURA' : 'NOTA DE VENTA' }}
                </div>
                <div class="factura-numero">N° {{ $factura->numero_factura }}</div>
                <div class="factura-fecha">
                    {{ $factura->fecha_emision?->format('d/m/Y') }} - {{ $factura->hora }}
                </div>
                <span class="estado-badge estado-{{ $factura->estado }}">
                    {{ strtoupper($factura->estado_label) }}
                </span>
            </div>
        </div>

        <!-- Información del cliente y venta -->
        <div class="info-section">
            <div class="info-box">
                <div class="info-title">Datos del Cliente</div>
                <div class="info-row">
                    <span class="info-label">CI/RUC:</span>
                    <span class="info-value">{{ $factura->cedula_cliente }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">{{ $factura->nombre_cliente }}</span>
                </div>
                @if($factura->direccion_cliente)
                    <div class="info-row">
                        <span class="info-label">Dirección:</span>
                        <span class="info-value">{{ $factura->direccion_cliente }}</span>
                    </div>
                @endif
                @if($factura->telefono_cliente)
                    <div class="info-row">
                        <span class="info-label">Teléfono:</span>
                        <span class="info-value">{{ $factura->telefono_cliente }}</span>
                    </div>
                @endif
                @if($factura->email_cliente)
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{{ $factura->email_cliente }}</span>
                    </div>
                @endif
            </div>
            <div class="info-box">
                <div class="info-title">Datos de Emisión</div>
                <div class="info-row">
                    <span class="info-label">Sucursal:</span>
                    <span class="info-value">{{ $factura->sucursal?->nombre ?? 'Principal' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Punto Emisión:</span>
                    <span class="info-value">{{ $factura->punto_emision ?? '001' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cajero:</span>
                    <span class="info-value">{{ $factura->usuario?->name ?? 'Sistema' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Forma Pago:</span>
                    <span class="info-value">{{ $factura->forma_pago_label }}</span>
                </div>
            </div>
        </div>

        <!-- Tabla de productos -->
        <div class="productos-section">
            <div class="productos-title">Detalle de Productos</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 8%;">#</th>
                        <th style="width: 12%;">Código</th>
                        <th style="width: 35%;">Descripción</th>
                        <th class="text-center" style="width: 10%;">Cant.</th>
                        <th class="text-right" style="width: 12%;">P. Unit.</th>
                        <th class="text-center" style="width: 8%;">IVA</th>
                        <th class="text-right" style="width: 15%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($factura->detalles as $index => $detalle)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td>
                                <span class="producto-codigo">
                                    {{ $detalle->producto?->codigo_principal ?? '-' }}
                                </span>
                            </td>
                            <td>{{ $detalle->producto?->nombre ?? 'Producto' }}</td>
                            <td class="text-center">{{ $detalle->cantidad }}</td>
                            <td class="text-right">${{ number_format($detalle->precio_unitario, 2) }}</td>
                            <td class="text-center">
                                {{ $detalle->iva_aplica ? $detalle->porcentaje_iva . '%' : '0%' }}
                            </td>
                            <td class="text-right">${{ number_format($detalle->total_detalle, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Totales -->
        <div class="totales-section">
            <div class="totales-box">
                <div class="total-row">
                    <span class="total-label">Subtotal (sin IVA):</span>
                    <span class="total-value">${{ number_format($factura->total_sin_impuestos, 2) }}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">IVA:</span>
                    <span class="total-value">${{ number_format($factura->total_iva, 2) }}</span>
                </div>
                @if($factura->descuento > 0)
                    <div class="total-row">
                        <span class="total-label">Descuento:</span>
                        <span class="total-value">-${{ number_format($factura->descuento, 2) }}</span>
                    </div>
                @endif
                <div class="total-row grand-total">
                    <span class="total-label">TOTAL A PAGAR:</span>
                    <span class="total-value">${{ number_format($factura->total, 2) }}</span>
                </div>
            </div>
        </div>

        <!-- Observaciones -->
        @if($factura->observaciones)
            <div class="additional-info">
                <div class="observaciones-box">
                    <strong>Observaciones:</strong>
                    <p style="margin-top: 5px;">{{ $factura->observaciones }}</p>
                </div>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p><strong>{{ $empresa['nombre'] }}</strong></p>
            <p>Documento generado el {{ now()->format('d/m/Y H:i:s') }}</p>
            <p>¡Gracias por su preferencia!</p>
        </div>
    </div>
</body>
</html>
