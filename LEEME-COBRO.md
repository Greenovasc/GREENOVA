# Cobro en línea: Openpay + Envia.com + Skydropx (Hostinger)

Cómo funciona, qué se pega en Hostinger y qué falta. Última revisión: 29 de septiembre de 2026.

## Cómo funciona

1. El cliente llena su carrito y le da **Pagar mi pedido**, o **Pagar ahora** en la ficha de un producto.
2. En `pagar.html` escribe sus datos y su dirección, y le da **Ver opciones de envío**.
3. El servidor (`php/checkout.php`) pregunta a **Envia.com** y a **Skydropx** cuánto cuesta el envío. El cliente ve todas las opciones juntas, de la más barata a la más cara, y elige una.
4. **Total = productos (con IVA) + envío**, en **un solo pago** con Openpay:
   - **Tarjeta** (crédito o débito). Los datos de la tarjeta van directo del navegador a Openpay: GreeNova nunca los ve. El banco puede pedir confirmar la compra (3D Secure). Nunca se pide el NIP.
   - **Transferencia SPEI**. Openpay da una CLABE y una referencia, y el cliente tiene 3 días para pagar.
   - Efectivo no se acepta.
5. En cuanto Openpay confirma el pago:
   - Se genera la **guía** en la plataforma que eligió el cliente.
   - Al cliente le llega un correo con su recibo y su guía.
   - A ventas le llega el pedido completo con la etiqueta para imprimir.
6. **El dinero entra completo a Openpay.** La guía se paga con el **saldo que GreeNova tenga en Envia.com o en Skydropx**, así que hay que tener saldo cargado en las dos. Si la guía no se puede generar, el pedido queda pagado y a ventas le llega un correo con el motivo, para hacerla a mano.

Los precios de los productos los pone siempre el servidor, leyendo `productos.js`. El del envío lo pone la paquetería, firmado para que nadie lo cambie desde el navegador.

## Archivos

| Archivo | Qué hace |
|---|---|
| `pagar.html`, `pagar.js` | La página de pago |
| `php/checkout.php` | Cotiza envíos, cobra y da el estado del pedido |
| `php/openpay-webhook.php` | Recibe el aviso de Openpay cuando entra un pago |
| `php/_comun.php`, `php/_ventas.php`, `php/openpay.php`, `php/envios.php` | Piezas internas. Bloqueadas por URL en `php/.htaccess` |
| `php/medidas.php` | **Peso y medidas** por paquete y por caja (hoy son un ESTIMADO) |
| `aviso-de-privacidad.html` | Aviso de privacidad (Gabriel quitó términos y envíos el 2026-09-29) |

## Qué pegar en Hostinger

Crea el archivo **`greenova-secretos.php` FUERA de `public_html`** (al mismo nivel que esa carpeta). Así nadie lo puede abrir por internet. **Nunca lo subas a GitHub.**

```php
<?php return [
    // Openpay (panel de Openpay › Configuración › Llaves de API)
    'OPENPAY_ID'             => 'm...',       // ID de comercio
    'OPENPAY_LLAVE_PRIVADA'  => 'sk_...',     // llave privada: solo aquí
    'OPENPAY_LLAVE_PUBLICA'  => 'pk_...',     // llave pública
    'OPENPAY_PRODUCCION'     => '0',          // '0' = pruebas (sandbox), '1' = cobro real

    // Envia.com (su panel › Desarrolladores › API)
    'ENVIA_TOKEN'            => '...',
    'ENVIA_PRODUCCION'       => '0',          // '1' con la cuenta real
    // 'ENVIA_PAQUETERIAS'   => 'estafeta,fedex,dhl,redpack,paquetexpress',

    // Skydropx (Skydropx PRO › Configuración › API)
    'SKYDROPX_CLIENT_ID'     => '...',
    'SKYDROPX_CLIENT_SECRET' => '...',
    // 'SKYDROPX_URL'        => 'https://pro.skydropx.com/api/v1',

    // De dónde salen los paquetes (PENDIENTE)
    'ORIGEN_CP'       => '',
    'ORIGEN_CALLE'    => '',
    'ORIGEN_NUMERO'   => '',
    'ORIGEN_COLONIA'  => '',
    'ORIGEN_CIUDAD'   => '',
    'ORIGEN_ESTADO'   => 'CX',   // clave de 2 letras: CX = Ciudad de México, EM = Estado de México…
    'ORIGEN_TELEFONO' => '5522601113',
    'ORIGEN_CORREO'   => 'ventas@greenovasc.com.mx',

    // Carta porte (la pide Skydropx para generar guías): pregúntale a tu contador
    'SAT_CLAVE_PRODUCTO' => '',
    'SAT_EMBALAJE'       => '4G',   // caja de cartón

    // Avisos y dirección del sitio
    'AVISOS_CORREO'    => 'ventas@greenovasc.com.mx',
    'CORREO_REMITENTE' => 'ventas@greenovasc.com.mx',  // debe ser un correo de tu dominio en Hostinger
    'SITIO_URL'        => 'https://www.greenovasc.com.mx',

    // La misma base de Supabase del resto del sitio (si Hostinger tiene pdo_pgsql).
    // Sin esto, las ventas se guardan en greenova-ventas.sqlite, junto a este archivo.
    // 'DATABASE_URL'  => 'postgresql://...',
    // 'SESION_SECRETO'=> '...',   // el mismo de Render, para ligar el pago con "Mi cuenta"
];
```

## Pasos para dejarlo cobrando

1. **Pruebas.** Con `OPENPAY_PRODUCCION = '0'`, usa las llaves de **sandbox** de Openpay y paga con sus tarjetas de prueba. Envia y Skydropx también tienen modo de pruebas.
2. **Aviso de pagos.** En Openpay › Configuración › Webhooks, da de alta `https://www.greenovasc.com.mx/php/openpay-webhook.php`. Openpay manda un código de verificación: llega por correo a ventas. Cópialo en ese mismo panel.
3. **Saldo** en Envia.com y en Skydropx, para que las guías se generen solas.
4. **Producción.** Cambia a las llaves reales y pon `OPENPAY_PRODUCCION = '1'` y `ENVIA_PRODUCCION = '1'`.
5. Si algo falla, el detalle queda en `greenova-cobro.log`, junto a `greenova-secretos.php`.

## Lo que falta

- **Código postal y dirección de origen** (`ORIGEN_*`).
- **Peso y medidas reales** de un paquete y una caja de cada producto, en `php/medidas.php`.
- **Clave SAT del producto** para la carta porte (`SAT_CLAVE_PRODUCTO`).
- **Domicilio y razón social** para el aviso de privacidad. Hoy dice "Ciudad de México".
- Que un **abogado revise** el aviso de privacidad: es un borrador.
- **Importante:** las cuentas de cliente, el registro, los pedidos por cotización, las métricas y el panel siguen en Python (Render). Si todo el sitio se muda a Hostinger compartido, esas partes también hay que pasarlas a PHP.

## Probar en la Mac (modo de prueba, no cobra nada)

```bash
MODO_DEMO=1 php -S 127.0.0.1:8090 -t .
MODO_LOCAL=1 PHP_LOCAL=http://127.0.0.1:8090 .venv/bin/uvicorn main:app --port 8000
```

Luego abre http://127.0.0.1:8000/pagar.html con algo en el carrito. En modo de prueba la tarjeta `4000 0000 0000 0002` sale rechazada y cualquier otra válida se aprueba.
