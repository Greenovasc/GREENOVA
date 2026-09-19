/* GreeNova SC - catálogo de productos.
   ---------------------------------------------------------------------------
   Fuente: "Catálogo de Productos 2026" (PDF). Todas las medidas, modelos y
   piezas por caja salen de las tablas del catálogo. Nada aquí está inventado.

   PRECIOS: el catálogo no publica lista de precios (solo aparece $120 en la
   ficha del vaso de papel con registro SEDEMA, sin unidad). Por eso cada
   producto trae `precio: null` y la tienda muestra "Cotizar" en vez de importe.
   En cuanto exista lista, basta poner el número en `precio` (MXN por caja) y
   la tienda enciende sola los importes y el subtotal del carrito.

   VENTA EN LÍNEA (`venta`): campo opcional para los productos que entran al
   checkout por unidad, ya en cualquier material del catálogo (ver
   `LINEAS_VENTA` en main.py). Si un producto no lo trae, sigue funcionando
   exactamente como hoy (cotización por caja) — eso es lo correcto para
   productos hechos a medida (impresión, "a medida") o vendidos por peso, no
   por pieza: un precio fijo ahí sería falso.
     venta.linea = el material del producto (ver MATERIALES arriba)
     venta.tam   = un objeto { precio, stock, sku } por CADA posición de `v`,
                   en el mismo orden. precio en MXN por pieza (null = aún sin
                   precio para esa presentación puntual).

   PRECIOS DE VENTA EN LÍNEA — SON DE PRUEBA, NO REALES (generados el
   2026-09-16 y ampliados el 2026-09-17 para poder probar el checkout
   end-to-end mientras se define la lista real). NO se escriben a mano en
   este archivo: se editan en /admin.html → pestaña "Venta en línea", que
   guarda llamando a POST /api/admin/guardar en main.py — el servidor es
   quien reescribe este archivo (ver `render_catalogo()`). Cambiar un precio
   real nunca requiere tocar código de frontend ni de este archivo: solo el
   panel.
   --------------------------------------------------------------------------- */
window.GREENOVA = (function () {
  "use strict";

  var CATEGORIAS = [
    { id: "vasos-papel",  nombre: "Vasos de papel",    icono: "i-coffee" },
    { id: "vasos-frios",  nombre: "Vasos PET y PLA",   icono: "i-cup-cold" },
    { id: "tapas",        nombre: "Tapas",             icono: "i-circle-half" },
    { id: "contenedores", nombre: "Contenedores",      icono: "i-package" },
    { id: "bagazo",       nombre: "Bagazo y paja",     icono: "i-bowl-food" },
    { id: "accesorios",   nombre: "Accesorios",        icono: "i-fork-knife" },
    { id: "papel",        nombre: "Papel y bolsas",    icono: "i-shopping-bag" }
  ];

  /* Materiales -> etiqueta visible + color del chip */
  var MATERIALES = {
    papel:        "Papel",
    "papel-fsc":  "Papel FSC",
    pla:          "PLA compostable",
    pet:          "PET",
    kraft:        "Kraft",
    bagazo:       "Bagazo de caña",
    "paja-trigo": "Paja de trigo",
    fecula:       "Fécula de maíz",
    madera:       "Madera",
    tapioca:      "Tapioca",
    plastico:     "Plástico",
    carton:       "Cartón"
  };

  /* p = piezas por caja | v = variantes (medidas del catálogo) */
  var PRODUCTOS = [
    /* ---------------- vasos de papel ---------------- */
    { id: "vaso-papel-blanco", nombre: "Vaso de papel blanco", cat: "vasos-papel",
      mat: ["papel"], img: "vaso-papel-par", p: 1000, destacado: true, fotoPropia: true,
      desc: "Para bebidas calientes y frías. La línea base de barra, en seis medidas.",
      v: ["4 oz · boca 63 mm", "8 oz · boca 80 mm", "10 oz · boca 90 mm",
          "12 oz · boca 90 mm", "16 oz · boca 90 mm", "20 oz · boca 90 mm"],
      venta: { linea: "papel", tam: [
        { precio: 1.34, stock: 1200, sku: "VASO-PAPEL-BLANCO-4OZBOCA63MM" }, { precio: 1.78, stock: 800, sku: "VASO-PAPEL-BLANCO-8OZBOCA80MM" },
        { precio: 2.0, stock: 1500, sku: "VASO-PAPEL-BLANCO-10OZBOCA90MM" }, { precio: 2.22, stock: 600, sku: "VASO-PAPEL-BLANCO-12OZBOCA90MM" },
        { precio: 2.66, stock: 2000, sku: "VASO-PAPEL-BLANCO-16OZBOCA90MM" }, { precio: 3.1, stock: 950, sku: "VASO-PAPEL-BLANCO-20OZBOCA90MM" }
      ] } },

    { id: "vaso-papel-sedema", nombre: "Vaso de papel con registro SEDEMA", cat: "vasos-papel",
      mat: ["papel"], img: "vaso-papel-sedema", p: 1000, destacado: true, sello: "SEDEMA", fotoPropia: true,
      desc: "Registrado ante la Ciudad de México. El vaso que pide la normativa local.",
      v: ["4 oz · boca 63 mm", "8 oz · boca 80 mm", "10 oz · boca 90 mm",
          "12 oz · boca 90 mm", "16 oz · boca 90 mm", "20 oz · boca 90 mm"],
      venta: { linea: "papel", tam: [
        { precio: 1.34, stock: 1100, sku: "VASO-PAPEL-SEDEMA-4OZBOCA63MM" }, { precio: 1.78, stock: 700, sku: "VASO-PAPEL-SEDEMA-8OZBOCA80MM" },
        { precio: 2.0, stock: 1800, sku: "VASO-PAPEL-SEDEMA-10OZBOCA90MM" }, { precio: 2.22, stock: 500, sku: "VASO-PAPEL-SEDEMA-12OZBOCA90MM" },
        { precio: 2.66, stock: 1300, sku: "VASO-PAPEL-SEDEMA-16OZBOCA90MM" }, { precio: 3.1, stock: 900, sku: "VASO-PAPEL-SEDEMA-20OZBOCA90MM" }
      ] } },

    { id: "vaso-papel-compostable", nombre: "Vaso de papel compostable", cat: "vasos-papel",
      mat: ["papel", "pla"], img: "vaso-papel-compostable", p: 1000, fotoPropia: true,
      desc: "Recubrimiento en PLA. Se composta con la fracción orgánica.",
      v: ["8 oz · boca 80 mm", "10 oz · boca 90 mm", "12 oz · boca 90 mm",
          "16 oz · boca 90 mm", "20 oz · boca 90 mm"],
      venta: { linea: "papel", tam: [
        { precio: 1.78, stock: 1050, sku: "VASO-PAPEL-COMPOSTABLE-8OZBOCA80MM" }, { precio: 2.0, stock: 750, sku: "VASO-PAPEL-COMPOSTABLE-10OZBOCA90MM" },
        { precio: 2.22, stock: 1200, sku: "VASO-PAPEL-COMPOSTABLE-12OZBOCA90MM" }, { precio: 2.66, stock: 800, sku: "VASO-PAPEL-COMPOSTABLE-16OZBOCA90MM" },
        { precio: 3.1, stock: 1500, sku: "VASO-PAPEL-COMPOSTABLE-20OZBOCA90MM" }
      ] } },

    { id: "vaso-papel-impreso", nombre: "Vaso de papel con impresión", cat: "vasos-papel",
      mat: ["papel"], img: "vaso-papel-impreso", p: 1000, servicio: true,
      desc: "Tu logo impreso en serigrafía sobre el vaso. Producción bajo pedido.",
      v: ["8 oz · boca 80 mm", "12 oz · boca 90 mm", "16 oz · boca 90 mm", "20 oz · boca 90 mm"] },

    /* ---------------- vasos PET y PLA ---------------- */
    { id: "vaso-pet", nombre: "Vaso PET para bebida fría", cat: "vasos-frios",
      mat: ["pet"], img: "vaso-pet-vpa", destacado: true, fotoPropia: true,
      desc: "Transparencia que vende. El formato clásico para frappé, agua fresca y smoothie.",
      v: ["7 oz · boca 78 mm", "10 oz · boca 78 mm", "12 oz · boca 92 mm", "12 oz · boca 95 mm",
          "14 oz · boca 98 mm", "16 oz · boca 95 mm", "16 oz · boca 98 mm", "20 oz · boca 95 mm",
          "20 oz · boca 98 mm", "24 oz · boca 98 mm", "32 oz · boca 107 mm"],
      venta: { linea: "pet", tam: [
        { precio: 1.9, stock: 600, sku: "VASO-PET-7OZBOCA78MM" }, { precio: 2.2, stock: 2000, sku: "VASO-PET-10OZBOCA78MM" },
        { precio: 2.4, stock: 950, sku: "VASO-PET-12OZBOCA92MM" }, { precio: 2.4, stock: 1100, sku: "VASO-PET-12OZBOCA95MM" },
        { precio: 2.6, stock: 700, sku: "VASO-PET-14OZBOCA98MM" }, { precio: 2.8, stock: 1800, sku: "VASO-PET-16OZBOCA95MM" },
        { precio: 2.8, stock: 500, sku: "VASO-PET-16OZBOCA98MM" }, { precio: 3.2, stock: 1300, sku: "VASO-PET-20OZBOCA95MM" },
        { precio: 3.2, stock: 900, sku: "VASO-PET-20OZBOCA98MM" }, { precio: 3.6, stock: 1050, sku: "VASO-PET-24OZBOCA98MM" },
        { precio: 4.4, stock: 750, sku: "VASO-PET-32OZBOCA107MM" }
      ] } },

    { id: "vaso-pla", nombre: "Vaso PLA compostable para bebida fría", cat: "vasos-frios",
      mat: ["pla"], img: "vaso-pet-vpc", destacado: true,
      desc: "Mismo aspecto que el PET, hecho de ácido poliláctico. La opción compostable de la línea fría.",
      v: ["12 oz · boca 95 mm", "16 oz · boca 95 mm", "20 oz · boca 95 mm"],
      venta: { linea: "pla", tam: [ { precio: 2.6, stock: 900, sku: "VASO-PLA-12OZBOCA95MM" }, { precio: 3.0, stock: 700, sku: "VASO-PLA-16OZBOCA95MM" }, { precio: 3.5, stock: 550, sku: "VASO-PLA-20OZBOCA95MM" } ] } },

    { id: "vaso-pet-u", nombre: "Vaso PET-U de una sola pieza", cat: "vasos-frios",
      mat: ["pet"], img: "vaso-pet-vpu", fotoPropia: true,
      desc: "Cuerpo de una sola pieza, pared recta. Aguanta mejor el apilado.",
      v: ["12 oz · boca 90 mm", "16 oz · boca 90 mm", "24 oz · boca 90 mm"],
      venta: { linea: "pet", tam: [ { precio: 2.4, stock: 1200, sku: "VASO-PET-U-12OZBOCA90MM" }, { precio: 2.8, stock: 800, sku: "VASO-PET-U-16OZBOCA90MM" }, { precio: 3.6, stock: 1500, sku: "VASO-PET-U-24OZBOCA90MM" } ] } },

    { id: "vaso-pet-alto", nombre: "Vaso PET alto", cat: "vasos-frios",
      mat: ["pet"], img: "vaso-pet-vpb", fotoPropia: true,
      desc: "Perfil alto y esbelto para bebidas de especialidad.",
      v: ["16 oz · boca 95 mm", "20 oz · boca 95 mm", "24 oz · boca 98 mm", "32 oz · boca 107 mm"],
      venta: { linea: "pet", tam: [
        { precio: 2.8, stock: 600, sku: "VASO-PET-ALTO-16OZBOCA95MM" }, { precio: 3.2, stock: 2000, sku: "VASO-PET-ALTO-20OZBOCA95MM" },
        { precio: 3.6, stock: 950, sku: "VASO-PET-ALTO-24OZBOCA98MM" }, { precio: 4.4, stock: 1100, sku: "VASO-PET-ALTO-32OZBOCA107MM" }
      ] } },

    /* ---------------- tapas: bebida caliente ---------------- */
    { id: "tapa-4oz", nombre: "Tapa para vaso de 4 oz", cat: "tapas",
      mat: ["plastico"], img: "tapa-blanca-plana",
      desc: "Modelo 4A. Bebida caliente.", v: ["Modelo 4A"],
      venta: { linea: "plastico", tam: [ { precio: 0.9, stock: 1600, sku: "TAPA-4OZ-MODELO4A" } ] } },

    { id: "tapa-8oz-papel", nombre: "Tapa de papel para vaso de 8 oz", cat: "tapas",
      mat: ["papel"], img: "tapa-kraft-cafe",
      desc: "Bebida caliente. Cinco modelos según el estilo de bebedero.",
      v: ["Modelo 8A", "Modelo 8B", "Modelo 8C", "Modelo 8D", "Modelo 8G · papel"],
      venta: { linea: "papel", tam: [
        { precio: 1.6, stock: 700, sku: "TAPA-8OZ-PAPEL-MODELO8A" }, { precio: 1.6, stock: 1800, sku: "TAPA-8OZ-PAPEL-MODELO8B" },
        { precio: 1.6, stock: 500, sku: "TAPA-8OZ-PAPEL-MODELO8C" }, { precio: 1.6, stock: 1300, sku: "TAPA-8OZ-PAPEL-MODELO8D" },
        { precio: 1.6, stock: 900, sku: "TAPA-8OZ-PAPEL-MODELO8GPAPEL" }
      ] } },

    { id: "tapa-8oz-pla", nombre: "Tapa compostable PLA para vaso de 8 oz", cat: "tapas",
      mat: ["pla"], img: "tapa-blanca-solo", fotoPropia: true,
      desc: "Bebida caliente. Modelos compostables en ácido poliláctico.",
      v: ["Modelo 8E · PLA", "Modelo 8F · PLA"],
      venta: { linea: "pla", tam: [ { precio: 1.9, stock: 1000, sku: "TAPA-8OZ-PLA-MODELO8EPLA" }, { precio: 1.9, stock: 850, sku: "TAPA-8OZ-PLA-MODELO8FPLA" } ] } },

    { id: "tapa-1020-papel", nombre: "Tapa de papel para vaso de 10 a 20 oz", cat: "tapas",
      mat: ["papel"], img: "tapa-viajera-blanca", destacado: true,
      desc: "La tapa de mayor rotación: cubre 10, 12, 16 y 20 oz con la misma pieza.",
      v: ["Modelo TA", "Modelo TB", "Modelo TC", "Modelo TD",
          "Modelo TE", "Modelo TF", "Modelo TG", "Modelo TI · papel"],
      venta: { linea: "papel", tam: [
        { precio: 1.6, stock: 1050, sku: "TAPA-1020-PAPEL-MODELOTA" }, { precio: 1.6, stock: 750, sku: "TAPA-1020-PAPEL-MODELOTB" },
        { precio: 1.6, stock: 1200, sku: "TAPA-1020-PAPEL-MODELOTC" }, { precio: 1.6, stock: 800, sku: "TAPA-1020-PAPEL-MODELOTD" },
        { precio: 1.6, stock: 1500, sku: "TAPA-1020-PAPEL-MODELOTE" }, { precio: 1.6, stock: 600, sku: "TAPA-1020-PAPEL-MODELOTF" },
        { precio: 1.6, stock: 2000, sku: "TAPA-1020-PAPEL-MODELOTG" }, { precio: 1.6, stock: 950, sku: "TAPA-1020-PAPEL-MODELOTIPAPEL" }
      ] } },

    { id: "tapa-1020-pla", nombre: "Tapa compostable PLA para vaso de 10 a 20 oz", cat: "tapas",
      mat: ["pla"], img: "tapa-domo-blanca",
      desc: "Versión compostable de la tapa de mayor rotación.",
      v: ["Modelo TH · PLA", "Modelo TI · PLA"],
      venta: { linea: "pla", tam: [ { precio: 1.9, stock: 1100, sku: "TAPA-1020-PLA-MODELOTHPLA" }, { precio: 1.9, stock: 900, sku: "TAPA-1020-PLA-MODELOTIPLA" } ] } },

    { id: "tapa-viajera", nombre: "Tapa viajera con seguro", cat: "tapas",
      mat: ["plastico"], img: "tapa-viajera-negra", fotoPropia: true,
      desc: "Bebedero con tapón abatible. Para pedido para llevar y reparto.",
      v: ["10 a 20 oz · negra", "10 a 20 oz · blanca"],
      venta: { linea: "plastico", tam: [ { precio: 1.8, stock: 950, sku: "TAPA-VIAJERA-10A20OZNEGRA" }, { precio: 1.8, stock: 1050, sku: "TAPA-VIAJERA-10A20OZBLANCA" } ] } },

    { id: "tapa-domo-alto", nombre: "Tapa domo alto para bebida caliente", cat: "tapas",
      mat: ["plastico"], img: "tapa-blanca-domo-alto",
      desc: "Domo alto para crema batida y coberturas.",
      v: ["10 a 20 oz · blanca", "10 a 20 oz · negra"],
      venta: { linea: "plastico", tam: [ { precio: 1.9, stock: 800, sku: "TAPA-DOMO-ALTO-10A20OZBLANCA" }, { precio: 1.9, stock: 900, sku: "TAPA-DOMO-ALTO-10A20OZNEGRA" } ] } },

    /* ---------------- tapas: bebida fría ---------------- */
    { id: "tapa-fria-78", nombre: "Tapa para vaso frío de 78 mm", cat: "tapas",
      mat: ["pet"], img: "tapa-fria-plana",
      desc: "Diámetro 78 mm. Plana y domo.", v: ["Modelo PA", "Modelo PB"],
      venta: { linea: "pet", tam: [ { precio: 1.6, stock: 1100, sku: "TAPA-FRIA-78-MODELOPA" }, { precio: 1.6, stock: 700, sku: "TAPA-FRIA-78-MODELOPB" } ] } },

    { id: "tapa-fria-90", nombre: "Tapa para vaso frío de 90 mm", cat: "tapas",
      mat: ["pet"], img: "tapa-fria-plana-par", fotoPropia: true,
      desc: "Diámetro 90 mm, para la línea PET-U.",
      v: ["Modelo PA", "Modelo PB", "Modelo PC"],
      venta: { linea: "pet", tam: [ { precio: 1.6, stock: 1800, sku: "TAPA-FRIA-90-MODELOPA" }, { precio: 1.6, stock: 500, sku: "TAPA-FRIA-90-MODELOPB" }, { precio: 1.6, stock: 1300, sku: "TAPA-FRIA-90-MODELOPC" } ] } },

    { id: "tapa-fria-92", nombre: "Tapa para vaso frío de 92 mm", cat: "tapas",
      mat: ["pet"], img: "tapa-fria-plana-lisa",
      desc: "Diámetro 92 mm.", v: ["Modelo PA", "Modelo PB"],
      venta: { linea: "pet", tam: [ { precio: 1.6, stock: 900, sku: "TAPA-FRIA-92-MODELOPA" }, { precio: 1.6, stock: 1050, sku: "TAPA-FRIA-92-MODELOPB" } ] } },

    { id: "tapa-fria-95", nombre: "Tapa para vaso frío de 95 mm", cat: "tapas",
      mat: ["pet", "pla"], img: "tapa-fria-domo", destacado: true,
      desc: "Diámetro 95 mm. Incluye dos modelos compostables en PLA.",
      v: ["Modelo PA", "Modelo PB", "Modelo PC",
          "Modelo PA · compostable", "Modelo PB · compostable"],
      venta: { linea: "pet", tam: [
        { precio: 1.6, stock: 750, sku: "TAPA-FRIA-95-MODELOPA" }, { precio: 1.6, stock: 1200, sku: "TAPA-FRIA-95-MODELOPB" },
        { precio: 1.6, stock: 800, sku: "TAPA-FRIA-95-MODELOPC" }, { precio: 1.6, stock: 1500, sku: "TAPA-FRIA-95-MODELOPACOMPOSTABLE" },
        { precio: 1.6, stock: 600, sku: "TAPA-FRIA-95-MODELOPBCOMPOSTABLE" }
      ] } },

    { id: "tapa-fria-98", nombre: "Tapa para vaso frío de 98 mm", cat: "tapas",
      mat: ["pet"], img: "tapa-fria-plana-hoyo",
      desc: "Diámetro 98 mm. Siete modelos: plana, con hoyo, domo y domo alto.",
      v: ["Modelo PA", "Modelo PB", "Modelo PC", "Modelo PD",
          "Modelo PE", "Modelo PF", "Modelo PG"],
      venta: { linea: "pet", tam: [
        { precio: 1.6, stock: 2000, sku: "TAPA-FRIA-98-MODELOPA" }, { precio: 1.6, stock: 950, sku: "TAPA-FRIA-98-MODELOPB" },
        { precio: 1.6, stock: 1100, sku: "TAPA-FRIA-98-MODELOPC" }, { precio: 1.6, stock: 700, sku: "TAPA-FRIA-98-MODELOPD" },
        { precio: 1.6, stock: 1800, sku: "TAPA-FRIA-98-MODELOPE" }, { precio: 1.6, stock: 500, sku: "TAPA-FRIA-98-MODELOPF" },
        { precio: 1.6, stock: 1300, sku: "TAPA-FRIA-98-MODELOPG" }
      ] } },

    { id: "tapa-fria-107", nombre: "Tapa para vaso frío de 107 mm", cat: "tapas",
      mat: ["pet"], img: "tapa-fria-domo-alto",
      desc: "Diámetro 107 mm, para el vaso de 32 oz.", v: ["Modelo PA", "Modelo PB"],
      venta: { linea: "pet", tam: [ { precio: 1.6, stock: 900, sku: "TAPA-FRIA-107-MODELOPA" }, { precio: 1.6, stock: 1050, sku: "TAPA-FRIA-107-MODELOPB" } ] } },

    { id: "tapa-fria-domo-par", nombre: "Tapa domo para bebida fría", cat: "tapas",
      mat: ["pet"], img: "tapa-fria-domo-par",
      desc: "Domo sin hoyo, para bebidas con cobertura o topping.",
      v: ["95 mm", "98 mm", "107 mm"],
      venta: { linea: "pet", tam: [ { precio: 0.78, stock: 750, sku: "TAPA-FRIA-DOMO-PAR-95MM" }, { precio: 0.79, stock: 1200, sku: "TAPA-FRIA-DOMO-PAR-98MM" }, { precio: 0.83, stock: 800, sku: "TAPA-FRIA-DOMO-PAR-107MM" } ] } },

    /* ---------------- contenedores ---------------- */
    { id: "contenedor-kraft-rect", nombre: "Contenedor rectangular kraft", cat: "contenedores",
      mat: ["kraft"], img: "contenedor-kraft-rect", p: 300, destacado: true,
      desc: "Resiste alimento caliente y grasa sin perder la forma. El caballo de batalla del para llevar.",
      v: ["500 ml", "650 ml", "750 ml"],
      venta: { linea: "kraft", tam: [ { precio: 2.5, stock: 1500, sku: "CONTENEDOR-KRAFT-RECT-500ML" }, { precio: 2.8, stock: 600, sku: "CONTENEDOR-KRAFT-RECT-650ML" }, { precio: 3.0, stock: 2000, sku: "CONTENEDOR-KRAFT-RECT-750ML" } ] } },

    { id: "tapa-contenedor-kraft", nombre: "Tapa kraft para contenedor", cat: "contenedores",
      mat: ["kraft"], img: "tapa-perfil-kraft", p: 300,
      desc: "Genérica para los tres volúmenes de contenedor rectangular.", v: ["Genérica"],
      venta: { linea: "kraft", tam: [ { precio: 2.6, stock: 950, sku: "TAPA-CONTENEDOR-KRAFT-GENERICA" } ] } },

    { id: "tapa-contenedor-plastico", nombre: "Tapa de plástico para contenedor", cat: "contenedores",
      mat: ["plastico"], img: "tapa-fria-plana-lisa", p: 300,
      desc: "Tapa transparente. Deja ver el contenido en mostrador y reparto.", v: ["Genérica"],
      venta: { linea: "plastico", tam: [ { precio: 2.3, stock: 1000, sku: "TAPA-CONTENEDOR-PLASTICO-GENERICA" } ] } },

    { id: "contenedor-circular-kraft", nombre: "Contenedor circular kraft", cat: "contenedores",
      mat: ["kraft"], img: "contenedor-circular-kraft",
      desc: "Para sopas, ensaladas y bowls calientes. Con tapa a juego.",
      v: ["Chico", "Mediano", "Grande"],
      venta: { linea: "kraft", tam: [ { precio: 2.1, stock: 1100, sku: "CONTENEDOR-CIRCULAR-KRAFT-CHICO" }, { precio: 2.6, stock: 700, sku: "CONTENEDOR-CIRCULAR-KRAFT-MEDIANO" }, { precio: 3.1, stock: 1800, sku: "CONTENEDOR-CIRCULAR-KRAFT-GRANDE" } ] } },

    { id: "contenedor-kraft-redondo", nombre: "Contenedor kraft redondo con tapa", cat: "contenedores",
      mat: ["kraft"], img: "contenedor-kraft-redondo",
      desc: "Cuerpo y tapa en kraft. Apilable para exhibición.",
      v: ["Chico", "Mediano", "Grande"],
      venta: { linea: "kraft", tam: [ { precio: 2.1, stock: 500, sku: "CONTENEDOR-KRAFT-REDONDO-CHICO" }, { precio: 2.6, stock: 1300, sku: "CONTENEDOR-KRAFT-REDONDO-MEDIANO" }, { precio: 3.1, stock: 900, sku: "CONTENEDOR-KRAFT-REDONDO-GRANDE" } ] } },

    { id: "contenedor-papel-chino", nombre: "Contenedor de papel chino", cat: "contenedores",
      mat: ["kraft"], img: "contenedor-papel-chino",
      desc: "Cierre de solapas, sin tapa extra. Para arroz, pasta y salteados.",
      v: ["Chico", "Mediano", "Grande"],
      venta: { linea: "kraft", tam: [ { precio: 2.1, stock: 1050, sku: "CONTENEDOR-PAPEL-CHINO-CHICO" }, { precio: 2.6, stock: 750, sku: "CONTENEDOR-PAPEL-CHINO-MEDIANO" }, { precio: 3.1, stock: 1200, sku: "CONTENEDOR-PAPEL-CHINO-GRANDE" } ] } },

    { id: "contenedor-helado", nombre: "Contenedor de papel para helado", cat: "contenedores",
      mat: ["papel"], img: "contenedor-helado",
      desc: "Pared lisa, apto para congelación.", v: ["Chico", "Mediano", "Grande"],
      venta: { linea: "papel", tam: [ { precio: 1.9, stock: 1100, sku: "CONTENEDOR-HELADO-CHICO" }, { precio: 2.4, stock: 700, sku: "CONTENEDOR-HELADO-MEDIANO" }, { precio: 3.0, stock: 1400, sku: "CONTENEDOR-HELADO-GRANDE" } ] } },

    /* la foto es una caja blanca sobre fondo blanco: no se puede recortar,
       por eso va sobre placa (ver `placa` en la tarjeta) */
    { id: "caja-pizza", nombre: "Caja de pizza", cat: "contenedores",
      mat: ["carton"], img: "caja-pizza", placa: true,
      desc: "Cartón corrugado. Con o sin impresión de tu logo.",
      v: ["Personal", "Mediana", "Grande", "Familiar"],
      venta: { linea: "carton", tam: [ { precio: 3.2, stock: 700, sku: "CAJA-PIZZA-PERSONAL" }, { precio: 4.5, stock: 550, sku: "CAJA-PIZZA-MEDIANA" }, { precio: 5.8, stock: 480, sku: "CAJA-PIZZA-GRANDE" }, { precio: 7.2, stock: 350, sku: "CAJA-PIZZA-FAMILIAR" } ] } },

    { id: "caja-rebanada-pizza", nombre: "Contenedor para rebanada de pizza", cat: "contenedores",
      mat: ["kraft"], img: "caja-rebanada-pizza",
      desc: "Kraft natural, para venta por rebanada.", v: ["Estándar"],
      venta: { linea: "kraft", tam: [ { precio: 2.6, stock: 800, sku: "CAJA-REBANADA-PIZZA-ESTANDAR" } ] } },

    { id: "charola-kraft", nombre: "Charola kraft para papas", cat: "contenedores",
      mat: ["kraft"], img: "charola-kraft",
      desc: "Charola abierta para papas, boneless y frituras.",
      v: ["Chica", "Mediana", "Grande"],
      venta: { linea: "kraft", tam: [ { precio: 2.1, stock: 1500, sku: "CHAROLA-KRAFT-CHICA" }, { precio: 2.6, stock: 600, sku: "CHAROLA-KRAFT-MEDIANA" }, { precio: 3.1, stock: 2000, sku: "CHAROLA-KRAFT-GRANDE" } ] } },

    { id: "bowl-domo", nombre: "Bowl transparente con tapa domo", cat: "contenedores",
      mat: ["pet"], img: "bowl-domo",
      desc: "Para ensaladas, fruta y postres en barra fría.",
      v: ["Chico", "Mediano", "Grande"],
      venta: { linea: "pet", tam: [ { precio: 2.3, stock: 950, sku: "BOWL-DOMO-CHICO" }, { precio: 2.9, stock: 650, sku: "BOWL-DOMO-MEDIANO" }, { precio: 3.6, stock: 1300, sku: "BOWL-DOMO-GRANDE" } ] } },

    { id: "almeja-transparente", nombre: "Contenedor almeja transparente", cat: "contenedores",
      mat: ["pet"], img: "almeja-transparente",
      desc: "Bisagra y cierre a presión. Exhibe el producto sin abrirlo.",
      v: ["Chica", "Mediana", "Grande"],
      venta: { linea: "pet", tam: [ { precio: 1.8, stock: 1600, sku: "ALMEJA-TRANSPARENTE-CHICA" }, { precio: 2.3, stock: 900, sku: "ALMEJA-TRANSPARENTE-MEDIANA" }, { precio: 2.9, stock: 1100, sku: "ALMEJA-TRANSPARENTE-GRANDE" } ] } },

    { id: "ensaladera-transparente", nombre: "Ensaladera transparente", cat: "contenedores",
      mat: ["pet"], img: "ensaladera-transparente",
      desc: "Base honda con tapa. Para ensaladas y bowls fríos.",
      v: ["Chica", "Grande"],
      venta: { linea: "pet", tam: [ { precio: 2.4, stock: 1050, sku: "ENSALADERA-TRANSPARENTE-CHICA" }, { precio: 3.4, stock: 700, sku: "ENSALADERA-TRANSPARENTE-GRANDE" } ] } },

    { id: "contenedor-bisagra", nombre: "Contenedor cuadrado con bisagra", cat: "contenedores",
      mat: ["pet"], img: "contenedor-bisagra",
      desc: "Cuerpo y tapa en una sola pieza.", v: ["Chico", "Mediano", "Grande"],
      venta: { linea: "pet", tam: [ { precio: 1.9, stock: 1250, sku: "CONTENEDOR-BISAGRA-CHICO" }, { precio: 2.4, stock: 800, sku: "CONTENEDOR-BISAGRA-MEDIANO" }, { precio: 3.0, stock: 950, sku: "CONTENEDOR-BISAGRA-GRANDE" } ] } },

    { id: "charola-pastel-redonda", nombre: "Charola para pastel redonda", cat: "contenedores",
      mat: ["pet"], img: "charola-pastel-redonda",
      desc: "Base negra y domo transparente. Para pastelería y repostería.",
      v: ["Chica", "Mediana", "Grande"],
      venta: { linea: "pet", tam: [ { precio: 3.2, stock: 550, sku: "CHAROLA-PASTEL-REDONDA-CHICA" }, { precio: 4.1, stock: 400, sku: "CHAROLA-PASTEL-REDONDA-MEDIANA" }, { precio: 5.3, stock: 300, sku: "CHAROLA-PASTEL-REDONDA-GRANDE" } ] } },

    { id: "charola-pastel-larga", nombre: "Charola para pastel larga", cat: "contenedores",
      mat: ["pet"], img: "charola-pastel-larga",
      desc: "Formato alargado para roscas, brazos y panqués.", v: ["Estándar"],
      venta: { linea: "pet", tam: [ { precio: 4.6, stock: 380, sku: "CHAROLA-PASTEL-LARGA-ESTANDAR" } ] } },

    { id: "contenedor-rebanada-pastel", nombre: "Contenedor para rebanada de pastel", cat: "contenedores",
      mat: ["pet"], img: "contenedor-rebanada-pastel",
      desc: "Triangular con bisagra. Venta por porción.", v: ["Estándar"],
      venta: { linea: "pet", tam: [ { precio: 1.6, stock: 1700, sku: "CONTENEDOR-REBANADA-PASTEL-ESTANDAR" } ] } },

    /* ---------------- bagazo y paja de trigo ---------------- */
    { id: "almeja-bagazo", nombre: "Contenedor almeja de bagazo", cat: "bagazo",
      mat: ["bagazo"], img: "almeja-bagazo", destacado: true,
      desc: "Fibra de caña de azúcar. Compostable, resiste calor y grasa.",
      v: ["Chica", "Mediana", "Grande"],
      venta: { linea: "bagazo", tam: [ { precio: 2.4, stock: 1000, sku: "ALMEJA-BAGAZO-CHICA" }, { precio: 3.1, stock: 750, sku: "ALMEJA-BAGAZO-MEDIANA" }, { precio: 3.9, stock: 600, sku: "ALMEJA-BAGAZO-GRANDE" } ] } },

    { id: "charola-paja-trigo", nombre: "Charola oval de paja de trigo", cat: "bagazo",
      mat: ["paja-trigo"], img: "charola-paja-trigo",
      desc: "Fibra de paja de trigo. Para platos fuertes y comida preparada.",
      v: ["Chica", "Mediana", "Grande"],
      venta: { linea: "paja-trigo", tam: [ { precio: 2.6, stock: 900, sku: "CHAROLA-PAJA-TRIGO-CHICA" }, { precio: 3.3, stock: 700, sku: "CHAROLA-PAJA-TRIGO-MEDIANA" }, { precio: 4.1, stock: 550, sku: "CHAROLA-PAJA-TRIGO-GRANDE" } ] } },

    { id: "souffle-fecula", nombre: "Soufflé de fécula de maíz", cat: "bagazo",
      mat: ["fecula"], img: "souffle-fecula",
      desc: "Vasito para salsa y aderezo. Biodegradable.",
      v: ["1 oz", "2 oz", "4 oz"],
      venta: { linea: "fecula", tam: [ { precio: 0.35, stock: 2000, sku: "SOUFFLE-FECULA-1OZ" }, { precio: 0.45, stock: 1800, sku: "SOUFFLE-FECULA-2OZ" }, { precio: 0.6, stock: 1500, sku: "SOUFFLE-FECULA-4OZ" } ] } },

    /* ---------------- accesorios ---------------- */
    { id: "fajilla-ajustable", nombre: "Fajilla ajustable para vaso", cat: "accesorios",
      mat: ["kraft"], img: "fajilla-kraft", p: 1000, destacado: true,
      desc: "Aísla el calor y da superficie para tu marca.",
      v: ["Ajustable", "Pegada", "Impresión completa"],
      venta: { linea: "kraft", tam: [ { precio: 0.4, stock: 1800, sku: "FAJILLA-AJUSTABLE-AJUSTABLE" }, { precio: 0.91, stock: 1300, sku: "FAJILLA-AJUSTABLE-PEGADA" }, { precio: null, stock: 0, sku: "FAJILLA-AJUSTABLE-IMPRESIONCOMPLETA" } ] } },

    { id: "agitador-madera", nombre: "Agitador de madera", cat: "accesorios",
      mat: ["madera"], img: "agitador-madera", p: 10000,
      desc: "Madera natural, sin recubrimiento.", v: ["14 cm", "18 cm"],
      venta: { linea: "madera", tam: [ { precio: 0.08, stock: 8000, sku: "AGITADOR-MADERA-14CM" }, { precio: 0.16, stock: 6000, sku: "AGITADOR-MADERA-18CM" } ] } },

    { id: "portavaso-charola", nombre: "Portavasos charola", cat: "accesorios",
      mat: ["bagazo"], img: "portavaso-charola-4",
      desc: "Fibra moldeada. Para reparto y pedidos de varias bebidas.",
      v: ["4 vasos · caja de 300", "2 vasos · caja de 600"],
      venta: { linea: "bagazo", tam: [ { precio: 3.8, stock: 650, sku: "PORTAVASO-CHAROLA-4VASOSCAJADE300" }, { precio: 3.0, stock: 800, sku: "PORTAVASO-CHAROLA-2VASOSCAJADE600" } ] } },

    { id: "portavaso-asa", nombre: "Portavasos con asa", cat: "accesorios",
      mat: ["kraft"], img: "portavaso-caja-kraft",
      desc: "Kraft con asa troquelada. Se carga con una mano.",
      v: ["4 vasos · caja de 200", "2 vasos · caja de 250"],
      venta: { linea: "kraft", tam: [ { precio: 3.5, stock: 700, sku: "PORTAVASO-ASA-4VASOSCAJADE200" }, { precio: 2.8, stock: 900, sku: "PORTAVASO-ASA-2VASOSCAJADE250" } ] } },

    { id: "popote-tapioca", nombre: "Popote de tapioca biodegradable", cat: "accesorios",
      mat: ["tapioca"], img: "vaso-popotes", destacado: true,
      desc: "Almidón de tapioca. No se reblandece como el de papel.",
      v: ["21 cm · a granel, 5 kg", "21 cm · estuchado, 2,000 pzs"],
      /* "a granel" se vende por kg, no por pieza: no le inventamos un precio
         por unidad. Solo "estuchado" (cuenta cerrada de piezas) entra a venta
         en línea. */
      venta: { linea: "tapioca", tam: [ { precio: null, stock: 0, sku: "POPOTE-TAPIOCA-21CMAGRANEL5KG" }, { precio: 0.55, stock: 1200, sku: "POPOTE-TAPIOCA-21CMESTUCHADO2000PZS" } ] } },

    { id: "popote-cuchara", nombre: "Popote cuchara biodegradable", cat: "accesorios",
      mat: ["tapioca"], img: "vaso-popotes",
      desc: "Punta de cuchara para frappé y bebidas con topping.",
      v: ["26 cm · a granel, 5 kg"] },

    { id: "cono-crepa", nombre: "Cono porta crepa", cat: "accesorios",
      mat: ["papel"], img: "cono-crepa", p: 1000,
      desc: "Para crepa, papas y snacks de mano.", v: ["Grande"],
      venta: { linea: "papel", tam: [ { precio: 1.65, stock: 1400, sku: "CONO-CREPA-GRANDE" } ] } },

    /* ---------------- papel y bolsas ---------------- */
    { id: "servilleta-larga", nombre: "Servilleta larga", cat: "papel",
      mat: ["papel"], img: "papel-encerado", p: 1200,
      desc: "Formato largo de 39.0 x 37.5 cm.", v: ["39.0 x 37.5 cm"],
      venta: { linea: "papel", tam: [ { precio: 0.35, stock: 1900, sku: "SERVILLETA-LARGA-390X375CM" } ] } },

    { id: "papel-encerado", nombre: "Papel encerado grado alimenticio", cat: "accesorios",
      mat: ["papel"], img: "papel-encerado", p: 1000,
      desc: "Barrera contra grasa. Para envolver, forrar charola y canasta.",
      v: ["Varias medidas"] },

    { id: "papel-rh", nombre: "Papel RH grado alimenticio", cat: "papel",
      mat: ["papel"], img: "papel-encerado", p: 1000,
      desc: "Papel de uso general en cocina y mostrador.", v: ["Varias medidas"] },

    { id: "bolsa-kraft-asa", nombre: "Bolsa de papel kraft con asa", cat: "papel",
      mat: ["kraft"], img: "srv-bolsa-kraft", servicio: true, destacado: true,
      desc: "Fabricación a medida, con o sin asa, con o sin impresión.",
      v: ["Chica", "Mediana", "Grande", "A medida"] },

    { id: "bolsa-bond", nombre: "Bolsa de papel bond", cat: "papel",
      mat: ["papel"], img: "srv-bolsas-bond", servicio: true,
      desc: "Bolsa lisa para panadería y mostrador. Personalizable.",
      v: ["Chica", "Mediana", "Grande", "A medida"] },

    { id: "bolsa-ventana", nombre: "Bolsa con ventana", cat: "papel",
      mat: ["papel"], img: "bolsa-ventana",
      desc: "Ventana transparente para producto de panadería y galletería.",
      v: ["Chica", "Mediana", "Grande"],
      venta: { linea: "papel", tam: [ { precio: 1.2, stock: 1500, sku: "BOLSA-VENTANA-CHICA" }, { precio: 1.6, stock: 900, sku: "BOLSA-VENTANA-MEDIANA" }, { precio: 2.1, stock: 1100, sku: "BOLSA-VENTANA-GRANDE" } ] } },

    { id: "contenedor-medida", nombre: "Contenedor a medida", cat: "contenedores",
      mat: ["kraft", "carton"], img: "srv-contenedores-medida", servicio: true,
      desc: "Diseñamos y producimos el formato que tu carta necesita, con o sin impresión.",
      v: ["A medida"] }
  ];


  /* ===========================================================================
     OFERTAS  ->  las pinta ofertas.html
     ---------------------------------------------------------------------------
     Está VACÍO a propósito. GreeNova no tiene promociones publicadas y no se
     inventaron: un descuento falso o un "precio antes" que nunca existió es
     publicidad engañosa, no diseño.

     Para encender una oferta agrega una entrada con el id del producto:

       "vaso-papel-blanco": {
         desc:  15,                      // % de descuento, obligatorio
         hasta: "2026-10-31",            // último día, opcional
         nota:  "Última existencia",     // etiqueta libre, opcional
         agotado: false                  // opcional, lo marca como AGOTADO
       }

     Con eso la tarjeta muestra el badge de descuento y, si el producto tiene
     `precio`, el precio tachado junto al de oferta. La página se llena sola.
     =========================================================================== */
  var PROMOS = {};

  /* precio en MXN por caja. null = "Cotizar". Ver nota de arriba. */
  PRODUCTOS.forEach(function (p) { if (!("precio" in p)) p.precio = null; });

  return { CATEGORIAS: CATEGORIAS, MATERIALES: MATERIALES, PRODUCTOS: PRODUCTOS, PROMOS: PROMOS };
})();
