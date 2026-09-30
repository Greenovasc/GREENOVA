<?php
/* GreeNova SC - cobro con Openpay (BBVA).
   ===========================================================================
   Dos formas de pago (Gabriel, 2026-09-29): tarjeta y transferencia SPEI.
   Efectivo en tiendas, no.

   - Tarjeta: los datos de la tarjeta NUNCA pasan por nuestro servidor. El
     navegador se los da directo a Openpay (openpay.js) y Openpay nos regresa
     un "token". Aquí solo se cobra con ese token, con 3D Secure: el banco
     puede pedirle al cliente que confirme la compra en su app o con un código.
   - SPEI: Openpay da una CLABE y una referencia para ese pedido. Cuando el
     cliente transfiere, Openpay avisa a openpay-webhook.php.

   Llaves: OPENPAY_ID, OPENPAY_LLAVE_PRIVADA (sk_...) y OPENPAY_LLAVE_PUBLICA
   (pk_...). Con OPENPAY_PRODUCCION distinto de "1" se usa el sandbox (pruebas).
   Este archivo no se abre por URL (.htaccess).
   =========================================================================== */

declare(strict_types=1);
require_once __DIR__ . '/_comun.php';

function openpay_listo(): bool {
    return modo_demo() || (secreto('OPENPAY_ID') !== '' && secreto('OPENPAY_LLAVE_PRIVADA') !== '' && secreto('OPENPAY_LLAVE_PUBLICA') !== '');
}

function openpay_produccion(): bool { return secreto('OPENPAY_PRODUCCION') === '1'; }

function openpay_url(string $ruta): string {
    $base = secreto('OPENPAY_URL', openpay_produccion() ? 'https://api.openpay.mx/v1' : 'https://sandbox-api.openpay.mx/v1');
    return rtrim($base, '/') . '/' . secreto('OPENPAY_ID') . $ruta;
}

function openpay(string $metodo, string $ruta, ?array $datos = null): array {
    $r = http_json($metodo, openpay_url($ruta), $datos,
                   ['Authorization: Basic ' . base64_encode(secreto('OPENPAY_LLAVE_PRIVADA') . ':')]);
    if ($r['codigo'] >= 400 || !$r['json']) bitacora('openpay_error', ['ruta' => $ruta, 'codigo' => $r['codigo'], 'resp' => $r['crudo'], 'curl' => $r['error']]);
    return $r;
}

function cliente_openpay(array $v): array {
    $partes = preg_split('/\s+/', trim($v['nombre']), 2);
    return [
        'name' => mb_substr($partes[0] ?? $v['nombre'], 0, 60),
        'last_name' => mb_substr($partes[1] ?? '', 0, 60),
        'phone_number' => $v['telefono'],
        'email' => $v['correo'],
    ];
}

/* Cobro con tarjeta. Devuelve ['estado' => 'pagado'|'confirmar'|'rechazado', ...]. */
function cobrar_tarjeta(array $venta, string $token, string $sesion_dispositivo, string $regreso): array {
    if (modo_demo()) {
        if (str_contains($token, 'rechazo')) return ['estado' => 'rechazado', 'mensaje' => 'La tarjeta fue rechazada por el banco.'];
        return ['estado' => 'pagado', 'id' => 'demo-' . bin2hex(random_bytes(6))];
    }
    $r = openpay('POST', '/charges', [
        'method' => 'card',
        'source_id' => $token,
        'amount' => round($venta['total'], 2),
        'currency' => 'MXN',
        'description' => 'Pedido ' . $venta['folio'] . ' - GreeNova SC',
        'order_id' => $venta['folio'],
        'device_session_id' => $sesion_dispositivo,
        'customer' => cliente_openpay($venta),
        'use_3d_secure' => true,
        'redirect_url' => $regreso,
    ]);
    $j = $r['json'] ?? [];
    if ($r['codigo'] >= 400 || empty($j['id'])) {
        return ['estado' => 'rechazado', 'mensaje' => mensaje_openpay((int) ($j['error_code'] ?? 0))];
    }
    $tarjeta = tarjeta_de($j);
    if (($j['status'] ?? '') === 'completed') return ['estado' => 'pagado', 'id' => $j['id'], 'tarjeta' => $tarjeta];
    $url = $j['payment_method']['url'] ?? '';
    if ($url !== '') return ['estado' => 'confirmar', 'id' => $j['id'], 'url' => $url, 'tarjeta' => $tarjeta];
    return ['estado' => 'rechazado', 'mensaje' => 'No se pudo completar el cobro. Intenta de nuevo o usa otra tarjeta.'];
}

/* Transferencia SPEI: CLABE y referencia para este pedido; vence en 3 días. */
function cobrar_spei(array $venta): array {
    if (modo_demo()) {
        return ['estado' => 'esperando', 'id' => 'demo-' . bin2hex(random_bytes(6)), 'spei' => [
            'banco' => 'BBVA', 'clabe' => '000180000000000000', 'referencia' => '1234567',
            'beneficiario' => 'GreeNova SC', 'vence' => date('Y-m-d', time() + 3 * 86400)]];
    }
    $vence = date('Y-m-d\TH:i:s', time() + 3 * 86400);   // hora de México
    $r = openpay('POST', '/charges', [
        'method' => 'bank_account',
        'amount' => round($venta['total'], 2),
        'description' => 'Pedido ' . $venta['folio'] . ' - GreeNova SC',
        'order_id' => $venta['folio'],
        'customer' => cliente_openpay($venta),
        'due_date' => $vence,
    ]);
    $j = $r['json'] ?? [];
    $pm = $j['payment_method'] ?? [];
    if ($r['codigo'] >= 400 || empty($j['id']) || empty($pm['clabe'])) {
        return ['estado' => 'error', 'mensaje' => 'No pudimos generar los datos de la transferencia. Intenta de nuevo en un momento.'];
    }
    return ['estado' => 'esperando', 'id' => $j['id'], 'spei' => [
        'banco' => $pm['bank'] ?? 'BBVA', 'clabe' => $pm['clabe'], 'referencia' => $pm['name'] ?? '',
        'beneficiario' => secreto('OPENPAY_BENEFICIARIO', 'GreeNova SC'), 'vence' => substr($vence, 0, 10)]];
}

/* El estado real de un cargo, preguntándole a Openpay (no se confía en lo que
   diga el navegador ni el aviso). */
function consultar_cargo(string $id): string {
    if (modo_demo()) return str_starts_with($id, 'demo-') ? 'completed' : 'failed';
    $r = openpay('GET', '/charges/' . rawurlencode($id));
    return (string) (($r['json'] ?? [])['status'] ?? '');
}

/* "Visa •••• 4242" para el recibo: solo la marca y los últimos 4 dígitos. */
function tarjeta_de(array $cargo): string {
    $c = $cargo['card'] ?? [];
    $num = preg_replace('/\D/', '', (string) ($c['card_number'] ?? ''));
    if (strlen($num) < 4) return '';
    $marcas = ['visa' => 'Visa', 'mastercard' => 'Mastercard', 'american_express' => 'American Express', 'carnet' => 'Carnet'];
    return ($marcas[strtolower((string) ($c['brand'] ?? ''))] ?? 'Tarjeta') . ' •••• ' . substr($num, -4);
}

/* Los errores más comunes de Openpay, en palabras del cliente. */
function mensaje_openpay(int $codigo): string {
    $m = [
        3001 => 'La tarjeta fue rechazada. Llama a tu banco o usa otra tarjeta.',
        3002 => 'La tarjeta está vencida.',
        3003 => 'La tarjeta no tiene fondos suficientes.',
        3004 => 'La tarjeta fue rechazada. Usa otra tarjeta.',
        3005 => 'La tarjeta fue rechazada por seguridad. Llama a tu banco o usa otra tarjeta.',
        3006 => 'Esta tarjeta no acepta este tipo de compra.',
        3008 => 'La tarjeta no acepta compras en línea.',
        3009 => 'La tarjeta fue reportada como perdida.',
        3010 => 'La tarjeta tiene restricciones del banco.',
        3011 => 'El banco pidió retener la tarjeta. Llama a tu banco.',
        3012 => 'Tu banco pide autorizar esta compra. Llámalo e intenta de nuevo.',
        2004 => 'El número de tarjeta no es válido.',
        2005 => 'La fecha de vencimiento ya pasó.',
        2006 => 'Falta el código de seguridad (CVV).',
        1006 => 'Este pedido ya se había cobrado. Revisa tu correo.',
    ];
    return $m[$codigo] ?? 'No se pudo cobrar con esta tarjeta. Revisa los datos o usa otra tarjeta.';
}
