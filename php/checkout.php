<?php
/* GreeNova SC - la caja: cotizar el envío y cobrar (pagar.html).
   ===========================================================================
   ?accion=config    GET  qué está listo (Openpay, paqueterías) y la llave
                          PÚBLICA de Openpay para el formulario de tarjeta.
   ?accion=cotizar   POST carrito + CP de destino -> subtotal y opciones de
                          envío de Envia.com y Skydropx (firmadas: el precio
                          no se puede cambiar desde el navegador).
   ?accion=pagar     POST carrito, envío elegido, datos del cliente, dirección
                          y forma de pago -> cobra con Openpay.
   ?accion=estado    GET  folio + clave -> cómo va el pedido (al volver del
                          banco, o mientras se espera la transferencia).

   El precio de los productos lo pone siempre el servidor (productos.js), el
   del envío lo pone la paquetería, y el total es uno solo.
   =========================================================================== */

declare(strict_types=1);
require_once __DIR__ . '/_comun.php';
require_once __DIR__ . '/openpay.php';
require_once __DIR__ . '/envios.php';
require_once __DIR__ . '/_ventas.php';

const VIGENCIA_OPCION = 45 * 60;   // una opción de envío vale 45 minutos

$accion = (string) ($_GET['accion'] ?? '');
try {
    if ($accion === 'config') config();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $accion !== 'estado') responde(['error' => 'metodo'], 405);
    if ($accion === 'cotizar') cotizar();
    if ($accion === 'pagar') pagar();
    if ($accion === 'estado') estado();
    responde(['error' => 'accion'], 404);
} catch (InvalidArgumentException $e) {
    responde(['error' => $e->getMessage()], 400);
} catch (Throwable $e) {
    bitacora('checkout_falla', $e->getMessage() . ' @' . $e->getLine());
    responde(['error' => 'no_disponible'], 503);
}

function config(): void {
    $e = envios_listos();
    responde([
        'pagos' => openpay_listo(),
        'envios' => modo_demo() || (($e['envia'] || $e['skydropx']) && $e['origen']),
        'demo' => modo_demo(),
        'openpay' => modo_demo() ? null : ['id' => secreto('OPENPAY_ID'), 'llave' => secreto('OPENPAY_LLAVE_PUBLICA'), 'sandbox' => !openpay_produccion()],
        'estados' => ESTADOS,
    ]);
}

function destino_valido(array $d, bool $completo): array {
    $x = [
        'cp' => preg_replace('/\D/', '', (string) ($d['cp'] ?? '')),
        'estado' => strtoupper(texto($d['estado'] ?? '', 2)),
        'ciudad' => texto($d['ciudad'] ?? '', 80), 'colonia' => texto($d['colonia'] ?? '', 80),
        'calle' => texto($d['calle'] ?? '', 100), 'numero' => texto($d['numero'] ?? '', 20),
        'interior' => texto($d['interior'] ?? '', 20), 'referencias' => texto($d['referencias'] ?? '', 160),
    ];
    if (strlen($x['cp']) !== 5) throw new InvalidArgumentException('cp');
    if (!isset(ESTADOS[$x['estado']])) throw new InvalidArgumentException('estado');
    if ($completo) {
        foreach (['calle', 'numero', 'colonia', 'ciudad'] as $c) if ($x[$c] === '') throw new InvalidArgumentException($c);
    }
    return $x;
}

function cotizar(): void {
    if (!cupo('cotizar', 30)) responde(['error' => 'muchos_intentos'], 429);
    $d = cuerpo_json();
    [$lineas, $subtotal] = lineas_con_precio(is_array($d['carrito'] ?? null) ? $d['carrito'] : []);
    $destino = destino_valido(is_array($d['destino'] ?? null) ? $d['destino'] : [], false);
    $paq = paquete($lineas);
    $opciones = cotizar_envios($destino + ['nombre' => 'Cliente', 'correo' => 'ventas@greenovasc.com.mx', 'telefono' => '5500000000'], $paq, $subtotal);
    $h = huella($lineas, $destino['cp']);
    $vence = time() + VIGENCIA_OPCION;
    $salida = [];
    foreach (array_slice($opciones, 0, 12) as $o) {
        $dato = rtrim(strtr(base64_encode(json_encode($o + ['h' => $h, 'x' => $vence], JSON_UNESCAPED_UNICODE)), '+/', '-_'), '=');
        $salida[] = ['token' => $dato . '.' . firma($dato), 'plataforma' => $o['plataforma'] === 'envia' ? 'Envia.com' : 'Skydropx',
                     'paqueteria' => $o['paqueteria'], 'servicio' => $o['servicio'], 'dias' => $o['dias'], 'precio' => $o['precio']];
    }
    responde(['subtotal' => $subtotal, 'opciones' => $salida, 'peso' => $paq['peso']]);
}

function opcion_de_token(string $token, string $huella): array {
    $partes = explode('.', $token);
    if (count($partes) !== 2 || !hash_equals(firma($partes[0]), $partes[1])) throw new InvalidArgumentException('envio');
    $o = json_decode((string) base64_decode(strtr($partes[0], '-_', '+/')), true);
    if (!is_array($o) || ($o['x'] ?? 0) < time()) throw new InvalidArgumentException('envio_vencido');
    if (!hash_equals((string) ($o['h'] ?? ''), $huella)) throw new InvalidArgumentException('envio_cambio');
    return $o;
}

function pagar(): void {
    if (!openpay_listo()) responde(['error' => 'pagos_apagados'], 503);
    if (!cupo('pagar', 12)) responde(['error' => 'muchos_intentos'], 429);
    $d = cuerpo_json();
    if (($d['acepta'] ?? false) !== true) throw new InvalidArgumentException('acepta');
    [$lineas, $subtotal] = lineas_con_precio(is_array($d['carrito'] ?? null) ? $d['carrito'] : []);
    $destino = destino_valido(is_array($d['direccion'] ?? null) ? $d['direccion'] : [], true);
    $c = is_array($d['cliente'] ?? null) ? $d['cliente'] : [];
    $cliente = ['nombre' => texto($c['nombre'] ?? '', 100), 'correo' => strtolower(texto($c['correo'] ?? '', 120)),
                'telefono' => preg_replace('/\D/', '', (string) ($c['telefono'] ?? ''))];
    if (mb_strlen($cliente['nombre']) < 3 || !preg_match('/\S+\s+\S+/u', $cliente['nombre'])) throw new InvalidArgumentException('nombre');
    if (!filter_var($cliente['correo'], FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('correo');
    if (strlen($cliente['telefono']) === 12 && str_starts_with($cliente['telefono'], '52')) $cliente['telefono'] = substr($cliente['telefono'], 2);
    if (strlen($cliente['telefono']) !== 10) throw new InvalidArgumentException('telefono');
    $metodo = ($d['metodo'] ?? '') === 'spei' ? 'spei' : 'tarjeta';
    $o = opcion_de_token((string) ($d['envio'] ?? ''), huella($lineas, $destino['cp']));

    $envio = round((float) $o['precio'], 2);
    $total = round($subtotal + $envio, 2);
    $folio = 'GN-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    $clave = bin2hex(random_bytes(16));
    $cuenta = cuenta_id_de_token((string) ($d['sesion'] ?? ''));
    $venta = ['folio' => $folio, 'total' => $total] + $cliente;

    bd()->prepare('INSERT INTO ventas (fecha, folio, clave, estado, cuenta_id, nombre, correo, telefono, direccion, lineas, subtotal, envio, total,
                   plataforma, paqueteria, servicio, envio_ref, metodo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([ahora(), $folio, $clave, 'pendiente', $cuenta, $cliente['nombre'], $cliente['correo'], $cliente['telefono'],
                   json_encode($destino, JSON_UNESCAPED_UNICODE), json_encode($lineas, JSON_UNESCAPED_UNICODE),
                   $subtotal, $envio, $total, $o['plataforma'], $o['paqueteria'], $o['servicio'],
                   json_encode($o['ref'] ?? [], JSON_UNESCAPED_UNICODE), $metodo]);

    if ($metodo === 'spei') {
        $r = cobrar_spei($venta);
        if ($r['estado'] !== 'esperando') {
            bd()->prepare("UPDATE ventas SET estado = 'error', nota = ? WHERE folio = ?")->execute([$r['mensaje'], $folio]);
            responde(['error' => 'cobro', 'mensaje' => $r['mensaje']], 502);
        }
        bd()->prepare("UPDATE ventas SET estado = 'esperando', openpay_id = ?, spei = ?, actualizado = ? WHERE folio = ?")
            ->execute([$r['id'], json_encode($r['spei'], JSON_UNESCAPED_UNICODE), ahora(), $folio]);
        correo(secreto('AVISOS_CORREO', 'ventas@greenovasc.com.mx'), 'Pedido ' . $folio . ' esperando transferencia',
               "El cliente eligió pagar por SPEI. Cuando Openpay confirme el depósito llegará otro correo.\n\n" .
               "Cliente: {$cliente['nombre']} · {$cliente['correo']} · {$cliente['telefono']}\n\n" . resumen_texto(venta_por_folio($folio)));
        responde(['estado' => 'esperando', 'folio' => $folio, 'clave' => $clave, 'total' => $total, 'spei' => $r['spei']]);
    }

    $regreso = sitio() . '/pagar.html?folio=' . rawurlencode($folio) . '&clave=' . $clave;
    $r = cobrar_tarjeta($venta, texto($d['token_tarjeta'] ?? '', 120), texto($d['sesion_dispositivo'] ?? '', 255), $regreso);
    if ($r['estado'] === 'rechazado') {
        bd()->prepare("UPDATE ventas SET estado = 'rechazado', nota = ?, actualizado = ? WHERE folio = ?")->execute([$r['mensaje'], ahora(), $folio]);
        responde(['error' => 'rechazado', 'mensaje' => $r['mensaje']], 402);
    }
    /* Para el recibo: marca y últimos 4 dígitos (de Openpay o, si no los da,
       del navegador; nunca el número completo). */
    $tarjeta = $r['tarjeta'] ?? '';
    if ($tarjeta === '' && preg_match('/^(Visa|Mastercard|American Express|Tarjeta) •••• \d{4}$/u', (string) ($d['tarjeta'] ?? ''))) $tarjeta = $d['tarjeta'];
    bd()->prepare('UPDATE ventas SET openpay_id = ?, estado = ?, tarjeta = ?, actualizado = ? WHERE folio = ?')
        ->execute([$r['id'], $r['estado'] === 'confirmar' ? 'confirmando' : 'pendiente', $tarjeta, ahora(), $folio]);
    if ($r['estado'] === 'confirmar') responde(['estado' => 'confirmar', 'url' => $r['url'], 'folio' => $folio, 'clave' => $clave]);

    marcar_pagada(venta_por_folio($folio));
    responde(['estado' => 'pagado', 'folio' => $folio, 'clave' => $clave, 'pedido' => venta_publica(venta_por_folio($folio))]);
}

function estado(): void {
    if (!cupo('estado', 120)) responde(['error' => 'muchos_intentos'], 429);
    $v = venta_por_folio(texto($_GET['folio'] ?? '', 30));
    if (!$v || !hash_equals((string) $v['clave'], (string) ($_GET['clave'] ?? ''))) responde(['error' => 'no_existe'], 404);
    /* Volvió del banco (3D Secure) o sigue esperando: se le pregunta a Openpay. */
    if (in_array($v['estado'], ['confirmando', 'pendiente', 'esperando'], true) && $v['openpay_id']) {
        $s = consultar_cargo((string) $v['openpay_id']);
        if ($s === 'completed') { marcar_pagada($v); $v = venta_por_folio($v['folio']); }
        elseif (in_array($s, ['failed', 'cancelled'], true) && $v['estado'] !== 'esperando') {
            bd()->prepare("UPDATE ventas SET estado = 'rechazado', actualizado = ? WHERE folio = ?")->execute([ahora(), $v['folio']]);
            $v['estado'] = 'rechazado';
        }
    }
    responde(['pedido' => venta_publica($v)]);
}

function sitio(): string {
    $s = secreto('SITIO_URL');
    if ($s !== '') return rtrim($s, '/');
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    return ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'www.greenovasc.com.mx');
}
