<?php
/* GreeNova SC - aviso de Openpay (webhook).
   ===========================================================================
   Openpay llama a esta dirección cuando cambia un cobro: sobre todo cuando
   el cliente ya hizo su transferencia SPEI (o se venció) y cuando una tarjeta
   con 3D Secure termina de cobrarse.

   Se da de alta en el panel de Openpay › Configuración › Webhooks con:
     https://www.greenovasc.com.mx/php/openpay-webhook.php
   Al darlo de alta, Openpay manda un código de verificación: llega por correo
   a ventas (AVISOS_CORREO) para copiarlo en ese mismo panel.

   Seguridad: nunca se confía en lo que dice el aviso. Con el id del cobro se
   le pregunta a Openpay su estado real antes de marcar nada como pagado. Si
   defines OPENPAY_WEBHOOK_USUARIO y OPENPAY_WEBHOOK_CLAVE (y los mismos en el
   panel de Openpay), además se exige ese usuario y contraseña.
   =========================================================================== */

declare(strict_types=1);
require_once __DIR__ . '/_comun.php';
require_once __DIR__ . '/openpay.php';
require_once __DIR__ . '/_ventas.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$usuario = secreto('OPENPAY_WEBHOOK_USUARIO');
if ($usuario !== '') {
    $u = (string) ($_SERVER['PHP_AUTH_USER'] ?? '');
    $p = (string) ($_SERVER['PHP_AUTH_PW'] ?? '');
    if (!hash_equals($usuario, $u) || !hash_equals(secreto('OPENPAY_WEBHOOK_CLAVE'), $p)) { http_response_code(401); exit; }
}

$aviso = cuerpo_json(100000);
$tipo = (string) ($aviso['type'] ?? '');
bitacora('webhook', ['tipo' => $tipo, 'id' => $aviso['transaction']['id'] ?? null, 'orden' => $aviso['transaction']['order_id'] ?? null]);

try {
    if ($tipo === 'verification') {
        correo(secreto('AVISOS_CORREO', 'ventas@greenovasc.com.mx'), 'Código para verificar el webhook de Openpay',
               "Copia este código en el panel de Openpay › Webhooks para terminar de darlo de alta:\n\n" .
               texto($aviso['verification_code'] ?? '', 40));
        responde(['ok' => true]);
    }

    $t = is_array($aviso['transaction'] ?? null) ? $aviso['transaction'] : [];
    $id = texto($t['id'] ?? '', 60);
    if ($id === '') responde(['ok' => true]);
    $venta = venta_por_cargo($id) ?? venta_por_folio(texto($t['order_id'] ?? '', 30));
    if (!$venta || $venta['openpay_id'] !== $id) responde(['ok' => true]);   // no es nuestro

    $real = consultar_cargo($id);
    if ($real === 'completed') {
        marcar_pagada($venta);
    } elseif (in_array($real, ['failed', 'cancelled', 'expired'], true) && in_array($venta['estado'], ['esperando', 'confirmando', 'pendiente'], true)) {
        bd()->prepare('UPDATE ventas SET estado = ?, actualizado = ? WHERE folio = ?')
            ->execute([$venta['metodo'] === 'spei' ? 'vencido' : 'rechazado', ahora(), $venta['folio']]);
    }
    responde(['ok' => true]);
} catch (Throwable $e) {
    bitacora('webhook_falla', $e->getMessage());
    /* 500: Openpay vuelve a intentar más tarde. */
    responde(['ok' => false], 500);
}
