<?php
/* GreeNova SC - piezas comunes del cobro en línea (Hostinger, PHP).
   ===========================================================================
   Lo usan checkout.php (cotizar el envío y cobrar) y openpay-webhook.php (el
   aviso de Openpay cuando entra un pago). Este archivo no se abre por URL: el
   .htaccess de esta carpeta lo bloquea.

   DÓNDE VAN LAS LLAVES (se usa la primera que exista)
   1. Variables de entorno, si tu plan de Hostinger te deja definirlas.
   2. Un archivo FUERA de public_html (recomendado):

        /home/uXXXXXXX/greenova-secretos.php      <- hermano de public_html
        <?php return [
            'OPENPAY_ID'            => 'mxxxxxxxxxxxxxxxxxxx',
            'OPENPAY_LLAVE_PRIVADA' => 'sk_...',
            'OPENPAY_LLAVE_PUBLICA' => 'pk_...',
            'OPENPAY_PRODUCCION'    => '0',          // '1' cuando ya cobre de verdad
            'ENVIA_TOKEN'           => '...',
            'SKYDROPX_CLIENT_ID'    => '...',
            'SKYDROPX_CLIENT_SECRET'=> '...',
            'ORIGEN_CP'             => '00000',
            ...
        ];

      Al estar fuera de public_html nadie puede pedirlo por URL. La lista
      completa de claves está en LEEME-COBRO.md, en la raíz del proyecto.
   =========================================================================== */

declare(strict_types=1);
date_default_timezone_set('America/Mexico_City');
/* Un aviso de PHP en pantalla rompería la respuesta JSON: los errores van a la bitácora del servidor. */
ini_set('display_errors', '0');

const RAIZ = __DIR__ . '/..';

/* ---------------------------------------------------------------- secretos */
function secretos(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $cfg = [];
    $raiz = isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] !== ''
        ? dirname((string) $_SERVER['DOCUMENT_ROOT']) : dirname(RAIZ);
    foreach ([$raiz . '/greenova-secretos.php', dirname(RAIZ) . '/greenova-secretos.php'] as $archivo) {
        if (is_readable($archivo)) {
            $leido = require $archivo;
            if (is_array($leido)) { $cfg = $leido; break; }
        }
    }
    return $cfg;
}

function secreto(string $nombre, string $omision = ''): string {
    $env = getenv($nombre);
    if (is_string($env) && $env !== '') return trim($env);
    $cfg = secretos();
    if (isset($cfg[$nombre]) && (string) $cfg[$nombre] !== '') return trim((string) $cfg[$nombre]);
    return $omision;
}

/* Solo para probar en la computadora: cotiza y cobra de mentira. En Hostinger
   nunca se define. */
function modo_demo(): bool { return secreto('MODO_DEMO') === '1'; }

/* Un secreto propio del servidor para firmar las opciones de envío. Si no
   hay SESION_SECRETO se crea uno al azar fuera de public_html. */
function llave_servidor(): string {
    $s = secreto('SESION_SECRETO');
    if ($s !== '') return $s;
    $archivo = carpeta_privada() . '/greenova-llave.txt';
    if (is_readable($archivo)) return trim((string) file_get_contents($archivo));
    $s = bin2hex(random_bytes(32));
    @file_put_contents($archivo, $s);
    @chmod($archivo, 0600);
    return $s;
}

function carpeta_privada(): string {
    $propia = secreto('CARPETA_PRIVADA');
    if ($propia !== '' && is_dir($propia)) return $propia;
    $raiz = isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] !== ''
        ? dirname((string) $_SERVER['DOCUMENT_ROOT']) : dirname(RAIZ);
    return is_writable($raiz) ? $raiz : sys_get_temp_dir();
}

/* ---------------------------------------------------------------- respuestas */
function responde(array $datos, int $codigo = 200): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function cuerpo_json(int $tope = 60000): array {
    $crudo = file_get_contents('php://input', false, null, 0, $tope + 1);
    if ($crudo === false || strlen($crudo) > $tope) responde(['error' => 'muy_grande'], 413);
    $d = json_decode($crudo, true);
    return is_array($d) ? $d : [];
}

function texto($v, int $largo = 200): string {
    if (!is_string($v) && !is_numeric($v)) return '';
    $v = trim(preg_replace('/\s+/u', ' ', (string) $v) ?? '');
    return mb_substr($v, 0, $largo);
}

function ip(): string {
    return (string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/* ---------------------------------------------------------------- base de datos
   Con DATABASE_URL (la misma de Supabase que usa el resto del sitio) se
   guarda en Postgres; si no, en un SQLite fuera de public_html. */
function bd(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $url = secreto('DATABASE_URL');
    if ($url !== '' && extension_loaded('pdo_pgsql')) {
        $p = parse_url($url);
        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=require', $p['host'] ?? '', (int) ($p['port'] ?? 5432),
                       ltrim($p['path'] ?? '/postgres', '/'));
        $pdo = new PDO($dsn, urldecode($p['user'] ?? ''), urldecode($p['pass'] ?? ''),
                       [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => true]);
        $serial = 'BIGSERIAL PRIMARY KEY';
        $pg = true;
    } else {
        $archivo = secreto('DATOS_SQLITE', carpeta_privada() . '/greenova-ventas.sqlite');
        $pdo = new PDO('sqlite:' . $archivo, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('PRAGMA journal_mode=WAL');
        $serial = 'INTEGER PRIMARY KEY AUTOINCREMENT';
        $pg = false;
    }
    /* ventas = pedidos pagados (o por pagar) en línea. Los pedidos por
       cotización siguen en la tabla "pedidos" del resto del sitio. */
    $pdo->exec("CREATE TABLE IF NOT EXISTS ventas (
        id $serial, fecha TEXT NOT NULL, actualizado TEXT, folio TEXT NOT NULL UNIQUE, clave TEXT NOT NULL,
        estado TEXT NOT NULL, cuenta_id BIGINT, nombre TEXT NOT NULL, correo TEXT NOT NULL, telefono TEXT NOT NULL,
        direccion TEXT NOT NULL, lineas TEXT NOT NULL, subtotal DOUBLE PRECISION NOT NULL,
        envio DOUBLE PRECISION NOT NULL, total DOUBLE PRECISION NOT NULL, plataforma TEXT, paqueteria TEXT,
        servicio TEXT, envio_ref TEXT, metodo TEXT, openpay_id TEXT, spei TEXT, guia TEXT, rastreo TEXT,
        etiqueta TEXT, nota TEXT)");
    /* Columnas que llegaron después (en una base que ya las tiene, falla y se ignora). */
    try { $pdo->exec('ALTER TABLE ventas ADD COLUMN tarjeta TEXT'); } catch (Throwable $e) { /* ya existe */ }
    $pdo->exec("CREATE TABLE IF NOT EXISTS cobro_limites (clave TEXT PRIMARY KEY, ventana BIGINT NOT NULL, n INTEGER NOT NULL)");
    if ($pg) {
        /* Igual que las otras tablas: la API pública de Supabase no las lee. */
        try { $pdo->exec('ALTER TABLE ventas ENABLE ROW LEVEL SECURITY'); } catch (Throwable $e) { /* ya estaba */ }
        try { $pdo->exec('ALTER TABLE cobro_limites ENABLE ROW LEVEL SECURITY'); } catch (Throwable $e) { /* ya estaba */ }
    }
    return $pdo;
}

function ahora(): string { return gmdate('Y-m-d\TH:i:s\Z'); }

/* Tope de intentos por IP cada 10 minutos (cotizar, pagar). */
function cupo(string $que, int $tope): bool {
    $ventana = intdiv(time(), 600);
    $clave = $que . ':' . hash('sha256', ip());
    $pdo = bd();
    $st = $pdo->prepare('SELECT ventana, n FROM cobro_limites WHERE clave = ?');
    $st->execute([$clave]);
    $f = $st->fetch(PDO::FETCH_NUM);
    if (!$f || (int) $f[0] !== $ventana) {
        $pdo->prepare('DELETE FROM cobro_limites WHERE clave = ?')->execute([$clave]);
        $pdo->prepare('INSERT INTO cobro_limites (clave, ventana, n) VALUES (?, ?, 1)')->execute([$clave, $ventana]);
        return true;
    }
    if ((int) $f[1] >= $tope) return false;
    $pdo->prepare('UPDATE cobro_limites SET n = n + 1 WHERE clave = ?')->execute([$clave]);
    return true;
}

/* ---------------------------------------------------------------- catálogo
   Los precios salen de productos.js, el mismo archivo que usa la tienda (y
   que guarda el panel). El navegador solo manda qué y cuánto; el precio lo
   pone siempre el servidor. */
function catalogo(): array {
    static $cat = null;
    if ($cat !== null) return $cat;
    $archivo = RAIZ . '/productos.js';
    $js = (string) @file_get_contents($archivo);
    $cache = sys_get_temp_dir() . '/greenova-cat-' . md5($js) . '.json';
    if (is_readable($cache)) {
        $cat = json_decode((string) file_get_contents($cache), true);
        if (is_array($cat)) return $cat;
    }
    $prods = js_a_json(bloque_js($js, 'PRODUCTOS'));
    $promos = js_a_json(bloque_js($js, 'PROMOS'));
    $cat = ['productos' => [], 'promos' => is_array($promos) ? $promos : []];
    foreach (is_array($prods) ? $prods : [] as $p) {
        if (is_array($p) && isset($p['id'])) $cat['productos'][$p['id']] = $p;
    }
    @file_put_contents($cache, json_encode($cat, JSON_UNESCAPED_UNICODE));
    return $cat;
}

/* El texto de `var NOMBRE = [...]` o `{...}` dentro de productos.js. */
function bloque_js(string $js, string $nombre): string {
    $i = strpos($js, 'var ' . $nombre . ' = ');
    if ($i === false) return '';
    $i = strpos($js, '=', $i) + 1;
    while ($i < strlen($js) && ctype_space($js[$i])) $i++;
    $abre = $js[$i] ?? '';
    if ($abre !== '[' && $abre !== '{') return '';
    $nivel = 0; $en_texto = false;
    for ($k = $i, $n = strlen($js); $k < $n; $k++) {
        $c = $js[$k];
        if ($en_texto) {
            if ($c === '\\') { $k++; continue; }
            if ($c === '"') $en_texto = false;
            continue;
        }
        if ($c === '"') { $en_texto = true; continue; }
        if ($c === '/' && ($js[$k + 1] ?? '') === '*') { $k = strpos($js, '*/', $k + 2) + 1; continue; }
        if ($c === '[' || $c === '{') $nivel++;
        if ($c === ']' || $c === '}') { $nivel--; if ($nivel === 0) return substr($js, $i, $k - $i + 1); }
    }
    return '';
}

/* Convierte el literal de JavaScript (llaves sin comillas, comentarios y
   comas al final) a JSON y lo lee. */
function js_a_json(string $js) {
    $out = ''; $n = strlen($js);
    for ($k = 0; $k < $n; $k++) {
        $c = $js[$k];
        if ($c === '"') {
            $j = $k + 1;
            while ($j < $n && $js[$j] !== '"') { if ($js[$j] === '\\') $j++; $j++; }
            $out .= substr($js, $k, $j - $k + 1); $k = $j; continue;
        }
        if ($c === '/' && ($js[$k + 1] ?? '') === '*') { $k = strpos($js, '*/', $k + 2) + 1; continue; }
        if ($c === '/' && ($js[$k + 1] ?? '') === '/') { $k = strpos($js, "\n", $k) ?: $n; continue; }
        if (ctype_alpha($c) || $c === '_') {
            $j = $k; while ($j < $n && (ctype_alnum($js[$j]) || $js[$j] === '_')) $j++;
            $palabra = substr($js, $k, $j - $k);
            $m = $j; while ($m < $n && ctype_space($js[$m])) $m++;
            $out .= (($js[$m] ?? '') === ':') ? '"' . $palabra . '"' : $palabra;
            $k = $j - 1; continue;
        }
        $out .= $c;
    }
    $out = preg_replace('/,(\s*[\]}])/', '$1', $out);
    return json_decode((string) $out, true);
}

/* Las líneas del carrito, ya con el precio del catálogo.
   Cada línea: { id, v (medida), u ("paq" o "caja"), qty }. */
function lineas_con_precio(array $carrito): array {
    $cat = catalogo();
    $out = []; $subtotal = 0.0;
    foreach (array_slice($carrito, 0, 60) as $l) {
        if (!is_array($l)) continue;
        $p = $cat['productos'][(string) ($l['id'] ?? '')] ?? null;
        $u = ($l['u'] ?? '') === 'caja' ? 'caja' : 'paq';
        $qty = (int) ($l['qty'] ?? 0);
        if (!$p || $qty < 1 || $qty > 999) throw new InvalidArgumentException('linea');
        $i = array_search((string) ($l['v'] ?? ''), $p['v'] ?? [], true);
        $t = $i === false ? null : ($p['venta']['tam'][$i] ?? null);
        $precio = $t ? ($u === 'paq' ? ($t['pPaq'] ?? null) : ($t['pCaja'] ?? null)) : null;
        $piezas = $t ? ($u === 'paq' ? ($t['paq'] ?? null) : ($t['caja'] ?? null)) : null;
        if ($precio === null || !$piezas) throw new InvalidArgumentException('linea');
        $promo = $cat['promos'][$p['id']] ?? null;
        if (is_array($promo) && !empty($promo['agotado'])) throw new InvalidArgumentException('agotado');
        if (is_array($promo) && !empty($promo['desc'])) $precio = $precio * (1 - $promo['desc'] / 100);
        $sub = $precio * $qty;
        $subtotal += $sub;
        $out[] = ['id' => $p['id'], 'cat' => $p['cat'] ?? '', 'nombre' => $p['nombre'], 'v' => $p['v'][$i],
                  'u' => $u, 'qty' => $qty, 'piezas' => $piezas * $qty, 'precio' => round($precio, 2),
                  'subtotal' => round($sub, 2), 'sku' => $t['sku'] ?? null];
    }
    if (!$out) throw new InvalidArgumentException('vacio');
    return [$out, round($subtotal, 2)];
}

/* Huella del carrito: la opción de envío solo vale para ese carrito y ese CP. */
function huella(array $lineas, string $cp): string {
    $partes = array_map(fn($l) => $l['id'] . '|' . $l['v'] . '|' . $l['u'] . '|' . $l['qty'], $lineas);
    sort($partes);
    return hash('sha256', implode(';', $partes) . '#' . $cp);
}

function firma(string $dato): string { return hash_hmac('sha256', $dato, llave_servidor() . '|envio'); }

/* ---------------------------------------------------------------- cuentas
   El mismo token de "Mi cuenta" que firma main.py: c{id}.{vence}.{firma},
   con SESION_SECRETO + "|cuenta|" + el sello de la cuenta. Si no se puede
   comprobar (sin base compartida), el pedido sigue sin ligarse a la cuenta. */
function cuenta_id_de_token(string $token): ?int {
    if (!preg_match('/^c(\d+)\.(\d+)\.([0-9a-f]{64})$/', $token, $m) || (int) $m[2] < time()) return null;
    try {
        $st = bd()->prepare('SELECT sello FROM cuentas WHERE id = ?');
        $st->execute([(int) $m[1]]);
        $sello = $st->fetchColumn();
    } catch (Throwable $e) { return null; }
    if (!$sello) return null;
    $esperada = hash_hmac('sha256', 'c' . $m[1] . '.' . $m[2], secreto('SESION_SECRETO') . '|cuenta|' . $sello);
    return hash_equals($esperada, $m[3]) ? (int) $m[1] : null;
}

/* ---------------------------------------------------------------- HTTP */
function http_json(string $metodo, string $url, ?array $datos, array $cabeceras = [], int $espera = 25): array {
    $ch = curl_init($url);
    $h = array_merge(['Accept: application/json'], $cabeceras);
    if ($datos !== null) $h[] = 'Content-Type: application/json';
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $espera,
        CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_HTTPHEADER => $h,
    ]);
    if ($datos !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos, JSON_UNESCAPED_UNICODE));
    $crudo = curl_exec($ch);
    $codigo = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
   
    $j = is_string($crudo) ? json_decode($crudo, true) : null;
    return ['codigo' => $codigo, 'json' => is_array($j) ? $j : null, 'crudo' => is_string($crudo) ? substr($crudo, 0, 2000) : '', 'error' => $err];
}

function bitacora(string $que, $detalle): void {
    $linea = ahora() . ' ' . $que . ' ' . (is_string($detalle) ? $detalle : json_encode($detalle, JSON_UNESCAPED_UNICODE)) . "\n";
    @file_put_contents(carpeta_privada() . '/greenova-cobro.log', $linea, FILE_APPEND);
}

/* ---------------------------------------------------------------- correo */
function correo(string $para, string $asunto, string $texto): void {
    $de = secreto('CORREO_REMITENTE', 'ventas@greenovasc.com.mx');
    $cab = "From: GreeNova SC <$de>\r\nReply-To: ventas@greenovasc.com.mx\r\nMIME-Version: 1.0\r\n" .
           "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    if (modo_demo()) { bitacora('correo', ['para' => $para, 'asunto' => $asunto]); return; }
    @mail($para, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $texto, $cab);
}

function dinero(float $n): string { return '$' . number_format($n, 2, '.', ',') . ' MXN'; }
