/* GreeNova SC - datos de facturación (facturacion.html).
   ===========================================================================
   Feedback final, pág. 9: titular, teléfono y correo, más razón social, RFC,
   domicilio fiscal, uso de CFDI, régimen fiscal y la Constancia de Situación
   Fiscal (no mayor a 3 meses). Gabriel (2026-09-27): el registro de cliente
   es la ventana chica; la facturación es otro apartado, esta página.
   Todo va a /api/cliente (main.py) y se ve en el panel, pestaña Clientes,
   junto con su historial de pedidos.
   =========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var form = $("registro-form");
  if (!form) return;

  var CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  var MAX_ARCHIVO = 1400000;
  var TIPOS = ["application/pdf", "image/jpeg", "image/png"];
  var estado = $("registro-estado");
  var boton = $("registro-enviar");
  var factura = { checked: true };   /* aquí siempre se factura */

  /* Si ya se registró antes (ventana de bienvenida o este formulario), se
     llena con lo que dejó. */
  try {
    var d = JSON.parse(localStorage.getItem("greenova.registro") || "null");
    if (d) {
      [["r-titular", d.nombre], ["r-negocio", d.negocio], ["r-correo", d.correo], ["r-tel", d.telefono]]
        .forEach(function (c) { if (c[1] && !$(c[0]).value) $(c[0]).value = c[1]; });
    }
  } catch (e) { /* modo privado */ }

  $("r-rfc").addEventListener("input", function () {
    var pos = this.selectionStart;
    this.value = this.value.toUpperCase().replace(/\s/g, "");
    try { this.setSelectionRange(pos, pos); } catch (e) { /* type sin selección */ }
  });

  function error(id, msg) {
    var el = $(id);
    var campo = el.closest(".field");
    if (campo) campo.dataset.invalid = msg ? "true" : "false";
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    var slot = form.querySelector('[data-err="' + id + '"]');
    if (slot) slot.textContent = msg || "";
    return !msg;
  }

  function hace(fecha) {
    var d = new Date(fecha + "T12:00:00");
    return isNaN(d) ? null : Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  function valida() {
    var ok = true;
    var titular = $("r-titular").value.trim();
    var tel = $("r-tel").value.replace(/\D/g, "");
    ok = error("r-titular", titular.split(/\s+/).length >= 2 ? "" : "Escribe nombres y apellidos.") && ok;
    ok = error("r-tel", tel.length >= 10 && tel.length <= 15 ? "" : "Escribe un teléfono de 10 dígitos.") && ok;
    ok = error("r-correo", CORREO.test($("r-correo").value.trim()) ? "" : "Escribe un correo válido (con @).") && ok;
    if (factura.checked) {
      var archivo = $("r-csf").files[0];
      var dias = hace($("r-csf-fecha").value);
      ok = error("r-razon", $("r-razon").value.trim().length >= 2 ? "" : "Escribe el nombre o la razón social.") && ok;
      ok = error("r-rfc", RFC.test($("r-rfc").value.trim()) ? "" : "Revisa el RFC (12 o 13 caracteres).") && ok;
      ok = error("r-domicilio", /\b\d{5}\b/.test($("r-domicilio").value) ? "" : "Incluye el código postal (5 dígitos).") && ok;
      ok = error("r-cfdi", $("r-cfdi").value ? "" : "Elige el uso de CFDI.") && ok;
      ok = error("r-regimen", $("r-regimen").value ? "" : "Elige el régimen fiscal.") && ok;
      ok = error("r-csf", !archivo ? "Adjunta tu constancia." :
        TIPOS.indexOf(archivo.type) === -1 ? "Debe ser PDF, JPG o PNG." :
        archivo.size > MAX_ARCHIVO ? "El archivo pesa más de 1.4 MB." : "") && ok;
      ok = error("r-csf-fecha", dias == null ? "Escribe la fecha de emisión." :
        dias < 0 ? "La fecha no puede ser futura." :
        dias > 92 ? "La constancia debe tener menos de 3 meses. Descarga una nueva del SAT." : "") && ok;
    }
    return ok;
  }

  function leeArchivo(archivo) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1] || ""); };
      r.onerror = reject;
      r.readAsDataURL(archivo);
    });
  }

  var MENSAJES = {
    titular: "Escribe nombres y apellidos del titular.",
    negocio: "Escribe el nombre del negocio.",
    correo_invalido: "Revisa el correo.",
    telefono_invalido: "Revisa el teléfono.",
    razon_social: "Revisa la razón social.",
    rfc: "Revisa el RFC.",
    domicilio_fiscal: "Incluye el código postal en el domicilio fiscal.",
    uso_cfdi: "Elige el uso de CFDI.",
    regimen_fiscal: "Elige el régimen fiscal.",
    csf_fecha: "Revisa la fecha de la constancia.",
    csf_vencida: "La constancia debe tener menos de 3 meses.",
    csf_archivo: "La constancia debe ser un PDF, JPG o PNG.",
    csf_grande: "La constancia pesa más de 1.4 MB."
  };

  form.addEventListener("input", function (e) {
    var campo = e.target.closest(".field");
    if (campo && campo.dataset.invalid === "true") error(e.target.id, "");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    estado.dataset.state = "";
    estado.textContent = "";
    if (!valida()) {
      estado.dataset.state = "error";
      estado.textContent = "Revisa los campos marcados.";
      var primero = form.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return;
    }
    boton.disabled = true;
    boton.querySelector(".btn__label").textContent = "Enviando…";

    var datos = {
      titular: $("r-titular").value.trim(), negocio: $("r-negocio").value.trim(),
      telefono: $("r-tel").value.trim(), correo: $("r-correo").value.trim(),
      factura: factura.checked, sitio_web: form.sitio_web.value
    };
    var archivo = $("r-csf").files[0];
    var listo = factura.checked
      ? leeArchivo(archivo).then(function (b64) {
          datos.razon_social = $("r-razon").value.trim();
          datos.rfc = $("r-rfc").value.trim();
          datos.domicilio_fiscal = $("r-domicilio").value.trim();
          datos.uso_cfdi = $("r-cfdi").value;
          datos.regimen_fiscal = $("r-regimen").value;
          datos.csf_fecha = $("r-csf-fecha").value;
          datos.csf = { nombre: archivo.name.replace(/\.[^.]+$/, ""), tipo: archivo.type, datos: b64 };
        })
      : Promise.resolve();

    listo.then(function () {
      return fetch("/api/cliente", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos)
      });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw { s: r.status, e: j.error };
        return j;
      });
    }).then(function () {
      try {
        localStorage.setItem("greenova.registro", JSON.stringify({
          nombre: datos.titular, negocio: datos.negocio, correo: datos.correo, telefono: datos.telefono }));
        localStorage.setItem("greenova.bienvenida.v1", JSON.stringify({ estado: "suscrito", t: Date.now() }));
      } catch (err) { /* modo privado */ }
      form.hidden = true;
      var ok = $("registro-listo");
      ok.hidden = false;
      ok.focus({ preventScroll: true });
      ok.scrollIntoView({ block: "center" });
    }).catch(function (x) {
      boton.disabled = false;
      boton.querySelector(".btn__label").textContent = "Guardar mis datos de facturación";
      estado.dataset.state = "error";
      estado.textContent = (x && MENSAJES[x.e]) ||
        (x && x.s === 429 ? "Demasiados intentos. Espera unos minutos." :
         "No pudimos guardar tu registro. Intenta de nuevo o escribe a ventas@greenovasc.com.mx");
    });
  });
})();
