<?php
/* GreeNova SC - peso y medidas para calcular el envío.
   ===========================================================================
   PENDIENTE (Gabriel los manda): estos números son un ESTIMADO para que las
   paqueterías puedan cotizar mientras llegan los reales. Cámbialos aquí:
   uno por categoría y, si un producto pesa distinto, uno por producto.

   Cada renglón: [kilos, largo cm, ancho cm, alto cm] de UN paquete y de UNA
   caja. Este archivo no se abre por URL (.htaccess).
   =========================================================================== */

return [
    'categorias' => [
        'vasos-papel' => ['paq' => [0.45, 30, 10, 10], 'caja' => [9.0, 50, 42, 42]],
        'tapas-papel' => ['paq' => [0.30, 12, 10, 10], 'caja' => [3.5, 45, 35, 30]],
        'fajillas'    => ['paq' => [0.35, 20, 12, 8],  'caja' => [3.5, 40, 30, 25]],
        'removedores' => ['paq' => [0.40, 20, 10, 6],  'caja' => [8.0, 40, 30, 25]],
        'vasos-pet'   => ['paq' => [0.60, 35, 11, 11], 'caja' => [12.0, 55, 45, 45]],
        'tapas-pet'   => ['paq' => [0.35, 12, 11, 11], 'caja' => [4.0, 45, 35, 30]],
    ],
    /* Productos que no pesan lo de su categoría: 'id-del-producto' => [...] */
    'productos' => [],
    /* Si no hay dato: */
    'omision' => ['paq' => [0.5, 30, 20, 15], 'caja' => [8.0, 50, 40, 40]],
];
