<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket #{{ $factura->numero_factura }}</title>
    <style>
        /* Reset y estilos base para impresora térmica 80mm */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: 80mm auto;
        }

        @media print {
            html, body {
                width: 80mm;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            @page {
                margin: 0;
            }
            
            .no-print {
                display: none !important;
            }
        }

        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 2mm 4mm;
            background: #fff;
            color: #000;
            text-align: center;
        }

        .ticket-container {
            width: 100%;
        }

        /* Separador */
        .separador {
            border: none;
            border-top: 1px dashed #000;
            margin: 3mm 0;
        }

        .separador-doble {
            border: none;
            border-top: 2px solid #000;
            margin: 3mm 0;
        }

        /* Header - Logo y datos empresa */
        .header {
            text-align: center;
            margin-bottom: 2mm;
        }

        .empresa-nombre {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2mm;
        }

        .empresa-info {
            font-size: 10px;
            line-height: 1.5;
        }

        .empresa-info p {
            margin: 1mm 0;
        }

        /* Tipo de documento destacado */
        .tipo-documento {
            text-align: center;
            margin: 3mm 0;
            padding: 2mm;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .tipo-factura {
            background: #000;
            color: #fff;
        }

        .tipo-nota-venta {
            border: 2px solid #000;
            background: #fff;
            color: #000;
        }

        /* Datos factura */
        .factura-info {
            text-align: center;
            margin: 2mm 0;
        }

        .factura-numero {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 1mm;
        }

        .factura-fecha {
            font-size: 10px;
        }

        /* Estado badge */
        .estado-badge {
            display: inline-block;
            padding: 1mm 3mm;
            font-size: 9px;
            font-weight: bold;
            margin-top: 2mm;
        }

        .estado-anulada {
            background: #000;
            color: #fff;
            text-decoration: line-through;
        }

        /* Datos cliente */
        .cliente-info {
            text-align: center;
            margin: 2mm 0;
            font-size: 10px;
        }

        .cliente-info p {
            margin: 1mm 0;
        }

        .cliente-label {
            font-weight: bold;
        }

        /* Tabla de productos */
        .productos {
            margin: 2mm 0;
            text-align: left;
        }

        .productos-header {
            display: table;
            width: 100%;
            font-weight: bold;
            font-size: 10px;
            padding: 1mm 0;
            border-bottom: 1px solid #000;
        }

        .productos-header span {
            display: table-cell;
        }

        .productos-header .col-desc {
            width: 60%;
            text-align: left;
        }

        .productos-header .col-total {
            width: 40%;
            text-align: right;
        }

        .producto-row {
            padding: 2mm 0;
            border-bottom: 1px dotted #999;
        }

        .producto-nombre {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 1mm;
        }

        .producto-detalle {
            display: table;
            width: 100%;
            font-size: 9px;
        }

        .producto-detalle span {
            display: table-cell;
        }

        .producto-cantidad {
            text-align: left;
        }

        .producto-total {
            text-align: right;
            font-weight: bold;
        }

        /* Totales */
        .totales {
            margin: 2mm 0;
            text-align: right;
        }

        .total-row {
            display: table;
            width: 100%;
            font-size: 10px;
            padding: 1mm 0;
        }

        .total-row span {
            display: table-cell;
        }

        .total-row .total-label {
            text-align: left;
            width: 50%;
        }

        .total-row .total-valor {
            text-align: right;
            width: 50%;
        }

        .total-row.grand-total {
            font-size: 14px;
            font-weight: bold;
            padding: 2mm 0;
            border-top: 2px solid #000;
            margin-top: 2mm;
        }

        /* Forma de pago */
        .pago-info {
            text-align: center;
            margin: 2mm 0;
            padding: 2mm 0;
            font-size: 11px;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 3mm;
            font-size: 9px;
        }

        .footer p {
            margin: 1mm 0;
        }

        .gracias {
            font-size: 12px;
            font-weight: bold;
            margin: 3mm 0;
            padding: 2mm;
            border: 1px solid #000;
        }

        .fecha-impresion {
            font-size: 8px;
            color: #666;
            margin-top: 2mm;
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <!-- Header - Datos de la empresa -->
        <div class="header">
            <div class="empresa-nombre">{{ $empresa['nombre'] }}</div>
            <div class="empresa-info">
                <p>RUC: {{ $empresa['ruc'] }}</p>
                <p>{{ $empresa['direccion'] }}</p>
                @if($empresa['telefono'])
                    <p>Tel: {{ $empresa['telefono'] }}</p>
                @endif
            </div>
        </div>

        <hr class="separador">

        <!-- Tipo de documento -->
        <div class="tipo-documento {{ $factura->tipo_documento === 'factura' ? 'tipo-factura' : 'tipo-nota-venta' }}">
            {{ $factura->tipo_documento === 'factura' ? 'FACTURA' : 'NOTA DE VENTA' }}
        </div>

        <!-- Información de la factura -->
        <div class="factura-info">
            <div class="factura-numero">N° {{ $factura->numero_factura }}</div>
            <div class="factura-fecha">
                Fecha: {{ $factura->fecha_emision?->format('d/m/Y') }} - {{ $factura->hora }}
            </div>
            @if($factura->estado === 'anulada')
                <span class="estado-badge estado-anulada">*** ANULADA ***</span>
            @endif
        </div>

        <hr class="separador">

        <!-- Datos del cliente -->
        <div class="cliente-info">
            <p><span class="cliente-label">Cliente:</span> {{ $factura->nombre_cliente }}</p>
            <p><span class="cliente-label">CI/RUC:</span> {{ $factura->cedula_cliente }}</p>
            @if($factura->direccion_cliente)
                <p>{{ Str::limit($factura->direccion_cliente, 40) }}</p>
            @endif
        </div>

        <hr class="separador">

        <!-- Productos -->
        <div class="productos">
            <div class="productos-header">
                <span class="col-desc">Descripción</span>
                <span class="col-total">Total</span>
            </div>

            @foreach($factura->detalles as $detalle)
                <div class="producto-row">
                    <div class="producto-nombre">
                        {{ Str::limit($detalle->producto?->nombre ?? 'Producto', 28) }}
                    </div>
                    <div class="producto-detalle">
                        <span class="producto-cantidad">
                            {{ $detalle->cantidad }} x ${{ number_format($detalle->precio_unitario, 2) }}
                        </span>
                        <span class="producto-total">
                            ${{ number_format($detalle->total_detalle, 2) }}
                        </span>
                    </div>
                </div>
            @endforeach
        </div>

        <!-- Totales -->
        <div class="totales">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-valor">${{ number_format($factura->total_sin_impuestos, 2) }}</span>
            </div>
            <div class="total-row">
                <span class="total-label">IVA ({{ config('app.iva', 15) }}%):</span>
                <span class="total-valor">${{ number_format($factura->total_iva, 2) }}</span>
            </div>
            @if($factura->descuento > 0)
                <div class="total-row">
                    <span class="total-label">Descuento:</span>
                    <span class="total-valor">-${{ number_format($factura->descuento, 2) }}</span>
                </div>
            @endif
            <div class="total-row grand-total">
                <span class="total-label">TOTAL:</span>
                <span class="total-valor">${{ number_format($factura->total, 2) }}</span>
            </div>
        </div>

        <hr class="separador">

        <!-- Forma de pago -->
        <div class="pago-info">
            <strong>Forma de Pago:</strong> {{ $factura->forma_pago_label }}
        </div>

        <hr class="separador">

        <!-- Footer -->
        <div class="footer">
            @if($factura->observaciones)
                <p><em>{{ $factura->observaciones }}</em></p>
            @endif
            <p>Atendido por: {{ $factura->usuario?->name ?? 'Sistema' }}</p>
            <div class="gracias">¡GRACIAS POR SU COMPRA!</div>
            <p class="fecha-impresion">Impreso: {{ now()->format('d/m/Y H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
