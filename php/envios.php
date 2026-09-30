<?php
/* GreeNova SC - envíos con Envia.com y Skydropx.
   ===========================================================================
   El cliente paga el envío (Gabriel, 2026-09-29). Al pagar ve las opciones de
   las DOS plataformas juntas, ordenadas de la más barata a la más cara, y
   elige la que quiera. Ese precio se suma a sus productos y se cobra todo en
   un solo pago con Openpay.

   En cuanto Openpay confirma el pago, aquí se genera la guía en la plataforma
   que eligió. La guía se paga con el SALDO de GreeNova en esa plataforma
   (Envia.com o Skydropx): hay que tener saldo cargado en las dos. Si la guía
   no se puede generar (sin saldo, dirección incompleta…), el pedido queda
   pagado y a ventas le llega un correo para generarla a mano.

   Llaves:
     Envia.com  ENVIA_TOKEN (Bearer). ENVIA_PRODUCCION = "1" para la real;
                si no, el sandbox (api-test). ENVIA_PAQUETERIAS: con cuáles
                cotizar, separadas por coma.
     Skydropx   SKYDROPX_CLIENT_ID y SKYDROPX_CLIENT_SECRET (API de Skydropx
                PRO). SKYDROPX_URL si hay que usar el sandbox.
   Origen (de dónde salen los paquetes): ORIGEN_CP, ORIGEN_NOMBRE,
   ORIGEN_EMPRESA, ORIGEN_TELEFONO, ORIGEN_CORREO, ORIGEN_CALLE,
   ORIGEN_NUMERO, ORIGEN_COLONIA, ORIGEN_CIUDAD, ORIGEN_ESTADO (clave de 2
   letras, como en la lista ESTADOS de abajo).

   OJO: las respuestas de las dos APIs se confirman con las llaves de prueba;
   todo lo que respondan queda en greenova-cobro.log (fuera de public_html).
   =========================================================================== */

declare(strict_types=1);
require_once __DIR__ . '/_comun.php';

/* Estados: clave de 2 letras (la que pide Envia.com) y nombre (Skydropx). */
const ESTADOS = [
    'AG' => 'Aguascalientes', 'BC' => 'Baja California', 'BS' => 'Baja California Sur', 'CM' => 'Campeche',
    'CS' => 'Chiapas', 'CH' => 'Chihuahua', 'CX' => 'Ciudad de México', 'CO' => 'Coahuila', 'CL' => 'Colima',
    'DG' => 'Durango', 'EM' => 'Estado de México', 'GT' => 'Guanajuato', 'GR' => 'Guerrero', 'HG' => 'Hidalgo',
    'JA' => 'Jalisco', 'MI' => 'Michoacán', 'MO' => 'Morelos', 'NA' => 'Nayarit', 'NL' => 'Nuevo León',
    'OA' => 'Oaxaca', 'PU' => 'Puebla', 'QT' => 'Querétaro', 'QR' => 'Quintana Roo', 'SL' => 'San Luis Potosí',
    'SI' => 'Sinaloa', 'SO' => 'Sonora', 'TB' => 'Tabasco', 'TM' => 'Tamaulipas', 'TL' => 'Tlaxcala',
    'VE' => 'Veracruz', 'YU' => 'Yucatán', 'ZA' => 'Zacatecas',
];

function envios_listos(): array {
    return ['envia' => secreto('ENVIA_TOKEN') !== '',
            'skydropx' => secreto('SKYDROPX_CLIENT_ID') !== '' && secreto('SKYDROPX_CLIENT_SECRET') !== '',
            'origen' => secreto('ORIGEN_CP') !== ''];
}

/* ---------------------------------------------------------------- el paquete
   Suma el peso y el volumen de lo que va en el carrito (medidas.php) y lo
   manda como una caja: la paquetería cobra por el mayor entre peso real y
   peso volumétrico. */
function paquete(array $lineas): array {
    $m = require __DIR__ . '/medidas.php';
    $kg = 0.0; $vol = 0.0; $mayor = 0;
    foreach ($lineas as $l) {
        $d = $m['productos'][$l['id']][$l['u']] ?? $m['categorias'][$l['cat']][$l['u']] ?? $m['omision'][$l['u']];
        $kg += $d[0] * $l['qty'];
        $vol += $d[1] * $d[2] * $d[3] * $l['qty'];
        $mayor = max($mayor, $d[1]);
    }
    $lado = (int) ceil(pow($vol * 1.05, 1 / 3));
    $largo = max($lado, (int) $mayor, 10);
    $resto = (int) ceil(sqrt(($vol * 1.05) / $largo));
    return ['peso' => round(max($kg, 0.1), 2), 'largo' => $largo, 'ancho' => max($resto, 10), 'alto' => max($resto, 10)];
}

function origen(): array {
    return [
        'nombre' => secreto('ORIGEN_NOMBRE', 'GreeNova SC'), 'empresa' => secreto('ORIGEN_EMPRESA', 'GreeNova SC'),
        'telefono' => secreto('ORIGEN_TELEFONO', '5522601113'), 'correo' => secreto('ORIGEN_CORREO', 'ventas@greenovasc.com.mx'),
        'calle' => secreto('ORIGEN_CALLE'), 'numero' => secreto('ORIGEN_NUMERO'), 'colonia' => secreto('ORIGEN_COLONIA'),
        'ciudad' => secreto('ORIGEN_CIUDAD'), 'estado' => secreto('ORIGEN_ESTADO', 'CX'), 'cp' => secreto('ORIGEN_CP'),
        'referencias' => '',
    ];
}

/* ---------------------------------------------------------------- cotizar */
function cotizar_envios(array $destino, array $paq, float $valor): array {
    if (modo_demo()) return opciones_demo($paq);
    $listos = envios_listos();
    $out = [];
    if ($listos['envia']) $out = array_merge($out, envia_cotizar($destino, $paq, $valor));
    if ($listos['skydropx']) $out = array_merge($out, skydropx_cotizar($destino, $paq));
    usort($out, fn($a, $b) => $a['precio'] <=> $b['precio']);
    return $out;
}

function opciones_demo(array $paq): array {
    $f = max(1, $paq['peso'] / 5);
    return [
        ['plataforma' => 'skydropx', 'paqueteria' => 'Paquetexpress', 'servicio' => 'Terrestre', 'dias' => '2 a 4 días', 'precio' => round(149 * $f, 2), 'ref' => ['rate_id' => 'demo-1']],
        ['plataforma' => 'envia', 'paqueteria' => 'Estafeta', 'servicio' => 'Terrestre', 'dias' => '3 a 5 días', 'precio' => round(168 * $f, 2), 'ref' => ['carrier' => 'estafeta', 'service' => 'ground']],
        ['plataforma' => 'envia', 'paqueteria' => 'FedEx', 'servicio' => 'Día siguiente', 'dias' => '1 a 2 días', 'precio' => round(265 * $f, 2), 'ref' => ['carrier' => 'fedex', 'service' => 'express']],
        ['plataforma' => 'skydropx', 'paqueteria' => 'DHL', 'servicio' => 'Express', 'dias' => '1 a 2 días', 'precio' => round(280 * $f, 2), 'ref' => ['rate_id' => 'demo-2']],
    ];
}

/* ---- Envia.com: una consulta por paquetería, todas al mismo tiempo. */
function envia_base(): string {
    return rtrim(secreto('ENVIA_URL', secreto('ENVIA_PRODUCCION') === '1' ? 'https://api.envia.com' : 'https://api-test.envia.com'), '/');
}

function envia_direccion(array $d): array {
    return ['name' => $d['nombre'], 'company' => $d['empresa'] ?? '', 'email' => $d['correo'], 'phone' => $d['telefono'],
            'street' => $d['calle'], 'number' => $d['numero'], 'district' => $d['colonia'], 'city' => $d['ciudad'],
            'state' => $d['estado'], 'country' => 'MX', 'postalCode' => $d['cp'],
            'reference' => trim(($d['interior'] ?? '') !== '' ? 'Int. ' . $d['interior'] . '. ' . ($d['referencias'] ?? '') : ($d['referencias'] ?? ''))];
}

function envia_paquetes(array $paq, float $valor): array {
    return [['content' => 'Empaque desechable', 'amount' => 1, 'type' => 'box', 'weight' => $paq['peso'],
             'insurance' => 0, 'declaredValue' => round($valor, 2), 'weightUnit' => 'KG', 'lengthUnit' => 'CM',
             'dimensions' => ['length' => $paq['largo'], 'width' => $paq['ancho'], 'height' => $paq['alto']]]];
}

function envia_cotizar(array $destino, array $paq, float $valor): array {
    $paqueterias = array_filter(array_map('trim', explode(',', secreto('ENVIA_PAQUETERIAS', 'estafeta,fedex,dhl,redpack,paquetexpress'))));
    $mh = curl_multi_init(); $hs = [];
    foreach ($paqueterias as $c) {
        $cuerpo = ['origin' => envia_direccion(origen()), 'destination' => envia_direccion($destino),
                   'packages' => envia_paquetes($paq, $valor), 'shipment' => ['carrier' => $c, 'type' => 1]];
        $ch = curl_init(envia_base() . '/ship/rate/');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . secreto('ENVIA_TOKEN')],
            CURLOPT_POSTFIELDS => json_encode($cuerpo, JSON_UNESCAPED_UNICODE)]);
        curl_multi_add_handle($mh, $ch); $hs[$c] = $ch;
    }
    do { $st = curl_multi_exec($mh, $activos); if ($activos) curl_multi_select($mh, 1.0); } while ($activos && $st === CURLM_OK);
    $out = [];
    foreach ($hs as $c => $ch) {
        $j = json_decode((string) curl_multi_getcontent($ch), true);
        curl_multi_remove_handle($mh, $ch);
        if (!is_array($j) || empty($j['data']) || !is_array($j['data'])) { bitacora('envia_cotizar', ['carrier' => $c, 'resp' => $j]); continue; }
        foreach ($j['data'] as $r) {
            $precio = (float) ($r['totalPrice'] ?? 0);
            if ($precio <= 0) continue;
            $out[] = ['plataforma' => 'envia', 'paqueteria' => nombre_paqueteria((string) ($r['carrierDescription'] ?? $r['carrier'] ?? $c)),
                      'servicio' => (string) ($r['serviceDescription'] ?? $r['service'] ?? ''),
                      'dias' => (string) ($r['deliveryEstimate'] ?? ''), 'precio' => round($precio, 2),
                      'ref' => ['carrier' => (string) ($r['carrier'] ?? $c), 'service' => (string) ($r['service'] ?? '')]];
        }
    }
    curl_multi_close($mh);
    return $out;
}

/* ---- Skydropx (API PRO): token OAuth y cotización. */
function skydropx_base(): string { return rtrim(secreto('SKYDROPX_URL', 'https://pro.skydropx.com/api/v1'), '/'); }

function skydropx_token(): string {
    $cache = sys_get_temp_dir() . '/greenova-skydropx-' . md5(secreto('SKYDROPX_CLIENT_ID')) . '.json';
    $c = is_readable($cache) ? json_decode((string) file_get_contents($cache), true) : null;
    if (is_array($c) && ($c['vence'] ?? 0) > time() + 60) return (string) $c['token'];
    $r = http_json('POST', skydropx_base() . '/oauth/token', [
        'grant_type' => 'client_credentials', 'client_id' => secreto('SKYDROPX_CLIENT_ID'),
        'client_secret' => secreto('SKYDROPX_CLIENT_SECRET'), 'scope' => 'default orders.create']);
    $t = (string) (($r['json'] ?? [])['access_token'] ?? '');
    if ($t === '') { bitacora('skydropx_token', $r['crudo']); return ''; }
    @file_put_contents($cache, json_encode(['token' => $t, 'vence' => time() + (int) (($r['json'] ?? [])['expires_in'] ?? 3600)]));
    @chmod($cache, 0600);
    return $t;
}

function skydropx_zona(array $d): array {
    return ['country_code' => 'mx', 'postal_code' => $d['cp'], 'area_level1' => ESTADOS[$d['estado']] ?? $d['estado'],
            'area_level2' => $d['ciudad'], 'area_level3' => $d['colonia']];
}

function skydropx_cotizar(array $destino, array $paq): array {
    $t = skydropx_token();
    if ($t === '') return [];
    $h = ['Authorization: Bearer ' . $t];
    $r = http_json('POST', skydropx_base() . '/quotations', ['quotation' => [
        'address_from' => skydropx_zona(origen()), 'address_to' => skydropx_zona($destino),
        'parcel' => ['length' => $paq['largo'], 'width' => $paq['ancho'], 'height' => $paq['alto'], 'weight' => $paq['peso']]]], $h);
    $q = $r['json'] ?? [];
    /* La cotización se arma en segundos: se pregunta hasta que termine. */
    for ($i = 0; $i < 8 && !empty($q['id']) && empty($q['is_completed']); $i++) {
        usleep(700000);
        $q = http_json('GET', skydropx_base() . '/quotations/' . rawurlencode((string) $q['id']), null, $h)['json'] ?? $q;
    }
    if (empty($q['rates']) || !is_array($q['rates'])) { bitacora('skydropx_cotizar', $r['crudo']); return []; }
    $out = [];
    foreach ($q['rates'] as $x) {
        $precio = (float) ($x['total'] ?? $x['amount'] ?? 0);
        if ($precio <= 0 || (isset($x['success']) && !$x['success'])) continue;
        $out[] = ['plataforma' => 'skydropx', 'paqueteria' => nombre_paqueteria((string) ($x['provider_display_name'] ?? $x['provider_name'] ?? '')),
                  'servicio' => (string) ($x['provider_service_name'] ?? ''),
                  'dias' => isset($x['days']) ? $x['days'] . ((int) $x['days'] === 1 ? ' día' : ' días') : '', 'precio' => round($precio, 2),
                  'ref' => ['rate_id' => (string) ($x['id'] ?? ''), 'quotation_id' => (string) $q['id']]];
    }
    return $out;
}

function nombre_paqueteria(string $c): string {
    $m = ['fedex' => 'FedEx', 'dhl' => 'DHL', 'estafeta' => 'Estafeta', 'redpack' => 'Redpack', 'ups' => 'UPS',
          'paquetexpress' => 'Paquetexpress', '99minutos' => '99 Minutos', 'sendex' => 'Sendex', 'ampm' => 'AMPM',
          'jtexpress' => 'J&T Express', 'carssa' => 'Carssa', 'noventa9minutos' => '99 Minutos'];
    $k = strtolower(preg_replace('/[^a-z0-9]/i', '', $c));
    return $m[$k] ?? ($c !== '' ? ucwords($c) : 'Paquetería');
}

/* ---------------------------------------------------------------- la guía
   Se genera al confirmarse el pago. Devuelve guía, liga de rastreo y la
   etiqueta (PDF) o un error para avisar a ventas. */
function crear_guia(array $venta): array {
    $ref = json_decode((string) $venta['envio_ref'], true) ?: [];
    $destino = json_decode((string) $venta['direccion'], true) ?: [];
    $destino += ['nombre' => $venta['nombre'], 'correo' => $venta['correo'], 'telefono' => $venta['telefono']];
    $lineas = json_decode((string) $venta['lineas'], true) ?: [];
    if (modo_demo()) return ['ok' => true, 'guia' => 'DEMO' . random_int(100000, 999999), 'rastreo' => '', 'etiqueta' => ''];
    if (!envios_listos()['origen']) return ['ok' => false, 'error' => 'Falta la dirección de origen (ORIGEN_*).'];
    if ($venta['plataforma'] === 'envia') {
        $r = http_json('POST', envia_base() . '/ship/generate/', [
            'origin' => envia_direccion(origen()), 'destination' => envia_direccion($destino),
            'packages' => envia_paquetes(paquete($lineas), (float) $venta['subtotal']),
            'shipment' => ['carrier' => $ref['carrier'] ?? '', 'service' => $ref['service'] ?? '', 'type' => 1],
            'settings' => ['printFormat' => 'PDF', 'printSize' => 'STOCK_4X6', 'currency' => 'MXN'],
        ], ['Authorization: Bearer ' . secreto('ENVIA_TOKEN')], 40);
        $d = ($r['json']['data'][0] ?? null);
        if (!is_array($d) || empty($d['trackingNumber'])) { bitacora('envia_guia', $r['crudo']); return ['ok' => false, 'error' => 'Envia.com no generó la guía: ' . mb_substr($r['crudo'], 0, 300)]; }
        return ['ok' => true, 'guia' => (string) $d['trackingNumber'], 'rastreo' => (string) ($d['trackUrl'] ?? ''), 'etiqueta' => (string) ($d['label'] ?? '')];
    }
    if ($venta['plataforma'] === 'skydropx') {
        $t = skydropx_token();
        $h = ['Authorization: Bearer ' . $t];
        $dir = function (array $a): array {
            return ['street1' => trim($a['calle'] . ' ' . $a['numero'] . (($a['interior'] ?? '') !== '' ? ' int. ' . $a['interior'] : '')),
                    'name' => $a['nombre'], 'company' => $a['empresa'] ?? $a['nombre'], 'phone' => $a['telefono'],
                    'email' => $a['correo'], 'reference' => $a['referencias'] ?? ''] + skydropx_zona($a);
        };
        $r = http_json('POST', skydropx_base() . '/shipments', ['shipment' => [
            'rate_id' => $ref['rate_id'] ?? '', 'address_from' => $dir(origen()), 'address_to' => $dir($destino),
            'packages' => [['package_number' => '1', 'package_protected' => false,
                            'declared_value' => round((float) $venta['subtotal'], 2),
                            'consignment_note' => secreto('SAT_CLAVE_PRODUCTO'),
                            'package_type' => secreto('SAT_EMBALAJE', '4G')]]]], $h, 40);
        $s = $r['json']['data'] ?? $r['json'] ?? [];
        $id = (string) ($s['id'] ?? '');
        if ($id === '') { bitacora('skydropx_guia', $r['crudo']); return ['ok' => false, 'error' => 'Skydropx no generó la guía: ' . mb_substr($r['crudo'], 0, 300)]; }
        /* La etiqueta tarda unos segundos en quedar lista. */
        for ($i = 0; $i < 10; $i++) {
            usleep(1000000);
            $g = http_json('GET', skydropx_base() . '/shipments/' . rawurlencode($id), null, $h)['json'] ?? [];
            $pk = $g['included'][0]['attributes'] ?? $g['data']['attributes']['packages'][0] ?? [];
            if (!empty($pk['tracking_number'])) {
                return ['ok' => true, 'guia' => (string) $pk['tracking_number'], 'rastreo' => (string) ($pk['tracking_url_provider'] ?? ''),
                        'etiqueta' => (string) ($pk['label_url'] ?? '')];
            }
        }
        return ['ok' => false, 'error' => 'Skydropx recibió el envío ' . $id . ' pero la guía sigue en proceso. Revísala en Skydropx.'];
    }
    return ['ok' => false, 'error' => 'Plataforma de envío desconocida.'];
}
