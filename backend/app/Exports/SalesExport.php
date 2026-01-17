<?php

namespace App\Exports;

use App\Models\Factura;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Clase para exportar ventas a CSV/Excel
 * Implementación ligera sin dependencias externas
 */
class SalesExport
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    /**
     * Obtener la colección de facturas filtradas
     */
    protected function getFacturas()
    {
        return Factura::with(['cliente', 'sucursal', 'usuario'])
            ->filterByDate(
                $this->filters['fecha_inicio'] ?? null,
                $this->filters['fecha_fin'] ?? null
            )
            ->search($this->filters['search'] ?? null)
            ->filterByEstado($this->filters['estado'] ?? null)
            ->filterByFormaPago($this->filters['forma_pago'] ?? null)
            ->orderBy('fecha_emision', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Encabezados del archivo
     */
    protected function headings(): array
    {
        return [
            'N° Factura',
            'Clave de Acceso',
            'Fecha Emisión',
            'Hora',
            'CI/RUC Cliente',
            'Nombre Cliente',
            'Teléfono',
            'Email',
            'Subtotal',
            'IVA',
            'Descuento',
            'Total',
            'Forma de Pago',
            'Estado',
            'Sucursal',
            'Usuario',
            'Observaciones',
        ];
    }

    /**
     * Mapear cada fila de datos
     */
    protected function mapRow($factura): array
    {
        return [
            $factura->numero_factura,
            $factura->clave_acceso ?? '',
            $factura->fecha_emision?->format('d/m/Y') ?? '',
            $factura->hora ?? '',
            $factura->cedula_cliente ?? '',
            $factura->nombre_cliente ?? '',
            $factura->telefono_cliente ?? '-',
            $factura->email_cliente ?? '-',
            number_format($factura->total_sin_impuestos, 2, '.', ''),
            number_format($factura->total_iva, 2, '.', ''),
            number_format($factura->descuento, 2, '.', ''),
            number_format($factura->total, 2, '.', ''),
            $factura->forma_pago_label ?? $factura->forma_pago,
            $factura->estado_label ?? $factura->estado,
            $factura->sucursal?->nombre ?? '-',
            $factura->usuario?->name ?? '-',
            $factura->observaciones ?? '-',
        ];
    }

    /**
     * Exportar a CSV (descarga)
     */
    public function downloadCsv(string $filename = 'ventas.csv'): StreamedResponse
    {
        $facturas = $this->getFacturas();
        $headings = $this->headings();

        return new StreamedResponse(function () use ($facturas, $headings) {
            $handle = fopen('php://output', 'w');
            
            // BOM para UTF-8 (compatibilidad Excel)
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            
            // Encabezados
            fputcsv($handle, $headings, ';');
            
            // Datos
            foreach ($facturas as $factura) {
                fputcsv($handle, $this->mapRow($factura), ';');
            }
            
            // Totales
            fputcsv($handle, [], ';');
            fputcsv($handle, ['TOTALES', '', '', '', '', '', '', '',
                number_format($facturas->sum('total_sin_impuestos'), 2, '.', ''),
                number_format($facturas->sum('total_iva'), 2, '.', ''),
                number_format($facturas->sum('descuento'), 2, '.', ''),
                number_format($facturas->sum('total'), 2, '.', ''),
                '', '', '', '', 'Total: ' . $facturas->count() . ' facturas'
            ], ';');
            
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Exportar a Excel (XLSX) usando formato XML (Excel 2003 XML)
     * Compatible sin dependencias adicionales
     */
    public function downloadExcel(string $filename = 'ventas.xlsx'): StreamedResponse
    {
        $facturas = $this->getFacturas();
        $headings = $this->headings();

        return new StreamedResponse(function () use ($facturas, $headings) {
            $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            $xml .= '<?mso-application progid="Excel.Sheet"?>' . "\n";
            $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
                xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' . "\n";
            
            // Estilos
            $xml .= '<Styles>
                <Style ss:ID="header">
                    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
                    <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
                    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
                </Style>
                <Style ss:ID="currency">
                    <NumberFormat ss:Format="$#,##0.00"/>
                    <Alignment ss:Horizontal="Right"/>
                </Style>
                <Style ss:ID="total">
                    <Font ss:Bold="1"/>
                    <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
                </Style>
            </Styles>' . "\n";
            
            $xml .= '<Worksheet ss:Name="Reporte de Ventas">' . "\n";
            $xml .= '<Table>' . "\n";
            
            // Encabezados
            $xml .= '<Row>' . "\n";
            foreach ($headings as $header) {
                $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">' . htmlspecialchars($header) . '</Data></Cell>' . "\n";
            }
            $xml .= '</Row>' . "\n";
            
            // Datos
            foreach ($facturas as $factura) {
                $row = $this->mapRow($factura);
                $xml .= '<Row>' . "\n";
                foreach ($row as $i => $cell) {
                    // Columnas numéricas (índices 8-11: Subtotal, IVA, Descuento, Total)
                    if (in_array($i, [8, 9, 10, 11]) && is_numeric($cell)) {
                        $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $cell . '</Data></Cell>' . "\n";
                    } else {
                        $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars((string)$cell) . '</Data></Cell>' . "\n";
                    }
                }
                $xml .= '</Row>' . "\n";
            }
            
            // Fila de totales
            $xml .= '<Row ss:StyleID="total">' . "\n";
            $xml .= '<Cell><Data ss:Type="String">TOTALES</Data></Cell>' . "\n";
            for ($i = 0; $i < 7; $i++) {
                $xml .= '<Cell><Data ss:Type="String"></Data></Cell>' . "\n";
            }
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $facturas->sum('total_sin_impuestos') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $facturas->sum('total_iva') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $facturas->sum('descuento') . '</Data></Cell>' . "\n";
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $facturas->sum('total') . '</Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String"></Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String"></Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String"></Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String"></Data></Cell>' . "\n";
            $xml .= '<Cell><Data ss:Type="String">Total: ' . $facturas->count() . ' facturas</Data></Cell>' . "\n";
            $xml .= '</Row>' . "\n";
            
            $xml .= '</Table>' . "\n";
            $xml .= '</Worksheet>' . "\n";
            $xml .= '</Workbook>';
            
            echo $xml;
        }, 200, [
            'Content-Type' => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Obtener totales calculados
     */
    public function getTotals(): array
    {
        $facturas = $this->getFacturas();
        
        return [
            'count' => $facturas->count(),
            'total_sin_impuestos' => $facturas->sum('total_sin_impuestos'),
            'total_iva' => $facturas->sum('total_iva'),
            'total_general' => $facturas->sum('total'),
        ];
    }
}
