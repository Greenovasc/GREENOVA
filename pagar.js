/* GreeNova SC - la caja (pagar.html).
   ===========================================================================
   Orden que pidió Gabriel (2026-09-29):
   1. Dirección -> "Ver opciones de envío": php/checkout.php cotiza en
      Envia.com y Skydropx y regresa las opciones, de la más barata a la más
      cara.
   2. Elige su paquetería y le da "Continuar con la compra". Si no tiene
      sesión, AHÍ sale la ventana "Regístrate para continuar tu pedido" (su
      botón también dice "Continuar con la compra").
   3. Sus datos (ya llenos con su cuenta) y el pago: total = productos (IVA
      incluido) + envío, en un solo cobro. Tarjeta: los datos van directo a
      Openpay con openpay.js (nunca a nuestro servidor); se cobra con el token
      y 3D Secure. O transferencia SPEI: Openpay da CLABE y referencia.
   Al volver del banco (?folio=&clave=) se pregunta cómo quedó el pago.
   =========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var G = window.GREENOVA || {};
  var PRODS = G.PRODUCTOS || [];
  var KEY = "greenova.carrito.v2";
  var KEY_ENVIO = "greenova.envio";
  var API = "php/checkout.php?accion=";
  var cfg = null, opciones = [], elegida = null, subtotal = 0, cotizadoPara = "";
  var sesionDispositivo = "";

  function carrito() {
    try { var c = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(c) ? c : []; }
    catch (e) { return []; }
  }
  function money(n) {
    return "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function api(accion, datos) {
    return fetch(API + accion + (datos && datos._qs ? datos._qs : ""), {
      method: datos && !datos._qs ? "POST" : "GET",
      headers: datos && !datos._qs ? { "Content-Type": "application/json" } : {},
      body: datos && !datos._qs ? JSON.stringify(datos) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._s = r.status; return j; });
    });
  }

  /* ---------------------------------------------------------- resumen */
  function prodDe(id) { return PRODS.filter(function (p) { return p.id === id; })[0]; }
  function precioLinea(l) {
    var p = prodDe(l.id);
    var i = p ? p.v.indexOf(l.v) : -1;
    var t = i > -1 && p.venta ? p.venta.tam[i] : null;
    if (!t) return null;
    var precio = l.u === "paq" ? t.pPaq : t.pCaja;
    var promo = (G.PROMOS || {})[l.id];
    if (precio != null && promo && promo.desc) precio = precio * (1 - promo.desc / 100);
    return precio == null ? null : precio * l.qty;
  }
  function pintaResumen() {
    var c = carrito();
    subtotal = c.reduce(function (s, l) { return s + (precioLinea(l) || 0); }, 0);
    /* Cada producto se puede cambiar de cantidad o quitar ("si no le
       convenció", Gabriel 2026-09-29). */
    $("pago-lineas").innerHTML = c.map(function (l, k) {
      var p = prodDe(l.id);
      var unidad = l.u === "caja" ? (l.qty === 1 ? "caja" : "cajas") : (l.qty === 1 ? "paquete" : "paquetes");
      return '<li data-k="' + k + '"><span class="pago-linea__txt"><b>' + esc(p ? p.nombre : l.id) + "</b><small>" + esc(l.v) + "</small>" +
        '<span class="pago-cant"><button type="button" data-cant="-1" aria-label="Uno menos">−</button>' +
        "<span>" + esc(l.qty) + " " + unidad + "</span>" +
        '<button type="button" data-cant="1" aria-label="Uno más">+</button></span></span>' +
        '<span class="pago-linea__der"><b>' + money(precioLinea(l)) + "</b>" +
        '<button type="button" class="pago-quita" data-quita aria-label="Quitar ' + esc(p ? p.nombre : "") + '">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-trash"></use></svg></button></span></li>';
    }).join("");
    $("r-productos").textContent = money(subtotal);
    $("r-envio").textContent = elegida ? money(elegida.precio) : "Elige tu envío";
    $("r-total").textContent = money(subtotal + (elegida ? elegida.precio : 0));
    var etiqueta = $("btn-pagar").querySelector(".btn__label");
    etiqueta.textContent = elegida ? "Pagar " + money(subtotal + elegida.precio) : "Pagar";
  }

  /* ---------------------------------------------------------- avisos */
  function aviso(html) {
    $("pago-aviso").innerHTML = html;
    $("pago-aviso").hidden = false;
    $("pago-grid").hidden = true;
  }

  function error(id, msg) {
    var el = $(id), slot = document.querySelector('[data-err="' + id + '"]');
    if (slot) slot.textContent = msg || "";
    if (el) {
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      var f = el.closest(".field"); if (f) f.dataset.invalid = msg ? "true" : "false";
    }
    return !msg;
  }

  /* ---------------------------------------------------------- dirección
     El estado se elige solo con el código postal (los dos primeros dígitos). */
  var CP_ESTADO = [[1, 16, "CX"], [20, 20, "AG"], [21, 22, "BC"], [23, 23, "BS"], [24, 24, "CM"], [25, 27, "CO"],
    [28, 28, "CL"], [29, 30, "CS"], [31, 33, "CH"], [34, 35, "DG"], [36, 38, "GT"], [39, 41, "GR"], [42, 43, "HG"],
    [44, 49, "JA"], [50, 57, "EM"], [58, 61, "MI"], [62, 62, "MO"], [63, 63, "NA"], [64, 67, "NL"], [68, 71, "OA"],
    [72, 75, "PU"], [76, 76, "QT"], [77, 77, "QR"], [78, 79, "SL"], [80, 82, "SI"], [83, 85, "SO"], [86, 86, "TB"],
    [87, 89, "TM"], [90, 90, "TL"], [91, 96, "VE"], [97, 97, "YU"], [98, 99, "ZA"]];
  function estadoDeCp(cp) {
    var n = parseInt(String(cp).slice(0, 2), 10);
    for (var i = 0; i < CP_ESTADO.length; i++) if (n >= CP_ESTADO[i][0] && n <= CP_ESTADO[i][1]) return CP_ESTADO[i][2];
    return "";
  }
  function direccion() {
    var d = {};
    ["cp", "estado", "ciudad", "colonia", "calle", "numero", "interior", "referencias"].forEach(function (k) {
      var el = document.querySelector('#pago-form [name="' + k + '"]');
      d[k] = el ? el.value.trim() : "";
    });
    d.cp = d.cp.replace(/\D/g, "");
    return d;
  }
  function claveCotizacion() {
    var d = direccion();
    return JSON.stringify([carrito(), d.cp, d.estado, d.ciudad.toLowerCase(), d.colonia.toLowerCase()]);
  }

  /* ---------------------------------------------------------- envíos */
  function diasMin(t) { var m = String(t || "").match(/\d+/); return m ? Number(m[0]) : 99; }
  function pintaOpciones() {
    var baratas = opciones.length ? opciones[0].precio : 0;
    var rapida = opciones.reduce(function (m, o) { return Math.min(m, diasMin(o.dias)); }, 99);
    $("envios").innerHTML = opciones.map(function (o, i) {
      var sellos = (o.precio === baratas ? '<span class="envio__sello">Más barato</span>' : "") +
                   (diasMin(o.dias) === rapida && rapida < 99 ? '<span class="envio__sello envio__sello--rapido">Más rápido</span>' : "");
      return '<label class="envio"><input type="radio" name="envio" value="' + i + '">' +
        '<span class="envio__txt"><b>' + esc(o.paqueteria) + (o.servicio ? " · " + esc(o.servicio) : "") + "</b>" +
        "<small>por " + esc(o.plataforma) + (o.dias ? " · " + esc(o.dias) : "") + "</small>" + sellos + "</span>" +
        '<span class="envio__precio">' + money(o.precio) + "</span></label>";
    }).join("");
  }

  function cotizar() {
    var d = direccion(), ok = true;
    if ($("direccion-campos").hidden) $("btn-opciones").click();
    ok = error("p-cp", /^\d{5}$/.test(d.cp) ? "" : "Escribe tu código postal (5 dígitos).") && ok;
    ok = error("p-estado", d.estado ? "" : "Elige tu estado.") && ok;
    ok = error("p-ciudad", d.ciudad ? "" : "Escribe tu ciudad o municipio.") && ok;
    ok = error("p-colonia", d.colonia ? "" : "Escribe tu colonia.") && ok;
    if (!ok) return;
    var btn = $("btn-cotizar"), lab = btn.querySelector(".btn__label");
    btn.disabled = true; lab.textContent = "Buscando paqueterías…";
    $("cotiza-estado").textContent = "";
    api("cotizar", { carrito: carrito(), destino: d }).then(function (j) {
      btn.disabled = false; lab.textContent = "Actualizar paqueterías";
      if (!j.opciones) {
        $("cotiza-estado").textContent = j.error === "cp" ? "Revisa tu código postal." :
          j.error === "muchos_intentos" ? "Demasiados intentos. Espera unos minutos." :
          "No pudimos cotizar el envío ahora. Intenta de nuevo en un momento.";
        return;
      }
      opciones = j.opciones; elegida = null; cotizadoPara = claveCotizacion();
      subtotal = j.subtotal;
      if (!opciones.length) {
        $("cotiza-estado").textContent = "No encontramos paqueterías para ese código postal. Revísalo o escríbenos por WhatsApp al 55 2260 1113.";
        $("paso-envio").disabled = true;
        return;
      }
      $("paso-envio").disabled = false;
      pintaOpciones();
      pintaResumen();
      $("paso-envio").scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function () {
      btn.disabled = false; lab.textContent = "Ver paqueterías";
      $("cotiza-estado").textContent = "No pudimos conectarnos. Revisa tu internet e intenta de nuevo.";
    });
  }

  /* Si cambian la dirección o el carrito, las opciones de envío ya no valen. */
  function revisaVigencia() {
    if (!opciones.length || claveCotizacion() === cotizadoPara) return;
    opciones = []; elegida = null;
    $("envios").innerHTML = "";
    $("paso-envio").disabled = true; $("paso-pago").hidden = true; $("btn-continuar").disabled = true;
    $("cotiza-estado").textContent = "Cambió tu dirección o tu pedido: vuelve a ver las paqueterías.";
    $("btn-cotizar").querySelector(".btn__label").textContent = "Ver paqueterías";
    pintaResumen();
  }

  /* ---------------------------------------------------------- tarjeta */
  function marca(num) {
    if (/^4/.test(num)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "American Express";
    return "";
  }
  function luhn(num) {
    var s = 0, par = false;
    for (var i = num.length - 1; i >= 0; i--) {
      var d = Number(num[i]);
      if (par) { d *= 2; if (d > 9) d -= 9; }
      s += d; par = !par;
    }
    return num.length >= 13 && s % 10 === 0;
  }
  function cargaOpenpay() {
    return new Promise(function (ok, mal) {
      if (window.OpenPay && window.OpenPay.deviceData) return ok();
      function script(src, luego) {
        var s = document.createElement("script");
        s.src = src; s.onload = luego; s.onerror = function () { mal(new Error("openpay")); };
        document.head.appendChild(s);
      }
      script("https://js.openpay.mx/openpay.v1.min.js", function () {
        script("https://js.openpay.mx/openpay-data.v1.min.js", ok);
      });
    }).then(function () {
      if (sesionDispositivo) return;
      window.OpenPay.setId(cfg.openpay.id);
      window.OpenPay.setApiKey(cfg.openpay.llave);
      window.OpenPay.setSandboxMode(!!cfg.openpay.sandbox);
      sesionDispositivo = window.OpenPay.deviceData.setup("pago-form", "device_session_id");
    });
  }
  function tokenTarjeta() {
    var num = $("t-numero").value.replace(/\D/g, "");
    var mmaa = $("t-vence").value.replace(/\D/g, "");
    if (cfg.demo) return Promise.resolve(num === "4000000000000002" ? "demo-rechazo" : "demo-tok");
    return cargaOpenpay().then(function () {
      return new Promise(function (ok, mal) {
        window.OpenPay.token.create({
          card_number: num, holder_name: $("t-titular").value.trim(),
          expiration_month: mmaa.slice(0, 2), expiration_year: mmaa.slice(2, 4), cvv2: $("t-cvv").value.trim()
        }, function (r) { ok(r.data.id); }, function (r) {
          var d = (r && r.data) || {};
          mal(new Error(d.error_code === 2004 ? "El número de tarjeta no es válido." :
                        d.error_code === 2005 ? "La fecha de vencimiento ya pasó." :
                        d.error_code === 2006 ? "Revisa el código de seguridad (CVV)." :
                        "Revisa los datos de tu tarjeta."));
        });
      });
    });
  }

  /* ---------------------------------------------------------- pagar */
  function validaTodo() {
    var ok = true, metodo = document.querySelector('[name="metodo"]:checked').value;
    var nombre = $("p-nombre").value.trim(), tel = $("p-tel").value.replace(/\D/g, ""), correo = $("p-correo").value.trim();
    var d = direccion();
    ok = error("p-nombre", /\S+\s+\S+/.test(nombre) ? "" : "Escribe tu nombre y apellido.") && ok;
    ok = error("p-tel", (tel.length === 10 || (tel.length === 12 && tel.indexOf("52") === 0)) ? "" : "Escribe tu WhatsApp a 10 dígitos.") && ok;
    ok = error("p-correo", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo) ? "" : "Escribe tu correo: ahí te llega tu recibo.") && ok;
    ok = error("p-calle", d.calle ? "" : "Escribe tu calle.") && ok;
    ok = error("p-numero", d.numero ? "" : "Escribe el número.") && ok;
    if (metodo === "tarjeta") {
      var num = $("t-numero").value.replace(/\D/g, ""), mmaa = $("t-vence").value.replace(/\D/g, "");
      var mes = Number(mmaa.slice(0, 2)), anio = 2000 + Number(mmaa.slice(2, 4)), hoy = new Date();
      var vigente = mmaa.length === 4 && mes >= 1 && mes <= 12 &&
        (anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1));
      ok = error("t-titular", /\S+\s+\S+/.test($("t-titular").value.trim()) ? "" : "Escribe el nombre como aparece en la tarjeta.") && ok;
      ok = error("t-numero", luhn(num) ? "" : "Revisa el número de tu tarjeta.") && ok;
      ok = error("t-vence", vigente ? "" : "Escribe el vencimiento como MM/AA.") && ok;
      ok = error("t-cvv", /^\d{3,4}$/.test($("t-cvv").value.trim()) ? "" : "Son los 3 o 4 dígitos de atrás de la tarjeta.") && ok;
    }
    ok = error("p-acepta", $("p-acepta").checked ? "" : "Para pagar, acepta el aviso de privacidad.") && ok;
    return ok;
  }

  function pagar(e) {
    e.preventDefault();
    var estado = $("pago-estado");
    estado.textContent = ""; estado.dataset.state = "";
    if (!elegida) { estado.textContent = "Elige cómo quieres tu envío."; return; }
    if (!validaTodo()) {
      estado.textContent = "Revisa los campos marcados.";
      var mal = document.querySelector('#pago-form [aria-invalid="true"]');
      if (mal) mal.focus();
      return;
    }
    var metodo = document.querySelector('[name="metodo"]:checked').value;
    var numT = $("t-numero").value.replace(/\D/g, "");
    var tarjetaTxt = metodo === "tarjeta" && numT.length > 4 ? (marca(numT) || "Tarjeta") + " •••• " + numT.slice(-4) : "";
    var btn = $("btn-pagar"), lab = btn.querySelector(".btn__label"), antes = lab.textContent;
    btn.disabled = true; lab.textContent = "Procesando tu pago…";
    function suelta(msg) { btn.disabled = false; lab.textContent = antes; estado.dataset.state = "error"; estado.textContent = msg; }

    (metodo === "tarjeta" ? tokenTarjeta() : Promise.resolve("")).then(function (token) {
      var d = direccion();
      try { localStorage.setItem(KEY_ENVIO, JSON.stringify(d)); } catch (x) { /* modo privado */ }
      return api("pagar", {
        carrito: carrito(), envio: elegida.token, metodo: metodo, acepta: true,
        cliente: { nombre: $("p-nombre").value.trim(), correo: $("p-correo").value.trim(), telefono: $("p-tel").value.trim() },
        direccion: d, token_tarjeta: token, sesion_dispositivo: sesionDispositivo, tarjeta: tarjetaTxt,
        sesion: window.GNCuenta ? window.GNCuenta.token() : ""
      });
    }).then(function (j) {
      if (window.GNmetrica) window.GNmetrica("pago_" + (j.estado || j.error || "error"));
      if (j.estado === "confirmar" && j.url) { lab.textContent = "Te llevamos con tu banco…"; location.href = j.url; return; }
      if (j.estado === "pagado") { vaciaCarrito(); return final(j.pedido || { folio: j.folio, estado: "pagado" }); }
      if (j.estado === "esperando") {
        vaciaCarrito();
        return final({ folio: j.folio, estado: "esperando", total: j.total, spei: j.spei, metodo: "spei" }, j.clave);
      }
      if (j.error === "envio_vencido" || j.error === "envio_cambio") {
        revisaVigencia(); opciones = []; $("paso-envio").disabled = true;
        return suelta("El precio del envío ya cambió. Vuelve a ver las paqueterías.");
      }
      suelta(j.mensaje || ({
        nombre: "Escribe tu nombre y apellido.", correo: "Revisa tu correo.", telefono: "Revisa tu WhatsApp.",
        calle: "Revisa tu dirección.", numero: "Revisa tu dirección.", colonia: "Revisa tu colonia.",
        ciudad: "Revisa tu ciudad.", cp: "Revisa tu código postal.", linea: "Algún producto del carrito ya no está disponible. Revisa tu carrito.",
        agotado: "Un producto de tu carrito se agotó. Revisa tu carrito.", muchos_intentos: "Demasiados intentos. Espera unos minutos.",
        pagos_apagados: "El pago en línea no está disponible en este momento."
      })[j.error] || "No pudimos completar el pago. Intenta de nuevo en un momento.");
    }).catch(function (err) {
      suelta(err && err.message && err.message !== "openpay" ? err.message :
             "No pudimos conectar con Openpay. Revisa tu internet e intenta de nuevo.");
    });
  }

  function vaciaCarrito() {
    try { localStorage.setItem(KEY, "[]"); } catch (x) { /* modo privado */ }
    var n = $("cart-count"); if (n) { n.textContent = "0"; n.dataset.empty = "true"; }
  }

  /* ---------------------------------------------------------- resultado */
  function final(p, clave) {
    $("pago-grid").hidden = true; $("pago-aviso").hidden = true;
    var f = $("pago-final"); f.hidden = false;
    var html;
    if (p.estado === "pagado" || p.estado === "enviado") {
      f.innerHTML = recibo(p);
      imprime(f);
      f.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    } else if (p.estado === "esperando") {
      var s = p.spei || {};
      html = '<div class="pago-ok pago-ok--spei"><h2>Solo falta tu transferencia</h2>' +
        "<p>Pedido <b>" + esc(p.folio) + "</b>. Transfiere <b>" + money(p.total) + "</b> desde la app de tu banco con estos datos:</p>" +
        '<dl class="spei">' +
        "<div><dt>Banco</dt><dd>" + esc(s.banco) + "</dd></div>" +
        "<div><dt>CLABE</dt><dd><b>" + esc(s.clabe) + '</b> <button type="button" class="link-btn" data-copia="' + esc(s.clabe) + '">Copiar</button></dd></div>' +
        "<div><dt>Referencia / concepto</dt><dd><b>" + esc(s.referencia) + '</b> <button type="button" class="link-btn" data-copia="' + esc(s.referencia) + '">Copiar</button></dd></div>' +
        "<div><dt>Beneficiario</dt><dd>" + esc(s.beneficiario) + "</dd></div>" +
        "<div><dt>Monto exacto</dt><dd><b>" + money(p.total) + "</b></dd></div>" +
        "<div><dt>Paga antes del</dt><dd>" + esc(s.vence) + "</dd></div></dl>" +
        "<p>Escribe la referencia tal cual. En cuanto el banco confirme tu pago te avisamos por correo y preparamos tu envío.</p>" +
        '<div class="pago-ok__acciones"><a class="btn btn--primary" href="tienda.html">Volver a la tienda</a></div></div>';
    } else if (p.estado === "confirmando" || p.estado === "pendiente") {
      html = '<div class="pago-ok"><div class="spinner" aria-hidden="true"></div><h2>Confirmando tu pago…</h2>' +
        "<p>Estamos esperando la respuesta de tu banco. No cierres esta página.</p></div>";
    } else {
      html = '<div class="pago-ok pago-ok--mal"><h2>No se completó el pago</h2>' +
        "<p>Tu banco no autorizó el cobro del pedido <b>" + esc(p.folio) + "</b>. No se hizo ningún cargo.</p>" +
        '<div class="pago-ok__acciones"><a class="btn btn--primary" href="pagar.html">Intentar de nuevo</a>' +
        '<a class="btn btn--ghost" href="contacto.html">Contáctanos</a></div></div>';
    }
    f.innerHTML = html;
    f.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------------------------------------------------- recibo
     Como la "impresora" de la imagen que mandó Gabriel (2026-09-29), con la
     marca: arriba el total y "Imprimiendo tu recibo"; abajo sale el ticket
     con los productos, el total, el número de ticket (para facturar), cómo
     pagó, la fecha y un código de barras (Code 39) del número de ticket. */
  var C39 = { "0": "101001101101", "1": "110100101011", "2": "101100101011", "3": "110110010101", "4": "101001101011",
    "5": "110100110101", "6": "101100110101", "7": "101001011011", "8": "110100101101", "9": "101100101101",
    A: "110101001011", B: "101101001011", C: "110110100101", D: "101011001011", E: "110101100101", F: "101101100101",
    G: "101010011011", H: "110101001101", I: "101101001101", J: "101011001101", K: "110101010011", L: "101101010011",
    M: "110110101001", N: "101011010011", O: "110101101001", P: "101101101001", Q: "101010110011", R: "110101011001",
    S: "101101011001", T: "101011011001", U: "110010101011", V: "100110101011", W: "110011010101", X: "100101101011",
    Y: "110010110101", Z: "100110110101", "-": "100101011011", "*": "100101101101" };
  function barras(texto) {
    var bits = ("*" + String(texto).toUpperCase() + "*").split("").map(function (c) { return (C39[c] || "") + "0"; }).join("");
    var x = 0, rects = "";
    for (var i = 0; i < bits.length; i++) { if (bits[i] === "1") rects += '<rect x="' + i + '" y="0" width="1" height="40"/>'; x = i; }
    return '<svg class="recibo__barras" viewBox="0 0 ' + (x + 1) + ' 40" preserveAspectRatio="none" aria-hidden="true">' + rects + "</svg>";
  }
  function fechaRecibo(iso) {
    var d = new Date(iso || Date.now());
    if (isNaN(d)) d = new Date();
    var mes = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][d.getMonth()];
    return d.getDate() + " " + mes + " " + d.getFullYear() + " · " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function recibo(p) {
    var lineas = (p.lineas || []).map(function (l) {
      var u = l.u === "caja" ? (l.qty === 1 ? "caja" : "cajas") : (l.qty === 1 ? "paq." : "paqs.");
      return '<div class="recibo__fila"><span>' + esc(l.qty) + " " + u + " · " + esc(l.nombre).toUpperCase() +
        "<small>" + esc(l.v) + "</small></span><span>" + money(l.subtotal) + "</span></div>";
    }).join("");
    var iva = p.total - p.total / 1.16;
    var pagado = p.metodo === "spei" ? "Transferencia SPEI" : (p.tarjeta || "Tarjeta");
    return '<div class="recibo" id="recibo">' +
      '<div class="recibo__maquina">' +
        '<div class="recibo__top"><img src="assets/isotipo-greenova.svg" alt="" width="788" height="792">' +
          '<a class="recibo__inicio" href="index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor"/></svg>Inicio</a></div>' +
        '<div class="recibo__panel"><div class="recibo__panel-fila"><div><b>GreeNova SC</b><span>Ticket ' + esc(p.folio) + "</span></div>" +
          '<div class="recibo__total"><small>Total</small><b>' + money(p.total) + "</b></div></div>" +
          '<p class="recibo__estado" aria-live="polite"><span class="recibo__spin" aria-hidden="true"></span><span class="recibo__estado-t">Imprimiendo tu recibo</span></p></div>' +
        '<div class="recibo__ranura" aria-hidden="true"></div>' +
      "</div>" +
      '<div class="recibo__salida"><div class="recibo__papel">' +
        '<div class="recibo__marca"><img src="assets/logo-greenova.svg" alt="GreeNova SC" width="1664" height="377"></div>' +
        '<p class="recibo__gracias">¡Gracias por tu compra!</p>' +
        '<hr>' + lineas + "<hr>" +
        '<div class="recibo__fila"><span>Productos</span><span>' + money(p.subtotal) + "</span></div>" +
        '<div class="recibo__fila"><span>Envío · ' + esc(p.paqueteria || "") + "</span><span>" + money(p.envio) + "</span></div>" +
        '<div class="recibo__fila recibo__fila--suave"><span>IVA incluido (16 %)</span><span>' + money(iva) + "</span></div>" +
        '<div class="recibo__fila recibo__fila--total"><span>TOTAL PAGADO</span><span>' + money(p.total) + "</span></div>" +
        "<hr>" +
        '<div class="recibo__fila"><span>Número de ticket</span><span><b>' + esc(p.folio) + "</b></span></div>" +
        '<div class="recibo__fila"><span>Pagado con</span><span>' + esc(pagado) + "</span></div>" +
        '<div class="recibo__fila"><span>Fecha</span><span>' + fechaRecibo(p.fecha) + "</span></div>" +
        (p.guia ? '<div class="recibo__fila"><span>Guía ' + esc(p.paqueteria || "") + "</span><span>" + esc(p.guia) + "</span></div>" : "") +
        barras(p.folio) + '<p class="recibo__codigo">' + esc(p.folio) + "</p>" +
        '<p class="recibo__pie">Para facturar, usa tu número de ticket en <b>Facturación</b>, al final de la página.</p>' +
      "</div></div>" +
      '<div class="recibo__acciones">' +
        '<button type="button" class="btn btn--primary" data-imprime>Imprimir o guardar recibo</button>' +
        (p.rastreo ? '<a class="btn btn--ghost" href="' + esc(p.rastreo) + '" target="_blank" rel="noopener">Rastrear mi envío</a>' : "") +
        '<a class="btn btn--ghost" href="tienda.html">Seguir comprando</a>' +
      "</div></div>";
  }
  /* El ticket sale de la ranura; al terminar, "¡Gracias por tu compra!". */
  function imprime(caja) {
    var r = caja.querySelector(".recibo");
    var listo = function () {
      r.dataset.listo = "true";
      r.querySelector(".recibo__estado-t").textContent = "¡Gracias por tu compra!";
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { listo(); return; }
    requestAnimationFrame(function () { r.dataset.imprimiendo = "true"; });
    setTimeout(listo, 2600);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-imprime]")) window.print();
  });

  /* Volvió del banco: se pregunta cada 3 s, hasta 2 minutos. */
  function seguimiento(folio, clave) {
    $("pago-grid").hidden = true;
    var intentos = 0;
    (function pregunta() {
      api("estado", { _qs: "&folio=" + encodeURIComponent(folio) + "&clave=" + encodeURIComponent(clave) }).then(function (j) {
        if (!j.pedido) { final({ folio: folio, estado: "rechazado" }); return; }
        if (j.pedido.estado === "pagado" || j.pedido.estado === "enviado") vaciaCarrito();
        final(j.pedido, clave);
        if ((j.pedido.estado === "confirmando" || j.pedido.estado === "pendiente") && ++intentos < 40) setTimeout(pregunta, 3000);
      }).catch(function () { if (++intentos < 40) setTimeout(pregunta, 3000); });
    })();
  }

  /* ---------------------------------------------------------- arranque */
  var qs = new URLSearchParams(location.search);
  if (qs.get("folio") && qs.get("clave")) { seguimiento(qs.get("folio"), qs.get("clave")); return; }

  if (!carrito().length) {
    aviso('<div class="pago-vacio"><h2>Tu carrito está vacío</h2><p>Agrega tus productos y aquí los pagas con tu envío.</p>' +
          '<a class="btn btn--primary" href="tienda.html">Ir a la tienda</a></div>');
    return;
  }

  api("config").then(function (j) {
    cfg = j;
    if (!j.pagos || !j.envios) {
      aviso('<div class="pago-vacio"><h2>El pago en línea llega muy pronto</h2>' +
            "<p>Mientras, envíanos tu pedido y te contactamos con el precio del envío y la forma de pago.</p>" +
            '<a class="btn btn--primary" href="tienda.html#cotizar-tienda">Enviar mi pedido</a></div>');
      return;
    }
    $("pago-grid").hidden = false;
    var sel = $("p-estado");
    Object.keys(j.estados || {}).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = j.estados[k]; sel.appendChild(o);
    });
    /* Lo que ya sabemos: su cuenta, su registro y su última dirección. */
    var perfil = (window.GNCuenta && window.GNCuenta.perfil()) || {};
    var reg = {}; try { reg = JSON.parse(localStorage.getItem("greenova.registro") || "{}") || {}; } catch (x) { reg = {}; }
    var env = {}; try { env = JSON.parse(localStorage.getItem(KEY_ENVIO) || "{}") || {}; } catch (x) { env = {}; }
    $("p-nombre").value = perfil.nombre || reg.nombre || "";
    $("p-tel").value = perfil.telefono || reg.telefono || "";
    $("p-correo").value = perfil.correo || reg.correo || "";
    Object.keys(env).forEach(function (k) {
      var el = document.querySelector('#pago-form [name="' + k + '"]'); if (el && env[k]) el.value = env[k];
    });
    pintaResumen();
    if (j.demo) $("pago-estado").textContent = "Modo de prueba: no se cobra nada.";
  }).catch(function () {
    aviso('<div class="pago-vacio"><h2>El pago en línea llega muy pronto</h2>' +
          "<p>Mientras, envíanos tu pedido y te contactamos con el precio del envío y la forma de pago.</p>" +
          '<a class="btn btn--primary" href="tienda.html#cotizar-tienda">Enviar mi pedido</a></div>');
  });

  $("btn-cotizar").addEventListener("click", cotizar);

  /* "Continuar con la compra": dirección completa y paquetería elegida; sin
     sesión, primero la ventana de registro, y luego el paso de pago. */
  function muestraPago() {
    var perfil = (window.GNCuenta && window.GNCuenta.perfil()) || {};
    if (perfil.nombre && !$("p-nombre").value) $("p-nombre").value = perfil.nombre;
    if (perfil.telefono && !$("p-tel").value) $("p-tel").value = perfil.telefono;
    if (perfil.correo && !$("p-correo").value) $("p-correo").value = perfil.correo;
    var paso = $("paso-pago");
    paso.hidden = false; paso.disabled = false;
    paso.scrollIntoView({ behavior: "smooth", block: "start" });
    if (cfg && !cfg.demo && cfg.openpay) cargaOpenpay().catch(function () {});
  }
  $("btn-continuar").addEventListener("click", function () {
    var d = direccion(), ok = true;
    ok = error("p-calle", d.calle ? "" : "Escribe tu calle.") && ok;
    ok = error("p-numero", d.numero ? "" : "Escribe el número.") && ok;
    if (!ok) { $("p-calle").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!elegida) return;
    if (window.GNRegistro && window.GNRegistro.exigir) window.GNRegistro.exigir(muestraPago);
    else muestraPago();
  });
  $("pago-form").addEventListener("submit", pagar);
  $("pago-form").addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true") error(e.target.id, "");
    if (e.target.id === "p-cp") {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
      if (e.target.value.length === 5 && !$("p-estado").value) $("p-estado").value = estadoDeCp(e.target.value);
    }
    if (e.target.id === "t-numero") {
      var n = e.target.value.replace(/\D/g, "").slice(0, 19);
      e.target.value = /^3[47]/.test(n) ? n.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, "$1 $2 $3").trim() : n.replace(/(\d{4})(?=\d)/g, "$1 ");
      $("t-marca").textContent = marca(n);
    }
    if (e.target.id === "t-vence") {
      var v = e.target.value.replace(/\D/g, "").slice(0, 4);
      e.target.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
    }
    if (e.target.id === "t-cvv") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    revisaVigencia();
  });
  $("pago-form").addEventListener("change", function (e) {
    if (e.target.name === "envio") {
      elegida = opciones[Number(e.target.value)];
      $("btn-continuar").disabled = false;
      pintaResumen();
    }
    if (e.target.name === "metodo") {
      var tarjeta = e.target.value === "tarjeta";
      $("tarjeta").hidden = !tarjeta; $("spei-info").hidden = tarjeta;
      if (tarjeta && cfg && !cfg.demo) cargaOpenpay().catch(function () {});
    }
    if (e.target.id === "p-estado") revisaVigencia();
  });
  /* openpay.js se carga en cuanto se abre el paso de pago con tarjeta: así
     el antifraude de Openpay ya tiene su sesión cuando le den "Pagar". */
  $("paso-pago").addEventListener("focusin", function () {
    if (cfg && !cfg.demo && cfg.openpay && document.querySelector('[name="metodo"]:checked').value === "tarjeta") cargaOpenpay().catch(function () {});
  });
  $("r-editar").addEventListener("click", function () { location.href = "tienda.html"; });
  $("pago-lineas").addEventListener("click", function (e) {
    var li = e.target.closest("li[data-k]");
    if (!li || !window.GNTienda || !window.GNTienda.cambiaLinea) return;
    var k = Number(li.dataset.k), l = carrito()[k];
    if (!l) return;
    if (e.target.closest("[data-quita]")) window.GNTienda.cambiaLinea(k, 0);
    var b = e.target.closest("[data-cant]");
    if (b) window.GNTienda.cambiaLinea(k, l.qty + Number(b.dataset.cant));
  });
  /* Cualquier cambio al carrito (aquí o en el cajón) repinta el resumen. */
  document.addEventListener("gn:carrito", function () {
    if (!$("pago-grid") || $("pago-grid").hidden) return;
    if (!carrito().length) {
      aviso('<div class="pago-vacio"><h2>Tu carrito está vacío</h2><p>Agrega tus productos y aquí los pagas con tu envío.</p>' +
            '<a class="btn btn--primary" href="tienda.html">Ir a la tienda</a></div>');
      return;
    }
    pintaResumen(); revisaVigencia();
  });
  /* "Ver opciones de pedido": despliega la dirección. */
  $("btn-opciones").addEventListener("click", function () {
    var abierto = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", String(!abierto));
    $("direccion-campos").hidden = abierto;
    if (!abierto) setTimeout(function () { $("p-cp").focus({ preventScroll: true }); }, 60);
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-copia]");
    if (!b) return;
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copia).then(function () { b.textContent = "¡Copiado!"; });
  });
  /* Si cambian cantidades en el cajón del carrito, se repinta el resumen. */
  window.addEventListener("storage", function (e) { if (e.key === KEY) { pintaResumen(); revisaVigencia(); } });
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#drawer")) setTimeout(function () { pintaResumen(); revisaVigencia(); }, 50);
  });
})();
