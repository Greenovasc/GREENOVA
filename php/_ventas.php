<?php
/* GreeNova SC - lo que pasa cuando un pedido queda pagado.
   ===========================================================================
   Lo llaman checkout.php (tarjeta, al volver del banco) y
   openpay-webhook.php (tarjeta o SPEI, cuando Openpay avisa). Solo una de
   las dos llamadas hace el trabajo: la que logra cambiar el estado a
   "pagado". Así no se generan dos guías ni se mandan dos correos.
   Este archivo no se abre por URL (.htaccess).
   =========================================================================== */

declare(strict_types=1);
require_once __DIR__ . '/_comun.php';
require_once __DIR__ . '/envios.php';

function venta_por_folio(string $folio): ?array {
    $st = bd()->prepare('SELECT * FROM ventas WHERE folio = ?');
    $st->execute([$folio]);
    $f = $st->fetch(PDO::FETCH_ASSOC);
    return $f ?: null;
}

function venta_por_cargo(string $id): ?array {
    $st = bd()->prepare('SELECT * FROM ventas WHERE openpay_id = ?');
    $st->execute([$id]);
    $f = $st->fetch(PDO::FETCH_ASSOC);
    return $f ?: null;
}

function marcar_pagada(array $venta): void {
    $st = bd()->prepare("UPDATE ventas SET estado = 'pagado', actualizado = ? WHERE folio = ? AND estado IN ('pendiente', 'confirmando', 'esperando')");
    $st->execute([ahora(), $venta['folio']]);
    if ($st->rowCount() !== 1) return;   // ya lo había hecho otra llamada
    $venta = venta_por_folio($venta['folio']);

    $guia = ['ok' => false, 'error' => 'La guía se genera a mano (GUIA_AUTOMATICA = 0).'];
    if (secreto('GUIA_AUTOMATICA', '1') !== '0') {
        try { $guia = crear_guia($venta); } catch (Throwable $e) { $guia = ['ok' => false, 'error' => $e->getMessage()]; }
    }
    if ($guia['ok']) {
        bd()->prepare("UPDATE ventas SET estado = 'enviado', guia = ?, rastreo = ?, etiqueta = ?, actualizado = ? WHERE folio = ?")
            ->execute([$guia['guia'], $guia['rastreo'], $guia['etiqueta'], ahora(), $venta['folio']]);
    } else {
        bd()->prepare('UPDATE ventas SET nota = ?, actualizado = ? WHERE folio = ?')
            ->execute([mb_substr((string) $guia['error'], 0, 500), ahora(), $venta['folio']]);
    }
    avisos_de_pago(venta_por_folio($venta['folio']), $guia);
}

function resumen_texto(array $v): string {
    $lineas = json_decode((string) $v['lineas'], true) ?: [];
    $d = json_decode((string) $v['direccion'], true) ?: [];
    $t = [];
    foreach ($lineas as $l) {
        $t[] = '- ' . $l['qty'] . ' ' . ($l['u'] === 'caja' ? ($l['qty'] === 1 ? 'caja' : 'cajas') : ($l['qty'] === 1 ? 'paquete' : 'paquetes')) .
               ' de ' . $l['nombre'] . ' (' . $l['v'] . ') = ' . dinero((float) $l['subtotal']);
    }
    $t[] = '';
    $t[] = 'Productos (IVA incluido): ' . dinero((float) $v['subtotal']);
    $t[] = 'Envío (' . $v['paqueteria'] . ' ' . $v['servicio'] . ', por ' . ($v['plataforma'] === 'envia' ? 'Envia.com' : 'Skydropx') . '): ' . dinero((float) $v['envio']);
    $t[] = 'TOTAL PAGADO: ' . dinero((float) $v['total']);
    $t[] = '';
    $t[] = 'Envío a: ' . $v['nombre'] . ', ' . ($d['calle'] ?? '') . ' ' . ($d['numero'] ?? '') .
           (($d['interior'] ?? '') !== '' ? ' int. ' . $d['interior'] : '') . ', ' . ($d['colonia'] ?? '') . ', ' .
           ($d['ciudad'] ?? '') . ', ' . (ESTADOS[$d['estado'] ?? ''] ?? '') . ', C.P. ' . ($d['cp'] ?? '');
    if (($d['referencias'] ?? '') !== '') $t[] = 'Referencias: ' . $d['referencias'];
    return implode("\n", $t);
}

function avisos_de_pago(array $v, array $guia): void {
    $resumen = resumen_texto($v);
    $para_ventas = "Entró el pago del pedido {$v['folio']} (" . ($v['metodo'] === 'spei' ? 'transferencia SPEI' : 'tarjeta') . ").\n\n" .
        "Cliente: {$v['nombre']} · {$v['correo']} · {$v['telefono']}\n\n" . $resumen . "\n\n" .
        ($guia['ok'] ? "GUÍA: {$guia['guia']}\nEtiqueta para imprimir: {$guia['etiqueta']}\n" :
                       "⚠ LA GUÍA NO SE GENERÓ SOLA. Hay que hacerla a mano en " . ($v['plataforma'] === 'envia' ? 'Envia.com' : 'Skydropx') . ".\nMotivo: {$guia['error']}\n") .
        "\nCargo en Openpay: {$v['openpay_id']}";
    correo(secreto('AVISOS_CORREO', 'ventas@greenovasc.com.mx'), 'Pedido pagado ' . $v['folio'], $para_ventas);

    $primer = explode(' ', $v['nombre'])[0];
    $para_cliente = "Hola, $primer:\n\nRecibimos tu pago. ¡Gracias por tu compra en GreeNova SC!\n\nNúmero de ticket: {$v['folio']} (lo necesitas para facturar)\n\n" . $resumen . "\n\n" .
        ($guia['ok'] ? "Tu número de guía es {$guia['guia']} ({$v['paqueteria']})." . ($guia['rastreo'] ? "\nRastréalo aquí: {$guia['rastreo']}" : '') :
                       "En cuanto salga tu pedido te mandamos el número de guía.") .
        "\n\nSi necesitas factura, entra a www.greenovasc.com.mx/facturacion.html.\n¿Dudas? Escríbenos a ventas@greenovasc.com.mx o al 55 2260 1113.\n\nGreeNova SC · Empaques responsables, negocios con propósito.";
    correo($v['correo'], 'Recibimos tu pago · Pedido ' . $v['folio'], $para_cliente);
}

/* Lo que puede ver el cliente de su pedido (con su folio y su clave). */
function venta_publica(array $v): array {
    return [
        'folio' => $v['folio'], 'estado' => $v['estado'], 'metodo' => $v['metodo'],
        'subtotal' => (float) $v['subtotal'], 'envio' => (float) $v['envio'], 'total' => (float) $v['total'],
        'paqueteria' => $v['paqueteria'], 'servicio' => $v['servicio'],
        'plataforma' => $v['plataforma'] === 'envia' ? 'Envia.com' : 'Skydropx',
        'guia' => $v['guia'], 'rastreo' => $v['rastreo'],
        'spei' => $v['estado'] === 'esperando' ? json_decode((string) $v['spei'], true) : null,
        /* Para el recibo impreso de pagar.html. */
        'fecha' => $v['actualizado'] ?: $v['fecha'], 'tarjeta' => $v['tarjeta'] ?? '',
        'lineas' => array_map(fn($l) => ['nombre' => $l['nombre'], 'v' => $l['v'], 'u' => $l['u'], 'qty' => $l['qty'], 'subtotal' => $l['subtotal']],
                              json_decode((string) $v['lineas'], true) ?: []),
    ];
}
