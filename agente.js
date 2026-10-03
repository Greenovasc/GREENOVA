/* GreeNova SC - agente de atención.
   ===========================================================================
   Dos niveles, en este orden:

   1. RAG local. El catálogo completo (56 productos) y los HECHOS de
      agente-criterios.js se indexan en el navegador. Se puntúa la pregunta
      contra ese índice; si un resultado gana con holgura, se contesta al
      instante con el dato real. Cero latencia, cero costo, cero riesgo de
      que se invente algo.

   2. Claude. Si el RAG no gana con holgura, se manda la pregunta al endpoint
      con los mejores pasajes recuperados y con los criterios. La API key vive
      SOLO en el servidor (ver api/chat.js y el README): aquí nunca aparece.

   Si el endpoint no está desplegado, el widget sigue funcionando en modo RAG
   y, cuando no sabe, entrega el contacto de ventas.
   =========================================================================== */
(function () {
  "use strict";
  if (!window.GREENOVA || !window.GREENOVA_AGENTE) return;

  var CFG = window.GREENOVA_AGENTE;
  var PRODS = window.GREENOVA.PRODUCTOS;
  var CATS = window.GREENOVA.CATEGORIAS;
  var MATS = window.GREENOVA.MATERIALES;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================= índice de recuperación ======================= */

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s.]/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  /* Palabras que no aportan nada al emparejamiento. */
  var VACIAS = norm("de la el los las un una y o que en para por con del al se su sus" +
    " me te lo les cual cuales como cuanto cuanta cuantos cuantas tienen tiene hay" +
    " puedo puede pueden quiero necesito busco es son esta este estos estas mi mis" +
    " a ustedes usted si no").split(" ");

  function tokens(s) {
    return norm(s).split(" ").filter(function (t) {
      return t.length > 2 && VACIAS.indexOf(t) === -1;
    });
  }

  /* Lematización cruda para español: se corta a seis letras. Con eso
     imprimir / imprime / impresión caen en la misma raíz, igual que
     envío / envíos / enviar o contenedor / contenedores. Es tosco, pero para
     un corpus de este tamaño funciona mejor que exigir prefijo exacto. */
  function raiz(t) {
    /* sin plural: "vasos" y "vaso" son la misma palabra */
    if (t.length > 4 && /[^s]s$/.test(t)) t = t.slice(0, -1);
    return t.length > 6 ? t.slice(0, 6) : t;
  }

  function raices(s) { return tokens(s).map(raiz); }

  /* Expansión por equivalencias: nadie pregunta por "vaso de papel", preguntan
     por café. Antes de puntuar, la pregunta se enriquece en silencio con los
     términos del catálogo que le corresponden. La tabla se edita en
     agente-criterios.js (SINONIMOS); aquí solo se aplica. */
  var SINON = (CFG.SINONIMOS || []).map(function (s) {
    return {
      /* Palabra completa, con el plural tolerado: "cafe" tiene que pegar en
         "cafes" pero no dentro de "cafeteria", y "te" no puede pegar dentro
         de "contenedor". Por eso se compara con frontera, no por substring. */
      dice: s.dice.map(function (t) {
        return new RegExp("(^| )" + norm(t).replace(/\./g, "\\.") + "(e?s)?( |$)");
      }),
      es: s.es
    };
  });

  /* Las mismas equivalencias, en prosa, viajan a la IA dentro del prefijo de
     criterios: la búsqueda ya trae los productos correctos, y esto evita que
     Claude conteste con la palabra del visitante en vez de la del catálogo. */
  var CRITERIOS_IA = CFG.CRITERIOS.concat((CFG.SINONIMOS || []).map(function (s) {
    return "Equivalencia de vocabulario: si dicen " +
      s.dice.slice(0, 6).join(", ") + " se refieren a " + s.es + ".";
  }));

  /* La guía de usos (GIROS) también viaja a la IA, en prosa: así, aunque la
     pregunta no use ninguna de las palabras de la tabla ("vendo cosas frías
     en la playa"), la IA recomienda con el mismo criterio que el vendedor. */
  CRITERIOS_IA = CRITERIOS_IA.concat((CFG.GIROS || []).map(function (g) {
    return "Guía de usos, " + g.nombre + " (" + g.dice.slice(0, 5).join(", ") + "): " +
      g.recs.map(function (r) {
        if (r.cotiza) {
          var c = (CFG.COTIZA || {})[r.cotiza];
          return c ? c.nombre + ", " + c.v + ", se cotiza (" + r.por + ")" : "";
        }
        var p = PRODS.filter(function (x) { return x.id === r.id; })[0];
        return p ? p.nombre + " " + r.v + " (" + r.por + ")" : "";
      }).filter(Boolean).join("; ") + ".";
  }));

  function expandir(pregunta) {
    var n = norm(pregunta);
    var extra = "";
    SINON.forEach(function (s) {
      for (var i = 0; i < s.dice.length; i++) {
        if (s.dice[i].test(n)) { extra += " " + s.es; return; }
      }
    });
    return pregunta + extra;
  }

  /* Pedido mínimo: un paquete; si el producto solo se vende por caja, una caja. */
  function minimoTexto(p) {
    var tam = (p.venta && p.venta.tam) || [];
    if (!tienePrecio(p)) return "se cotiza";
    return tam.some(function (t) { return t.paq && t.pPaq != null; }) ? "1 paquete" : "1 caja";
  }

  /* Popotes, portavasos, servilletas y papel están en la tienda sin precio:
     se cotizan desde su ficha. */
  function tienePrecio(p) {
    return !!(p.venta && p.venta.tam.some(function (t) {
      return (t.paq && t.pPaq != null) || (t.caja && t.pCaja != null);
    }));
  }

  /* "Tapa PET domo" -> "tapa PET domo": minúscula solo la primera letra, para
     no escribir "pet" o "rh". */
  function minus(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  function pesos(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* Cada medida con sus piezas y precios, tal como están en la tienda. */
  function medidasTexto(p) {
    var tam = (p.venta && p.venta.tam) || [];
    return p.v.map(function (v, k) {
      var t = tam[k] || {}, partes = [];
      if (t.paq && t.pPaq != null) partes.push("paquete de " + t.paq.toLocaleString("es-MX") + " pzs " + pesos(t.pPaq));
      if (t.caja && t.pCaja != null) partes.push("caja de " + t.caja.toLocaleString("es-MX") + " pzs " + pesos(t.pCaja));
      return v + (t.esp ? " (" + t.esp + ")" : "") + (partes.length ? ": " + partes.join(", ") : ": se cotiza");
    }).join("; ");
  }

  /* Cada documento: título, cuerpo, y un enlace opcional. */
  var DOCS = [];

  PRODS.forEach(function (p) {
    var cat = (CATS.filter(function (c) { return c.id === p.cat; })[0] || {}).nombre || "";
    var mats = p.mat.map(function (m) { return MATS[m]; }).join(", ");
    DOCS.push({
      tipo: "producto",
      id: p.id,
      titulo: p.nombre,
      cuerpo: p.desc + " Categoría: " + cat + ". Material: " + mats + "." +
              (tienePrecio(p) ? " Medidas y precios con IVA incluido: " : " Medidas (no tiene precio en línea, se cotiza desde su ficha): ") +
              medidasTexto(p) + "." +
              " Pedido mínimo: " + minimoTexto(p) + ".",
      enlace: "tienda.html?cat=" + p.cat,
      prod: p
    });
  });

  CFG.HECHOS.forEach(function (h) {
    DOCS.push({ tipo: "hecho", titulo: h.t, cuerpo: h.c });
  });

  /* Pre-tokenización: el título pesa más que el cuerpo. */
  DOCS.forEach(function (d) {
    d._set = {};
    raices(d.titulo).forEach(function (w) { d._set[w] = (d._set[w] || 0) + 3; });
    raices(d.cuerpo).forEach(function (w) { d._set[w] = (d._set[w] || 0) + 1; });
  });

  /* Frecuencia inversa: una palabra que sale en todos los documentos no
     distingue nada, así que pesa menos. */
  var IDF = {};
  DOCS.forEach(function (d) {
    Object.keys(d._set).forEach(function (w) { IDF[w] = (IDF[w] || 0) + 1; });
  });
  Object.keys(IDF).forEach(function (w) {
    IDF[w] = Math.log(1 + DOCS.length / IDF[w]);
  });

  /* ======================= faltas de ortografía =======================
     Antes de todo, cada palabra que el asistente no conoce se cambia por la
     del catálogo o de la guía de usos que más se le parece ("vachos" -> vaso,
     "eladeria" -> heladeria). Las reglas están en agente-criterios.js. */
  var corrige = (function () {
    if (!CFG.corrector) return function (t) { return t; };
    var fuertes = [];
    PRODS.forEach(function (p) { fuertes.push(p.nombre); });
    CATS.forEach(function (c) { fuertes.push(c.nombre); });
    Object.keys(MATS).forEach(function (m) { fuertes.push(MATS[m]); });
    (CFG.GIROS || []).forEach(function (g) { fuertes = fuertes.concat(g.dice); });
    (CFG.SINONIMOS || []).forEach(function (g) { fuertes = fuertes.concat(g.dice); });
    Object.keys(CFG.COTIZA || {}).forEach(function (k) { fuertes.push(CFG.COTIZA[k].nombre); });
    fuertes = fuertes.concat(["tapa", "tapas", "vaso", "vasos", "precio", "envio", "logo", "serigrafia"]);
    var conocidas = DOCS.map(function (d) { return d.titulo + " " + d.cuerpo; });
    return CFG.corrector(fuertes, conocidas);
  })();

  function buscar(pregunta, k) {
    /* Sin repetidos: si la equivalencia agrega una palabra que la persona ya
       había escrito, no debe contar doble. */
    var qs = raices(expandir(pregunta)).filter(function (w, i, a) {
      return a.indexOf(w) === i;
    });
    if (!qs.length) return [];
    var nq = norm(pregunta);

    var puntuados = DOCS.map(function (d) {
      var s = 0;
      qs.forEach(function (w) {
        if (d._set[w]) s += d._set[w] * (IDF[w] || 1);
      });
      /* el nombre completo dentro de la pregunta es señal fuerte */
      if (nq.indexOf(norm(d.titulo)) > -1) s += 14;
      /* Lo que es el producto va en su primera palabra: quien escribe "vasos"
         quiere vasos, no "Tapa para vaso…". */
      if (d.tipo === "producto" && qs.indexOf(raiz(tokens(d.titulo)[0] || "")) > -1) s += 6;
      return { d: d, s: s / Math.sqrt(qs.length) };
    }).filter(function (x) { return x.s > 0; });

    puntuados.sort(function (a, b) { return b.s - a.s; });
    return puntuados.slice(0, k || 5);
  }

  /* ======================= carrito del visitante =======================
     Lo que ya marcó en la tienda vive en localStorage. El asistente lo lee para
     no preguntar de cero lo que la persona ya eligió. */

  var CARRITO_KEY = "greenova.carrito.v2";
  var TEL = "55 2260 1113";
  var CORREO = "ventas@greenovasc.com.mx";

  function carrito() {
    var lineas = [];
    try {
      var guardado = JSON.parse(localStorage.getItem(CARRITO_KEY) || "[]");
      if (!Array.isArray(guardado)) return lineas;
      guardado.forEach(function (l) {
        if (!l || !l.id || !l.qty) return;
        var p = PRODS.filter(function (x) { return x.id === l.id; })[0];
        if (p) lineas.push({ nombre: p.nombre, v: l.v || "", qty: l.qty, u: l.u });
      });
    } catch (e) { /* modo privado, o dato viejo que ya no parsea */ }
    return lineas;
  }

  function carritoTexto(lineas) {
    return lineas.map(function (l) {
      var cant = l.qty + (l.u === "paq" ? (l.qty === 1 ? " paquete de " : " paquetes de ")
                                        : (l.qty === 1 ? " caja de " : " cajas de "));
      return cant + l.nombre.toLowerCase() + (l.v ? " (" + l.v + ")" : "");
    }).join("; ");
  }

  /* Querer comprar no es una pregunta de catálogo: se contesta aquí, con lo que
     la persona ya trae, y sin mandarla a leer instrucciones. */
  var QUIERE_PEDIR = /\b(cotizar|cotizacion|cotizacon|cotizame|comprar|compro|pedido|pedir|ordenar|orden|carrito)\b/;

  function respuestaPedido(pregunta) {
    if (!QUIERE_PEDIR.test(norm(pregunta))) return null;
    var lineas = carrito();

    if (lineas.length) {
      return {
        texto: "En tu carrito llevas " + carritoTexto(lineas) + ". Envía tu pedido desde " +
               "la tienda y ventas te confirma la entrega. Si quieres adelantarlo o " +
               "sumar algo más, marca al " + TEL + " o escribe a " + CORREO + ".",
        fuente: "Tu carrito",
        enlace: "tienda.html",
        enlaceTexto: "Abrir mi carrito"
      };
    }

    return {
      texto: "Con gusto. ¿Qué productos necesitas y en qué medida? Por ejemplo: vaso de " +
             "papel de 12 oz, o contenedor kraft de 500 ml. Dime también cuántas cajas de " +
             "cada uno y armamos la lista. Si prefieres hablarlo, marca al " + TEL +
             " o escribe a " + CORREO + ".",
      fuente: "Cotización",
      enlaceTexto: "Ver el catálogo",
      enlace: "tienda.html"
    };
  }

  /* Un vendedor no dice "4 oz" cuando el vaso existe en seis medidas: dice el
     rango. Si todas las variantes comparten medida (mismo tamaño, distinto
     color), con una basta. */
  function medida(p) {
    if (!p.v || !p.v.length) return "";
    var a = p.v[0].split("\u00b7")[0].trim();
    var b = p.v[p.v.length - 1].split("\u00b7")[0].trim();
    if (p.v.length === 1 || a === b) return a;

    /* El rango solo se arma cuando las dos puntas son medidas de verdad y van
       de menor a mayor. Con etiquetas como "Chica" o "Modelo 8A" un rango sale
       absurdo ("de Chica a A medida"), así que ahí se dice cuántas hay. */
    var na = parseFloat(a), nb = parseFloat(b);
    var sonMedidas = /^\d/.test(a) && /^\d/.test(b) && !isNaN(na) && !isNaN(nb);
    if (sonMedidas && na < nb) return "de " + a + " a " + b;
    return p.v.length + " medidas";
  }

  /* ======================= recomendación por uso =======================
     Antes de buscar en el catálogo palabra por palabra, se revisa si la persona
     está describiendo su negocio o lo que va a servir ("vasos para helado",
     "tengo una heladería"). Ahí no hay que buscar: hay que recomendar, como lo
     haría un vendedor, con foto, medida y para qué sirve cada cosa. La tabla
     se edita en agente-criterios.js (GIROS y COTIZA). */

  function tarjetaDe(r) {
    if (r.cotiza) {
      var c = (CFG.COTIZA || {})[r.cotiza];
      if (!c) return null;
      var fc = CFG.fotoUso(r.cotiza);
      return {
        titulo: c.nombre, medida: c.v, por: r.por, cotiza: true,
        img: fc ? fc.src : "assets/prod/" + c.img + ".webp",
        enlace: "tienda.html?pide=" + encodeURIComponent(c.pide)
      };
    }
    var p = PRODS.filter(function (x) { return x.id === r.id; })[0];
    if (!p) return null;
    var k = CFG.medidaDe(p, r.v);
    var t = (p.venta && p.venta.tam && p.venta.tam[k]) || {};
    var f = CFG.fotoUso(p.id, p.v[k]);
    return {
      titulo: p.nombre, medida: r.v, por: r.por, cotiza: !tienePrecio(p),
      img: f ? f.src : "assets/prod/" + (t.img || p.img) + ".webp",
      enlace: "producto.html?id=" + encodeURIComponent(p.id) + "&v=" + k
    };
  }

  function respuestaGiro(pregunta) {
    var giro = CFG.usoDe ? CFG.usoDe(pregunta, true) : null;
    if (!giro) return null;

    var tarjetas = giro.recs.map(tarjetaDe).filter(Boolean);
    if (!tarjetas.length) return null;
    var enTienda = tarjetas.some(function (x) { return !x.cotiza; });
    var cotiza = tarjetas.some(function (x) { return x.cotiza; });

    return {
      texto: giro.intro,
      tarjetas: tarjetas,
      pie: (enTienda ? "Lo de la tienda se compra por paquete o por caja. " : "") +
           (cotiza ? "Lo que dice «se cotiza» lo pides con tu lista. " : "") +
           "¿Cuántos necesitas de cada uno? También puedes marcar al " + TEL + ".",
      /* Para la IA, si la plática sigue: la misma recomendación en palabras. */
      memoria: giro.intro + " " + tarjetas.map(function (x) {
        return minus(x.titulo) + " " + x.medida + (x.cotiza ? ", se cotiza" : "") + " (" + x.por + ")";
      }).join("; "),
      fuente: "Recomendación · " + giro.nombre,
      enlace: enTienda ? "tienda.html?q=" + encodeURIComponent(giro.dice[0]) : null,
      enlaceTexto: "Verlo todo en la tienda"
    };
  }

  /* ======================= respuesta directa del RAG =======================
     Solo contesta sola cuando gana con holgura: el primer resultado tiene que
     superar un piso y sacarle ventaja clara al segundo. Si no, va a la IA. */

  var PISO = 9;
  var VENTAJA = 1.45;

  function respuestaLocal(pregunta, hits) {
    if (!hits.length) return null;
    var top = hits[0];
    if (top.s < PISO) return null;
    if (hits[1] && top.s < hits[1].s * VENTAJA) return null;

    /* el precio depende de la medida: esa respuesta la arma la IA con el catálogo */
    if (/\b(precio|precios|cuesta|cuestan|costo|cotiza|barato|caro|\$)\b/.test(norm(pregunta))) return null;

    var d = top.d;
    if (d.tipo === "hecho") {
      return { texto: d.cuerpo, fuente: d.titulo };
    }

    var p = d.prod;
    var partes = [p.nombre + ". " + p.desc];
    partes.push("Medidas: " + p.v.join(" · ") + ".");
    partes.push(tienePrecio(p)
      ? "Se compra por paquete o por caja. Pedido mínimo: " + minimoTexto(p) + "."
      : "Se cotiza: en su ficha está el botón «Pedir cotización».");
    return {
      texto: partes.join(" "),
      fuente: "Catálogo",
      enlace: d.enlace,
      enlaceTexto: "Verlo en la tienda"
    };
  }

  /* ======================= qué tapa le queda =======================
     "¿Qué tapa va con el vaso de 12 oz?": la tapa se elige por la boca del
     vaso. Se buscan los vasos de esas onzas, sus bocas, y las tapas de su
     misma familia con esa boca. */
  var FAMILIA_TAPAS = { "vasos-papel": "tapas-papel", "vasos-pet": "tapas-pet" };

  function respuestaTapa(pregunta) {
    var n = norm(pregunta);
    if (!/\btapa/.test(n) || PIDE_PRECIO.test(n)) return null;
    var oz = (n.match(/(\d+)\s*(?:oz|onzas?)\b/) || [])[1];
    if (!oz) return null;
    var soloPet = /\b(pet|plastico|transparente|frio|fria|frappe|pp)\b/.test(n);
    var soloPapel = /\b(papel|cafe|caliente|kraft)\b/.test(n) && !soloPet;

    var bocas = {};   // familia de tapas -> { boca: true }
    PRODS.forEach(function (p) {
      var fam = FAMILIA_TAPAS[p.cat];
      if (!fam || !p.venta) return;
      if ((soloPet && p.cat !== "vasos-pet") || (soloPapel && p.cat !== "vasos-papel")) return;
      p.v.forEach(function (v, k) {
        var b = p.venta.tam[k] && p.venta.tam[k].boca;
        if (b && new RegExp("(^|· )" + oz + " oz\\b").test(v)) (bocas[fam] = bocas[fam] || {})[b] = true;
      });
    });

    var lineas = [];
    [["tapas-papel", "vaso de papel"], ["tapas-pet", "vaso PET"]].forEach(function (f) {
      var bs = Object.keys(bocas[f[0]] || {}).map(Number).sort(function (a, b) { return a - b; });
      bs.forEach(function (b) {
        var tapas = PRODS.filter(function (tp) {
          return tp.cat === f[0] && tp.venta && tp.venta.tam.some(function (t) { return t.boca === b; });
        }).map(function (tp) { return minus(tp.nombre); });
        if (tapas.length) {
          lineas.push("En " + f[1] + " de " + oz + " oz con boca de " + b + " mm: " +
            (tapas.length > 1 ? tapas.slice(0, -1).join(", ") + " o " + tapas[tapas.length - 1] : tapas[0]) + ".");
        }
      });
    });
    if (!lineas.length) return null;

    return {
      texto: "La tapa va por la boca del vaso, no por las onzas.\n" + lineas.join("\n"),
      fuente: "Tapas por boca",
      enlace: "tienda.html?q=" + encodeURIComponent(oz + " oz"),
      enlaceTexto: "Ver vasos y tapas de " + oz + " oz"
    };
  }

  /* ======================= precios =======================
     "¿Cuánto cuesta el vaso de 12 oz?": si se dice la medida (onzas o boca),
     el precio sale directo del catálogo, sin esperar a la IA. Si no se dice,
     o no hay producto con esa medida, contesta la IA. */
  var PIDE_PRECIO = /\b(precio|precios|cuesta|cuestan|costo|costos|cuanto sale|cuanto salen|vale|valen)\b/;

  function respuestaPrecio(pregunta, hits) {
    var n = norm(pregunta);
    if (!PIDE_PRECIO.test(n)) return null;
    var oz = (n.match(/(\d+)\s*oz/) || n.match(/(\d+)\s*onzas?/) || [])[1];
    var boca = (n.match(/boca\s*(?:de\s*)?(\d+)/) || [])[1];
    if (!oz && !boca) return precioSinMedida(hits);

    var lineas = [];
    hits.forEach(function (h) {
      if (h.d.tipo !== "producto" || h.s < 4 || lineas.length >= 4) return;
      var p = h.d.prod, tam = (p.venta && p.venta.tam) || [];
      p.v.forEach(function (v, k) {
        if (lineas.length >= 4) return;
        var t = tam[k] || {};
        var pega = oz ? new RegExp("(^|· )" + oz + " oz\\b").test(v) : String(t.boca) === boca;
        if (!pega) return;
        var partes = [];
        if (t.paq && t.pPaq != null) partes.push("paquete de " + t.paq.toLocaleString("es-MX") + " pzs " + pesos(t.pPaq));
        if (t.caja && t.pCaja != null) partes.push("caja de " + t.caja.toLocaleString("es-MX") + " pzs " + pesos(t.pCaja));
        lineas.push(p.nombre + " (" + v + "): " + (partes.length ? partes.join(" · ") : "se cotiza") + ".");
      });
    });
    if (!lineas.length) return null;

    return {
      texto: lineas.join("\n") + "\nPrecios con IVA incluido. ¿De cuál necesitas y cuántos?",
      fuente: "Precios del catálogo",
      enlace: "tienda.html?q=" + encodeURIComponent((oz ? oz + " oz" : "boca " + boca)),
      enlaceTexto: "Verlos en la tienda"
    };
  }

  /* Sin medida: si el producto se cotiza, se dice; si no, el rango de precios
     de sus medidas y la pregunta de cuál necesita. */
  function precioSinMedida(hits) {
    var top = hits.filter(function (h) { return h.d.tipo === "producto" && h.s >= 4.5; });
    if (!top.length) return null;
    var p = top[0].d.prod;
    if (!tienePrecio(p)) {
      var familia = top.filter(function (h) { return h.d.prod.cat === p.cat && !tienePrecio(h.d.prod); })
        .map(function (h) { return minus(h.d.prod.nombre); });
      var quienes = familia.length > 1 ? familia.slice(0, -1).join(", ") + " y " + familia[familia.length - 1] : minus(p.nombre);
      return {
        texto: quienes.charAt(0).toUpperCase() + quienes.slice(1) +
               " no tienen precio en línea: se cotizan. En su ficha está el botón «Pedir cotización»; dinos cuántas cajas " +
               "necesitas y ventas te manda precio y tiempo de entrega. También al " + TEL + ".",
        fuente: "Se cotiza",
        enlace: "producto.html?id=" + encodeURIComponent(p.id),
        enlaceTexto: "Pedir cotización"
      };
    }
    var tam = p.venta.tam, filas = [];
    p.v.forEach(function (v, k) {
      var t = tam[k] || {};
      if (t.paq && t.pPaq != null) filas.push({ v: v.split(" · ")[0], paq: t.pPaq, caja: t.caja && t.pCaja != null ? t.pCaja : null });
    });
    if (!filas.length) return null;
    if (filas.length === 1) {
      return {
        texto: p.nombre + " (" + filas[0].v + "): paquete " + pesos(filas[0].paq) +
               (filas[0].caja != null ? " · caja " + pesos(filas[0].caja) : "") + ". Precios con IVA incluido.",
        fuente: "Precios del catálogo",
        enlace: "producto.html?id=" + encodeURIComponent(p.id),
        enlaceTexto: "Verlo en la tienda"
      };
    }
    var paqs = filas.map(function (f) { return f.paq; });
    var cajas = filas.map(function (f) { return f.caja; }).filter(function (c) { return c != null; });
    function rango(xs) {
      var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
      return lo === hi ? "cuesta " + pesos(lo) : "va de " + pesos(lo) + " a " + pesos(hi);
    }
    var cuales = medida(p);
    if (/medidas$/.test(cuales) && p.v.length <= 3) cuales = p.v.map(function (v) { return v.split(" · ")[0]; }).join(" o ");
    return {
      texto: "El paquete de " + minus(p.nombre) + " " + rango(paqs) +
             (cajas.length ? " y la caja " + rango(cajas) : "") + ", según la medida (" + cuales + ")." +
             " Precios con IVA incluido. ¿De qué medida lo necesitas?",
      fuente: "Precios del catálogo",
      enlace: "producto.html?id=" + encodeURIComponent(p.id),
      enlaceTexto: "Ver todas las medidas"
    };
  }

  /* Si la búsqueda encontró varios productos pero ninguno gana con holgura, un
     buscador se rinde y un vendedor enseña las opciones. Esto último es lo que
     hace falta: evita mandar a la IA (y al mensaje de "no lo tengo confirmado")
     preguntas que el catálogo sí puede responder. */

  var PISO_LISTA = 4.5;

  function respuestaCatalogo(pregunta, hits) {
    if (/\b(precio|precios|cuesta|cuestan|costo|barato|caro)\b/.test(norm(pregunta))) return null;

    var prods = hits.filter(function (h) {
      return h.d.tipo === "producto" && h.s >= PISO_LISTA;
    });
    if (prods.length < 2) return null;

    /* Solo la familia del primer resultado: si alguien pregunta por vasos de
       café, mezclarle tapas y vasos fríos confunde en vez de ayudar. */
    var familia = prods[0].d.prod.cat;
    prods = prods.filter(function (h) { return h.d.prod.cat === familia; }).slice(0, 4);
    if (prods.length < 2) return null;

    var lista = prods.map(function (h) {
      var p = h.d.prod;
      return minus(p.nombre) + (medida(p) ? " (" + medida(p) + ")" : "");
    });

    return {
      texto: "Para eso te sirven " + lista.slice(0, -1).join(", ") + " y " +
             lista[lista.length - 1] + ". Dime cuál te late y de qué medida, y " +
             "te armo la lista para cotizar.",
      fuente: "Catálogo",
      enlace: "tienda.html?cat=" + prods[0].d.prod.cat,
      enlaceTexto: "Ver en la tienda"
    };
  }

  /* ======================= interfaz ======================= */

  var abierto = false, pensando = false, historial = [];

  var host = document.createElement("div");
  host.className = "agente";
  host.innerHTML =
    '<button class="agente__lanzador" id="ag-abrir" aria-expanded="false" aria-controls="ag-panel">' +
      '<svg class="ico" aria-hidden="true"><use href="#i-sparkle"></use></svg>' +
      '<span>Pregúntale al asistente</span>' +
    '</button>' +
    '<section class="agente__panel" id="ag-panel" aria-label="Asistente de GreeNova" hidden>' +
      '<header class="agente__head">' +
        '<div><strong>Asistente GreeNova</strong><span>Catálogo, medidas y materiales</span></div>' +
        '<button class="agente__cerrar" id="ag-cerrar" aria-label="Cerrar el asistente">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg></button>' +
      '</header>' +
      '<div class="agente__hilo" id="ag-hilo" role="log" aria-live="polite"></div>' +
      '<div class="agente__sug" id="ag-sug"></div>' +
      '<form class="agente__form" id="ag-form">' +
        '<input id="ag-input" type="text" autocomplete="off" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta">' +
        '<button type="submit" aria-label="Enviar">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button>' +
      '</form>' +
      '<p class="agente__pie">Respuestas basadas en el catálogo 2026. Para precios y pedidos, ventas te cotiza.</p>' +
    '</section>';
  document.body.appendChild(host);

  var $ = function (id) { return document.getElementById(id); };
  var hilo = $("ag-hilo");

  function burbuja(quien, texto, extra) {
    var el = document.createElement("div");
    el.className = "ag-msg ag-msg--" + quien;
    var p = document.createElement("p");
    p.textContent = texto;
    el.appendChild(p);
    if (extra && extra.tarjetas) {
      el.classList.add("ag-msg--recs");
      var ul = document.createElement("ul");
      ul.className = "ag-recs";
      extra.tarjetas.forEach(function (x) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "ag-rec";
        a.href = x.enlace;
        var img = document.createElement("img");
        img.src = x.img; img.alt = ""; img.width = 56; img.height = 56;
        img.loading = "lazy"; img.decoding = "async";
        var txt = document.createElement("span");
        txt.className = "ag-rec__txt";
        var b = document.createElement("b");
        b.textContent = x.titulo;
        var m = document.createElement("span");
        m.className = "ag-rec__medida";
        m.textContent = x.medida + (x.cotiza ? " · se cotiza" : "");
        var por = document.createElement("span");
        por.className = "ag-rec__por";
        por.textContent = x.por;
        txt.appendChild(b); txt.appendChild(m); txt.appendChild(por);
        a.appendChild(img); a.appendChild(txt);
        li.appendChild(a);
        ul.appendChild(li);
      });
      el.appendChild(ul);
    }
    if (extra && extra.pie) {
      var pie = document.createElement("p");
      pie.textContent = extra.pie;
      el.appendChild(pie);
    }
    if (extra && extra.enlace) {
      var a = document.createElement("a");
      a.href = extra.enlace;
      a.className = "ag-msg__link";
      a.textContent = extra.enlaceTexto || "Ver más";
      el.appendChild(a);
    }
    if (extra && extra.fuente) {
      var f = document.createElement("span");
      f.className = "ag-msg__fuente";
      f.textContent = extra.fuente;
      el.appendChild(f);
    }
    hilo.appendChild(el);
    /* Una recomendación con tarjetas es más alta que el chat: se deja a la
       vista desde su primera línea, no desde el final. */
    if (extra && extra.tarjetas) {
      hilo.scrollTop += el.getBoundingClientRect().top - hilo.getBoundingClientRect().top - 12;
    } else {
      hilo.scrollTop = hilo.scrollHeight;
    }
    return p;
  }

  function pintarSugerencias() {
    var box = $("ag-sug");
    box.innerHTML = CFG.SUGERENCIAS.map(function (s) {
      return '<button type="button">' + s + "</button>";
    }).join("");
    box.hidden = false;
  }

  function saludo() {
    if (hilo.childElementCount) return;
    burbuja("bot", "Hola. Te ayudo con medidas, materiales y qué producto te sirve. ¿Qué buscas?");
    pintarSugerencias();
  }

  /* ======================= envío ======================= */

  function preguntar(texto) {
    if (pensando || !texto.trim()) return;
    $("ag-sug").hidden = true;
    burbuja("yo", texto);
    historial.push({ role: "user", content: texto });

    /* De aquí en adelante se trabaja con la pregunta ya corregida; a la IA
       le llega la original y, aparte, cómo se entendió. */
    var original = texto;
    texto = corrige(texto);

    var pedido = respuestaPedido(texto);
    if (pedido) {
      burbuja("bot", pedido.texto, pedido);
      historial.push({ role: "assistant", content: pedido.texto });
      return;
    }

    /* Primero lo concreto (qué tapa, cuánto cuesta, con onzas): una pregunta
       así no se contesta con la lista de un giro aunque diga "café". */
    var hits = buscar(texto, 6);

    var tapa = respuestaTapa(texto);
    if (tapa) {
      burbuja("bot", tapa.texto, tapa);
      historial.push({ role: "assistant", content: tapa.texto });
      return;
    }

    var precio = respuestaPrecio(texto, hits);
    if (precio) {
      burbuja("bot", precio.texto, precio);
      historial.push({ role: "assistant", content: precio.texto });
      return;
    }

    var giro = respuestaGiro(texto);
    if (giro) {
      burbuja("bot", giro.texto, giro);
      historial.push({ role: "assistant", content: giro.memoria });
      return;
    }

    var local = respuestaLocal(texto, hits);

    if (local) {
      burbuja("bot", local.texto, local);
      historial.push({ role: "assistant", content: local.texto });
      return;
    }
    var catalogo = respuestaCatalogo(texto, hits);
    if (catalogo) {
      burbuja("bot", catalogo.texto, catalogo);
      historial.push({ role: "assistant", content: catalogo.texto });
      return;
    }

    consultarIA(original, hits, texto);
  }

  function consultarIA(texto, hits, entendida) {
    pensando = true;
    var el = burbuja("bot", "");
    el.parentElement.dataset.cargando = "true";
    el.innerHTML = '<i class="ag-dot"></i><i class="ag-dot"></i><i class="ag-dot"></i>';

    var contexto = hits.map(function (h) {
      return "## " + h.d.titulo + "\n" + h.d.cuerpo;
    }).join("\n\n");

    /* Lo que la persona ya eligió en la tienda, para que la IA lo retome en
       vez de preguntar otra vez qué quiere. */
    if (entendida && entendida !== norm(texto)) {
      contexto += "\n\n## LA PREGUNTA, SIN FALTAS DE ORTOGRAFÍA\n" + entendida;
    }

    var lineas = carrito();
    if (lineas.length) {
      contexto += "\n\n## CARRITO DEL VISITANTE\n" + carritoTexto(lineas) +
                  ".\nLos precios de la tienda ya incluyen IVA.";
    }

    fetch(CFG.ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pregunta: texto,
        contexto: contexto,
        criterios: CRITERIOS_IA,
        historial: historial.slice(-8)
      })
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      if (!r.body) throw new Error("sin stream");

      el.textContent = "";
      el.parentElement.removeAttribute("data-cargando");

      var lector = r.body.getReader();
      var dec = new TextDecoder();
      var buf = "", salida = "";

      return (function leer() {
        return lector.read().then(function (res) {
          if (res.done) {
            historial.push({ role: "assistant", content: salida });
            return;
          }
          buf += dec.decode(res.value, { stream: true });
          var lineas = buf.split("\n");
          buf = lineas.pop();
          lineas.forEach(function (l) {
            if (l.indexOf("data: ") !== 0) return;
            var payload = l.slice(6);
            if (payload === "[DONE]") return;
            try {
              var j = JSON.parse(payload);
              if (j.texto) { salida += j.texto; el.textContent = salida; hilo.scrollTop = hilo.scrollHeight; }
              if (j.error) { salida = CFG.SALIDA; el.textContent = salida; }
            } catch (e) { /* fragmento incompleto */ }
          });
          return leer();
        });
      })();
    }).catch(function () {
      /* Sin endpoint desplegado o sin red: se entrega lo mejor del RAG y el
         contacto de ventas, en vez de dejar al visitante sin respuesta. */
      el.parentElement.removeAttribute("data-cargando");
      var mejor = hits[0];
      if (mejor && mejor.s >= 4) {
        el.textContent = "Esto es lo más cercano que encontré: " + mejor.d.titulo + ". " +
          mejor.d.cuerpo + "\n\n" + CFG.SALIDA;
      } else {
        el.textContent = CFG.SALIDA;
      }
      hilo.scrollTop = hilo.scrollHeight;
    }).then(function () {
      pensando = false;
      $("ag-input").focus();
    });
  }

  /* ======================= eventos ======================= */

  function setAbierto(v) {
    abierto = v;
    $("ag-panel").hidden = !v;
    $("ag-abrir").setAttribute("aria-expanded", String(v));
    host.dataset.abierto = String(v);
    if (v) { saludo(); setTimeout(function () { $("ag-input").focus(); }, reduce ? 0 : 260); }
  }

  $("ag-abrir").addEventListener("click", function () { setAbierto(!abierto); });
  $("ag-cerrar").addEventListener("click", function () { setAbierto(false); $("ag-abrir").focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && abierto) { setAbierto(false); $("ag-abrir").focus(); }
  });

  $("ag-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("ag-input").value;
    $("ag-input").value = "";
    preguntar(v);
  });

  $("ag-sug").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) preguntar(b.textContent);
  });

  /* Cualquier botón con data-agente abre el chat con esa pregunta ya hecha. */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-agente]");
    if (!b) return;
    e.preventDefault();
    setAbierto(true);
    preguntar(b.dataset.agente);
  });

  window.GNAgente = { abrir: function (q) { setAbierto(true); if (q) preguntar(q); } };
})();
