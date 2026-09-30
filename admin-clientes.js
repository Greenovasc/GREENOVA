/* GreeNova SC - panel: pestañas de Clientes y Pedidos.
   ===========================================================================
   Feedback final, pág. 8: "la página debe tener una base de datos donde
   tenga la información de los clientes e historial de compras".
   Clientes: lo que dejan en registro.html (datos y facturación, con su
   Constancia de Situación Fiscal para descargar) y cuánto han comprado.
   Pedidos: cada pedido enviado desde la tienda, con sus productos.

   Misma sesión que admin.js; los datos se piden con el token en la cabecera.
   Todo lo que escribieron los clientes se pinta escapado, nunca como HTML.
   =========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var clientes = [], pedidos = [];
  var cargado = { clientes: false, pedidos: false };

  function token() {
    try { return sessionStorage.getItem("greenova.panel.token") || ""; } catch (e) { return ""; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pesos(n) {
    return "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fecha(iso) {
    var d = new Date(iso);
    return isNaN(d) ? (iso || "") : d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  }
  function tel(t) {
    t = String(t || "").replace(/\D/g, "");
    return t.length === 10 ? t.slice(0, 2) + " " + t.slice(2, 6) + " " + t.slice(6) : t;
  }
  function aviso(id, texto, tipo) {
    var el = $(id);
    el.textContent = texto || "";
    el.dataset.tipo = tipo || "";
    el.hidden = !texto;
  }
  function pide(url, opciones) {
    opciones = opciones || {};
    opciones.headers = Object.assign({ Authorization: "Bearer " + token() }, opciones.headers || {});
    return fetch(url, opciones).then(function (r) {
      if (r.status === 401) throw new Error("Tu sesión venció. Recarga la página y vuelve a entrar.");
      return r;
    });
  }
  function pideJSON(url, opciones) {
    return pide(url, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error === "sin_base" ? "No se pudo leer la base de datos. Revisa DATABASE_URL en Render." :
                                   "No se pudieron cargar los datos.");
        return j;
      });
    });
  }
  /* Excel abre bien un CSV con BOM; lo que empieza con = + - @ se neutraliza. */
  function descargaCSV(nombre, filas) {
    var celda = function (v) {
      v = String(v == null ? "" : v);
      if (/^[=+\-@]/.test(v)) v = "'" + v;
      return '"' + v.replace(/"/g, '""') + '"';
    };
    var csv = "﻿" + filas.map(function (f) { return f.map(celda).join(","); }).join("\r\n");
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = nombre + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ============================ clientes ============================ */
  function cargaClientes() {
    aviso("cli-aviso", "");
    return pideJSON("/api/admin/clientes").then(function (j) {
      clientes = j.clientes || [];
      cargado.clientes = true;
      if (j.almacen === "temporal") {
        aviso("cli-aviso", "Sin base de datos permanente: estos clientes se borran cuando Render duerme el servicio. Configura DATABASE_URL.", "error");
      }
      pintaClientes();
    }).catch(function (e) { aviso("cli-aviso", e.message, "error"); });
  }

  function clientesFiltrados() {
    var q = $("cli-buscar").value.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(function (c) {
      return [c.titular, c.negocio, c.correo, c.telefono, c.rfc, c.razon_social].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function pintaClientes() {
    var lista = clientesFiltrados();
    $("cli-resumen").textContent = clientes.length ?
      (lista.length === clientes.length ? clientes.length + " clientes" : lista.length + " de " + clientes.length + " clientes") : "";
    $("cli-vacio").hidden = clientes.length > 0;
    $("cli-filas").innerHTML = lista.map(function (c) {
      return "<tr><td>" + esc(fecha(c.fecha)) + "</td><td>" + esc(c.titular) + "</td><td>" + esc(c.negocio) +
        '</td><td><a href="https://wa.me/52' + esc(String(c.telefono || "").replace(/\D/g, "").slice(-10)) +
        '" target="_blank" rel="noopener noreferrer">' + esc(tel(c.telefono)) + "</a>" +
        '</td><td><a href="mailto:' + esc(c.correo) + '">' + esc(c.correo) + "</a></td><td>" +
        (c.factura ? "Sí · " + esc(c.rfc) : "No") + "</td><td>" +
        (c.pedidos ? c.pedidos + (c.pedidos === 1 ? " pedido · " : " pedidos · ") + pesos(c.total) : "—") + "</td>" +
        '<td><button class="met__borrar" type="button" data-ver="' + esc(c.id) + '">Ver</button> ' +
        '<button class="met__borrar" type="button" data-borrar-cli="' + esc(c.id) + '">Borrar</button></td></tr>';
    }).join("");
  }

  function detalle(id) {
    var c = clientes.filter(function (x) { return x.id === id; })[0];
    var box = $("cli-detalle");
    if (!c) { box.hidden = true; return; }
    var dato = function (t, v) { return "<div><b>" + t + "</b>" + esc(v || "—") + "</div>"; };
    box.hidden = false;
    box.innerHTML =
      "<h3>" + esc(c.titular) + " · " + esc(c.negocio) + "</h3>" +
      '<div class="cli__datos">' +
        dato("Teléfono", tel(c.telefono)) + dato("Correo", c.correo) + dato("Registro", fecha(c.fecha)) +
        (c.factura ?
          dato("Razón social", c.razon_social) + dato("RFC", c.rfc) + dato("Domicilio fiscal", c.domicilio_fiscal) +
          dato("Uso de CFDI", c.uso_cfdi + (c.uso_cfdi_txt ? " · " + c.uso_cfdi_txt : "")) +
          dato("Régimen fiscal", c.regimen_fiscal + (c.regimen_txt ? " · " + c.regimen_txt : "")) +
          dato("Constancia emitida", c.csf_fecha)
          : dato("Factura", "No la pidió")) +
      "</div>" +
      (c.factura && c.csf_tipo ? '<p><button class="btn btn--ghost btn--sm" type="button" data-csf="' + esc(c.id) + '">' +
        '<span class="btn__label">Descargar constancia</span></button></p>' : "") +
      "<h3>Historial de compras</h3><div id=\"cli-pedidos\"><p class=\"adm__sub\">Cargando…</p></div>";
    box.scrollIntoView({ block: "start", behavior: "smooth" });
    pideJSON("/api/admin/pedidos?cliente=" + encodeURIComponent(id)).then(function (j) {
      var lista = j.pedidos || [];
      $("cli-pedidos").innerHTML = lista.length ? lista.map(pedidoHTML).join("") :
        '<p class="adm__sub">Todavía no tiene pedidos.</p>';
    }).catch(function (e) { $("cli-pedidos").textContent = e.message; });
  }

  $("cli-buscar").addEventListener("input", pintaClientes);
  $("cli-actualizar").addEventListener("click", cargaClientes);
  $("cli-csv").addEventListener("click", function () {
    descargaCSV("clientes-greenova", [["Fecha", "Titular", "Negocio", "Teléfono", "Correo", "Factura", "Razón social",
      "RFC", "Domicilio fiscal", "Uso de CFDI", "Régimen fiscal", "Constancia emitida", "Pedidos", "Total comprado"]]
      .concat(clientesFiltrados().map(function (c) {
        return [fecha(c.fecha), c.titular, c.negocio, c.telefono, c.correo, c.factura ? "Sí" : "No", c.razon_social,
                c.rfc, c.domicilio_fiscal, c.uso_cfdi, c.regimen_fiscal, c.csf_fecha, c.pedidos, c.total];
      })));
  });

  document.addEventListener("click", function (e) {
    var ver = e.target.closest("[data-ver]");
    if (ver) { detalle(Number(ver.dataset.ver)); return; }

    var csf = e.target.closest("[data-csf]");
    if (csf) {
      pide("/api/admin/clientes/" + encodeURIComponent(csf.dataset.csf) + "/constancia").then(function (r) {
        if (!r.ok) throw new Error("No se encontró la constancia.");
        var nombre = (/filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "") || [])[1] || "constancia";
        return r.blob().then(function (b) {
          var url = URL.createObjectURL(b);
          var a = document.createElement("a");
          a.href = url; a.download = nombre;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        });
      }).catch(function (err) { aviso("cli-aviso", err.message, "error"); });
      return;
    }

    var borrar = e.target.closest("[data-borrar-cli]");
    if (borrar) {
      var id = Number(borrar.dataset.borrarCli);
      var c = clientes.filter(function (x) { return x.id === id; })[0];
      if (!c || !window.confirm("¿Borrar al cliente " + c.titular + "? Sus pedidos se conservan. No se puede deshacer.")) return;
      pideJSON("/api/admin/clientes/borrar", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id })
      }).then(function () {
        clientes = clientes.filter(function (x) { return x.id !== id; });
        $("cli-detalle").hidden = true;
        pintaClientes();
      }).catch(function (err) { aviso("cli-aviso", err.message, "error"); });
    }
  });

  /* ============================ pedidos ============================ */
  function unidad(l) {
    return l.qty + " " + (l.u === "paq" ? (l.qty === 1 ? "paquete" : "paquetes") : (l.qty === 1 ? "caja" : "cajas"));
  }

  function pedidoHTML(p) {
    var lineas = p.lineas || [];
    return '<details class="ped"><summary><b>' + esc(p.folio || "#" + p.id) + "</b><span>" + esc(fecha(p.fecha)) +
      "</span><span>" + esc(p.nombre) + (p.negocio ? " · " + esc(p.negocio) : "") + "</span>" +
      '<span class="ped__total">' + (p.total ? pesos(p.total) : "Sin productos") + "</span></summary>" +
      '<div class="ped__cuerpo">' +
        '<p class="adm__sub">' + esc([p.correo, tel(p.telefono)].filter(Boolean).join(" · ")) + "</p>" +
        (lineas.length ?
          "<table><thead><tr><th>Producto</th><th>Medida</th><th>Cantidad</th><th>Piezas</th><th>Subtotal</th></tr></thead><tbody>" +
          lineas.map(function (l) {
            return "<tr><td>" + esc(l.nombre) + "</td><td>" + esc(l.v) + "</td><td>" + esc(unidad(l)) +
              '</td><td class="num">' + (l.piezas ? Number(l.piezas).toLocaleString("es-MX") : "") +
              '</td><td class="num">' + (l.subtotal != null ? pesos(l.subtotal) : "") + "</td></tr>";
          }).join("") + "</tbody></table>" : "") +
        (p.notas ? '<p class="ped__notas">' + esc(p.notas) + "</p>" : "") +
      "</div></details>";
  }

  function pedidosFiltrados() {
    var q = $("ped-buscar").value.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter(function (p) {
      return [p.folio, p.nombre, p.negocio, p.correo, p.telefono, p.notas,
              (p.lineas || []).map(function (l) { return l.nombre + " " + l.v; }).join(" ")]
        .join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function pintaPedidos() {
    var lista = pedidosFiltrados();
    var total = lista.reduce(function (s, p) { return s + (p.total || 0); }, 0);
    $("ped-resumen").textContent = pedidos.length ?
      lista.length + (lista.length === 1 ? " pedido" : " pedidos") + " · " + pesos(total) + " (IVA incluido)" : "";
    $("ped-vacio").hidden = pedidos.length > 0;
    $("ped-lista").innerHTML = lista.map(pedidoHTML).join("");
  }

  function cargaPedidos() {
    aviso("ped-aviso", "");
    return pideJSON("/api/admin/pedidos").then(function (j) {
      pedidos = j.pedidos || [];
      cargado.pedidos = true;
      pintaPedidos();
    }).catch(function (e) { aviso("ped-aviso", e.message, "error"); });
  }

  $("ped-buscar").addEventListener("input", pintaPedidos);
  $("ped-actualizar").addEventListener("click", cargaPedidos);
  $("ped-csv").addEventListener("click", function () {
    var filas = [["Folio", "Fecha", "Nombre", "Negocio", "Correo", "Teléfono", "Producto", "Medida", "Cantidad", "Piezas", "Subtotal", "Total del pedido", "Notas"]];
    pedidosFiltrados().forEach(function (p) {
      var lineas = p.lineas && p.lineas.length ? p.lineas : [{}];
      lineas.forEach(function (l) {
        filas.push([p.folio, fecha(p.fecha), p.nombre, p.negocio, p.correo, p.telefono, l.nombre || "", l.v || "",
                    l.qty ? unidad(l) : "", l.piezas || "", l.subtotal == null ? "" : l.subtotal, p.total, p.notas]);
      });
    });
    descargaCSV("pedidos-greenova", filas);
  });

  window.GNPanelClientes = {
    abre: function (vista) {
      if (vista === "clientes" && !cargado.clientes) cargaClientes();
      if (vista === "pedidos" && !cargado.pedidos) cargaPedidos();
    }
  };
})();
