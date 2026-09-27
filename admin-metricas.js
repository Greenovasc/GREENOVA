/* GreeNova SC - panel: pestañas de Métricas y Registros.
   ===========================================================================
   Métricas: quién entra, de dónde llega, qué mira y cuánta gente se registra.
   Registros: lo que la gente deja en la ventana de bienvenida (nombre, correo
   o WhatsApp y lo que necesita), con descarga para Excel.

   Usa la misma sesión que admin.js (sessionStorage) y pide los datos con el
   token en la cabecera, nunca en la URL. Todo lo que viene de visitantes se
   pinta como texto (textContent / esc), jamás como HTML.
   =========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var panel = $("panel");
  var registros = [];
  var cargado = { metricas: false, registros: false };

  function token() {
    try { return sessionStorage.getItem("greenova.panel.token") || ""; } catch (e) { return ""; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function num(n) { return Number(n || 0).toLocaleString("es-MX"); }
  function pide(url, opciones) {
    opciones = opciones || {};
    opciones.headers = Object.assign({ Authorization: "Bearer " + token() }, opciones.headers || {});
    return fetch(url, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) throw new Error("Tu sesión venció. Recarga la página y vuelve a entrar.");
        if (!r.ok) throw new Error(j.error === "sin_base" ? "No se pudo leer la base de datos. Revisa DATABASE_URL en Render." :
                                   "No se pudieron cargar los datos.");
        return j;
      });
    });
  }
  function aviso(id, texto, tipo) {
    var el = $(id);
    el.textContent = texto || "";
    el.dataset.tipo = tipo || "";
    el.hidden = !texto;
  }

  /* ---------------- ligas entre panel y editor ----------------
     Con ADMIN_RUTA el panel vive en /secreto y el editor en /secreto-editor. */
  var enlace = $("link-editor");
  if (enlace && !/\.html$/.test(location.pathname)) enlace.href = location.pathname.replace(/\/$/, "") + "-editor";

  /* ---------------- pestañas ---------------- */
  var VISTAS = ["catalogo", "metricas", "registros"];
  function muestra(vista) {
    VISTAS.forEach(function (v) {
      $("tab-" + v).setAttribute("aria-selected", String(v === vista));
      $("vista-" + v).hidden = v !== vista;
    });
    panel.dataset.vista = vista;
    try { sessionStorage.setItem("greenova.panel.vista", vista); } catch (e) {}
    if (vista === "metricas" && !cargado.metricas) cargaMetricas();
    if (vista === "registros" && !cargado.registros) cargaRegistros();
  }
  VISTAS.forEach(function (v) {
    $("tab-" + v).addEventListener("click", function () { muestra(v); });
  });
  $("tab-catalogo").parentNode.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var i = VISTAS.indexOf(panel.dataset.vista || "catalogo");
    var sig = VISTAS[(i + (e.key === "ArrowRight" ? 1 : VISTAS.length - 1)) % VISTAS.length];
    muestra(sig);
    $("tab-" + sig).focus();
  });

  /* Cuando admin.js abre el panel (al entrar o con sesión viva), se carga la
     cuenta de registros para el globito de la pestaña. */
  new MutationObserver(function () {
    if (panel.hidden) return;
    var ultima = "catalogo";
    try { ultima = sessionStorage.getItem("greenova.panel.vista") || "catalogo"; } catch (e) {}
    muestra(VISTAS.indexOf(ultima) >= 0 ? ultima : "catalogo");
    if (!cargado.registros) cargaRegistros();
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });

  /* ================================ métricas ================================ */

  var NOMBRES_PAGINA = { index: "Inicio", tienda: "Tienda", producto: "Ficha de producto", ofertas: "Ofertas" };
  var NOMBRES_EVENTO = {
    whatsapp: "Clic a WhatsApp", correo: "Clic a correo", telefono: "Clic a teléfono",
    cotizacion: "Formulario de cotización enviado", carrito_enviado: "Carrito enviado a cotizar"
  };

  function nombreProducto(id) {
    var P = (window.GREENOVA && window.GREENOVA.PRODUCTOS) || [];
    var p = P.filter(function (x) { return x.id === id; })[0];
    return p ? p.nombre : id;
  }

  function cargaMetricas() {
    cargado.metricas = true;
    aviso("met-aviso", "");
    $("met-hora").textContent = "Cargando…";
    pide("/api/admin/metricas?dias=" + encodeURIComponent($("met-dias").value))
      .then(pintaMetricas)
      .catch(function (e) { $("met-hora").textContent = ""; aviso("met-aviso", e.message, "error"); cargado.metricas = false; });
  }
  $("met-dias").addEventListener("change", cargaMetricas);
  $("met-actualizar").addEventListener("click", cargaMetricas);

  function sumaSerie(dias, campo) {
    return dias.reduce(function (s, d) { return s + (d[campo] || 0); }, 0);
  }

  function kpi(valor, etiqueta, nota) {
    return '<div class="met__kpi"><b>' + esc(valor) + "</b><span>" + esc(etiqueta) + "</span>" +
      (nota ? "<small>" + esc(nota) + "</small>" : "") + "</div>";
  }

  function tabla(titulo, filas, encabezados) {
    if (!filas.length) {
      return '<div class="met__tarjeta"><h2>' + esc(titulo) + '</h2><p class="met__nada">Todavía sin datos en este periodo.</p></div>';
    }
    var maximo = Math.max.apply(null, filas.map(function (f) { return f[1] || 0; })) || 1;
    return '<div class="met__tarjeta"><h2>' + esc(titulo) + '</h2><table class="met__tabla"><thead><tr>' +
      encabezados.map(function (h, i) { return "<th" + (i ? ' style="text-align:right"' : "") + ">" + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      filas.map(function (f) {
        return '<tr><td class="met__bar"><i style="width:' + Math.round(100 * (f[1] || 0) / maximo) + '%"></i><span>' +
          esc(f[0]) + "</span></td>" +
          f.slice(1).map(function (v) { return '<td class="num">' + esc(typeof v === "number" ? num(v) : v) + "</td>"; }).join("") +
          "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  function grafica(dias) {
    var W = 1000, H = 190, pad = 22, base = H - pad;
    var maxV = Math.max(1, Math.max.apply(null, dias.map(function (d) { return d.visitantes; })));
    var maxR = Math.max(1, Math.max.apply(null, dias.map(function (d) { return d.registros; })));
    var paso = (W - 8) / dias.length, ancho = Math.max(2, paso * 0.62);
    var barras = dias.map(function (d, i) {
      var x = 4 + i * paso + (paso - ancho) / 2;
      var hv = (base - 8) * d.visitantes / maxV;
      var hr = (base - 8) * 0.45 * d.registros / maxR;
      var fecha = d.dia.split("-").reverse().slice(0, 2).join("/");
      return '<g><title>' + fecha + ": " + d.visitantes + " visitantes, " + d.vistas + " páginas vistas, " +
        d.registros + " registros</title>" +
        '<rect x="' + x.toFixed(1) + '" y="' + (base - hv).toFixed(1) + '" width="' + ancho.toFixed(1) + '" height="' + Math.max(hv, d.visitantes ? 2 : 0).toFixed(1) + '" rx="3" style="fill:var(--sage-soft)"/>' +
        (d.registros ? '<rect x="' + (x + ancho * 0.2).toFixed(1) + '" y="' + (base - hr).toFixed(1) + '" width="' + (ancho * 0.6).toFixed(1) + '" height="' + Math.max(hr, 3).toFixed(1) + '" rx="2" style="fill:var(--green)"/>' : "") +
        "</g>";
    }).join("");
    var f = function (d) { return d.split("-").reverse().slice(0, 2).join("/"); };
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Visitantes y registros por día">' +
      '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" style="stroke:var(--line-strong)"/>' + barras +
      '<text x="4" y="' + (H - 4) + '" font-size="11" style="fill:var(--ink-3)">' + f(dias[0].dia) + "</text>" +
      '<text x="' + (W - 4) + '" y="' + (H - 4) + '" font-size="11" style="fill:var(--ink-3)" text-anchor="end">' + f(dias[dias.length - 1].dia) + "</text>" +
      '<text x="' + (W - 4) + '" y="12" font-size="11" style="fill:var(--ink-3)" text-anchor="end">máx. ' + maxV + " visitantes/día</text>" +
      "</svg>";
  }

  function pintaMetricas(m) {
    $("met-hora").textContent = "Actualizado " + new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    if (m.almacen === "temporal") {
      aviso("met-aviso", "Ojo: sin base de datos conectada, Render borra estas cifras y los registros cada vez que el servidor se duerme. Conecta DATABASE_URL (ver README).", "error");
    } else if (m.almacen === "local") {
      aviso("met-aviso", "Modo local: son datos de prueba de tu computadora, no los del sitio publicado.", "ok");
    }
    var d = m.dias || [];
    var vistas = sumaSerie(d, "vistas"), sesiones = sumaSerie(d, "sesiones"), regs = sumaSerie(d, "registros");
    var ev = m.eventos || {};
    var contactos = (ev.whatsapp || 0) + (ev.correo || 0) + (ev.telefono || 0);
    var cotiz = (ev.cotizacion || 0) + (ev.carrito_enviado || 0);
    var conv = m.visitantes_unicos ? (100 * regs / m.visitantes_unicos) : 0;
    $("met-kpis").innerHTML =
      kpi(num(m.visitantes_unicos), "Personas distintas", "Visitantes únicos del periodo") +
      kpi(num(sesiones), "Visitas", "Cada vez que alguien entra al sitio") +
      kpi(num(vistas), "Páginas vistas", sesiones ? (vistas / sesiones).toFixed(1) + " páginas por visita" : "") +
      kpi(num(regs), "Registros", num(m.registros_total) + " en total desde el inicio") +
      kpi(conv.toFixed(1) + " %", "Conversión", "Registros por cada 100 personas") +
      kpi(num(contactos + cotiz), "Contactos", num(cotiz) + " cotizaciones · " + num(ev.whatsapp || 0) + " WhatsApp");
    $("met-grafica").innerHTML = d.length ? grafica(d) : '<p class="met__nada">Sin datos.</p>';

    var disp = (m.dispositivos || []);
    var totalDisp = disp.reduce(function (s, x) { return s + x[1]; }, 0) || 1;
    var visto = ev.popup_visto || 0;
    var productos = Object.keys(m.productos || {}).map(function (id) {
      var p = m.productos[id];
      return [nombreProducto(id), p.ver || 0, p.click || 0, p.carrito || 0];
    }).sort(function (a, b) { return (b[1] + b[2] * 3 + b[3] * 5) - (a[1] + a[2] * 3 + a[3] * 5); }).slice(0, 15);

    $("met-tablas").innerHTML =
      tabla("De dónde llegan", (m.fuentes || []).map(function (f) { return [f[0], f[1]]; }), ["Fuente", "Visitas"]) +
      tabla("Páginas más vistas", (m.paginas || []).map(function (p) { return [NOMBRES_PAGINA[p[0]] || p[0], p[1]]; }), ["Página", "Vistas"]) +
      tabla("Celular o computadora", disp.map(function (x) {
        return [x[0] === "celular" ? "Celular" : "Computadora", x[1], Math.round(100 * x[1] / totalDisp) + " %"];
      }), ["Dispositivo", "Visitas", "%"]) +
      tabla("Ventana de bienvenida", visto ? [
        ["La vieron", visto], ["La cerraron sin registrarse", ev.popup_cerrado || 0],
        ["Se registraron", ev.registro || 0, Math.round(100 * (ev.registro || 0) / visto) + " %"]
      ].map(function (f) { return f.length === 2 ? f.concat([""]) : f; }) : [], ["", "Personas", "%"]) +
      tabla("Contacto y cotizaciones", Object.keys(NOMBRES_EVENTO).filter(function (k) { return ev[k]; })
        .map(function (k) { return [NOMBRES_EVENTO[k], ev[k]]; }), ["Acción", "Veces"]) +
      tabla("Productos que más interesan", productos, ["Producto", "Vistos", "Abiertos", "Al carrito"]);
  }

  /* Métricas en cero: para arrancar limpio (por ejemplo, después de pruebas).
     Los registros no se tocan. */
  $("met-reiniciar").addEventListener("click", function () {
    if (!window.confirm("¿Poner en cero todas las métricas (visitas, fuentes, dispositivos y productos)?\n\nLos registros de la ventana NO se borran. Esto no se puede deshacer.")) return;
    pide("/api/admin/metricas/reiniciar", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(function () { cargaMetricas(); aviso("met-aviso", "Listo: las métricas empiezan de cero desde ahora.", "ok"); })
      .catch(function (e) { aviso("met-aviso", e.message, "error"); });
  });

  /* Reiniciar el sitio: Render lo vuelve a publicar con lo último de GitHub. */
  $("btn-reiniciar").addEventListener("click", function () {
    if (!window.confirm("¿Reiniciar el sitio?\n\nRender lo vuelve a publicar con la última versión de GitHub. Tarda de 2 a 5 minutos; mientras tanto la página puede tardar en abrir.")) return;
    fetch("/api/admin/reiniciar-sitio", {
      method: "POST", headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" }, body: "{}"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        var m = r.ok ? ["Listo: Render está volviendo a publicar el sitio. En 2 a 5 minutos queda como nuevo.", "ok"] :
          r.status === 401 ? ["Tu sesión venció. Recarga la página y vuelve a entrar.", "error"] :
          j.error === "sin_gancho" ? ["Falta conectar el botón: agrega RENDER_DEPLOY_HOOK en Render (ver README). En tu computadora este botón no aplica.", "error"] :
          j.error === "espera" ? ["Ya se pidió hace un momento. Espera 2 minutos antes de volver a intentarlo.", "error"] :
          ["Render no respondió. Intenta de nuevo en un momento.", "error"];
        aviso("aviso", m[0], m[1]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }).catch(function () { aviso("aviso", "No se pudo contactar al servidor.", "error"); });
  });

  /* =============================== registros =============================== */

  function cargaRegistros() {
    cargado.registros = true;
    aviso("reg-aviso", "");
    pide("/api/admin/registros").then(function (j) {
      registros = j.registros || [];
      $("tab-registros-n").textContent = registros.length ? String(registros.length) : "";
      if (j.almacen === "temporal") {
        aviso("reg-aviso", "Ojo: sin base de datos conectada, Render borra los registros cada vez que el servidor se duerme. Conecta DATABASE_URL (ver README) y descarga el Excel mientras tanto.", "error");
      }
      pintaRegistros();
    }).catch(function (e) { aviso("reg-aviso", e.message, "error"); cargado.registros = false; });
  }
  $("reg-actualizar").addEventListener("click", cargaRegistros);
  $("reg-buscar").addEventListener("input", pintaRegistros);

  function fechaLocal(iso) {
    var d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function whatsapp(tel) {
    var t = String(tel || "").replace(/\D/g, "");
    return t.length === 10 ? "52" + t : t;
  }
  function telefonoBonito(tel) {
    var t = String(tel || "").replace(/\D/g, "");
    if (t.length === 10) return t.slice(0, 2) + " " + t.slice(2, 6) + " " + t.slice(6);
    if (t.length === 12 && t.indexOf("52") === 0) return "+52 " + t.slice(2, 4) + " " + t.slice(4, 8) + " " + t.slice(8);
    return t;
  }
  function filtrados() {
    var q = $("reg-buscar").value.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(function (r) {
      return [r.nombre, r.correo, r.telefono, r.necesidad, r.fuente].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function pintaRegistros() {
    var lista = filtrados();
    $("reg-resumen").textContent = registros.length ?
      (lista.length === registros.length ? registros.length + " registros" : lista.length + " de " + registros.length + " registros") : "";
    $("reg-vacio").hidden = registros.length > 0;
    $("reg-filas").innerHTML = lista.map(function (r) {
      var tel = r.telefono ? '<a href="https://wa.me/' + esc(whatsapp(r.telefono)) + '" target="_blank" rel="noopener noreferrer">' + esc(telefonoBonito(r.telefono)) + "</a>" : "—";
      var correo = r.correo ? '<a href="mailto:' + esc(r.correo) + '">' + esc(r.correo) + "</a>" : "—";
      return "<tr><td>" + esc(fechaLocal(r.fecha)) + "</td><td>" + esc(r.nombre) + "</td><td>" + correo +
        "</td><td>" + tel + "</td><td>" + esc(r.necesidad || "—") + "</td><td>" +
        esc([r.fuente, NOMBRES_PAGINA[r.pagina] || r.pagina].filter(Boolean).join(" · ")) + "</td>" +
        '<td><button class="met__borrar" type="button" data-borrar="' + esc(r.id) + '">Borrar</button></td></tr>';
    }).join("");
  }

  $("reg-filas").addEventListener("click", function (e) {
    var b = e.target.closest("[data-borrar]");
    if (!b) return;
    var id = Number(b.dataset.borrar);
    var r = registros.filter(function (x) { return x.id === id; })[0];
    if (!r || !window.confirm("¿Borrar el registro de " + r.nombre + "? No se puede deshacer.")) return;
    pide("/api/admin/registros/borrar", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id })
    }).then(function () {
      registros = registros.filter(function (x) { return x.id !== id; });
      $("tab-registros-n").textContent = registros.length ? String(registros.length) : "";
      pintaRegistros();
    }).catch(function (err) { aviso("reg-aviso", err.message, "error"); });
  });

  /* Excel abre bien un CSV con BOM (acentos) y comas. Las celdas que
     empiezan con = + - @ se neutralizan para que no corran como fórmula. */
  $("reg-csv").addEventListener("click", function () {
    var celda = function (v) {
      v = String(v == null ? "" : v);
      if (/^[=+\-@]/.test(v)) v = "'" + v;
      return '"' + v.replace(/"/g, '""') + '"';
    };
    var filas = [["Fecha", "Nombre", "Correo", "Teléfono", "Qué necesita", "Página", "Llegó de"]].concat(
      filtrados().map(function (r) {
        return [fechaLocal(r.fecha), r.nombre, r.correo, r.telefono, r.necesidad, NOMBRES_PAGINA[r.pagina] || r.pagina, r.fuente];
      }));
    var csv = "﻿" + filas.map(function (f) { return f.map(celda).join(","); }).join("\r\n");
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "registros-greenova-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
})();
