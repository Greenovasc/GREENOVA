/* GreeNova SC - catálogo.
   ===========================================================================
   ESTE ARCHIVO LO GENERA EL PANEL (admin.html). Si lo editas a mano, el
   siguiente guardado desde el panel va a sobrescribir tus cambios.

   Última actualización desde el panel: 2026-09-28
   =========================================================================== */
window.GREENOVA = (function () {
  "use strict";

  /* Categorías del catálogo. */
  var CATEGORIAS = [
    { id: "vasos-papel", nombre: "Vasos de papel", icono: "i-coffee" },
    { id: "vasos-pet", nombre: "Vasos PET y PP", icono: "i-cup-cold" },
    { id: "tapas-papel", nombre: "Tapas para vaso de papel", icono: "i-circle-half" },
    { id: "tapas-pet", nombre: "Tapas para vaso PET", icono: "i-circle-half" },
    { id: "tapas-contenedor", nombre: "Tapas para contenedor y soufflé", icono: "i-circle-half" },
    { id: "contenedores", nombre: "Contenedores de papel", icono: "i-bowl-food" },
    { id: "cajas-charolas", nombre: "Cajas, charolas y contenedores PET", icono: "i-package" },
    { id: "ensaladeras", nombre: "Ensaladeras", icono: "i-bowl-food" },
    { id: "souffles", nombre: "Soufflés y conos", icono: "i-bowl-food" },
    { id: "fajillas", nombre: "Fajillas", icono: "i-package" },
    { id: "removedores", nombre: "Removedores", icono: "i-fork-knife" },
    { id: "popotes", nombre: "Popotes", icono: "i-cup-cold" },
    { id: "portavasos", nombre: "Portavasos", icono: "i-coffee" },
    { id: "bolsas", nombre: "Bolsas", icono: "i-shopping-bag" },
    { id: "servilletas-papel", nombre: "Servilletas y envoltura", icono: "i-leaf" }
  ];

  /* Materiales -> etiqueta visible. */
  var MATERIALES = {
    "papel": "Papel",
    "kraft": "Kraft",
    "madera": "Madera",
    "pet": "PET",
    "pp": "Polipropileno",
    "ps": "Poliestireno",
    "tapioca": "Tapioca",
    "carton": "Cartón",
    "pla": "PLA",
    "otro": "Otro material"
  };

  /* v = medidas u opciones | venta.tam = una entrada por medida:
     paq / caja = piezas por paquete y por caja; pPaq / pCaja = precio en MXN,
     IVA incluido (null = por confirmar); boca en mm; esp = especificaciones;
     img = foto propia de esa medida. El pedido mínimo es un paquete. */
  var PRODUCTOS = [
    /* ---------------- vasos de papel ---------------- */
    { id: "vaso-papel-blanco", nombre: "Vaso de papel blanco", cat: "vasos-papel", mat: ["papel"], img: "vaso-papel-par", uso: "Bebida fría o caliente", fotoPropia: true, personalizable: true,
      desc: "Vaso de papel blanco con recubrimiento interior de polietileno, para bebida fría o caliente.",
      v: ["4 oz · boca 62 mm", "8 oz · boca 80 mm", "10 oz · boca 90 mm", "12 oz · boca 90 mm", "16 oz · boca 90 mm", "20 oz · boca 90 mm", "32 oz · boca 105 mm", "44 oz · boca 115 mm"],
      venta: { linea: "papel", tam: [
        { paq: 50, caja: 1000, pPaq: 52.62, pCaja: 912.31, boca: 62, esp: "Boca 62 mm · Alto 65 mm · Base 46 mm", sku: "GN-VASO-PAPEL-BLANCO-01", img: null },
        { paq: 50, caja: 1000, pPaq: 53.15, pCaja: 923.03, boca: 80, esp: "Boca 80 mm · Alto 92 mm · Base 52 mm", sku: "GN-VASO-PAPEL-BLANCO-02", img: null },
        { paq: 50, caja: 1000, pPaq: 61.3, pCaja: 1086.05, boca: 90, esp: "Boca 90 mm · Alto 96 mm · Base 60 mm", sku: "GN-VASO-PAPEL-BLANCO-03", img: null },
        { paq: 50, caja: 1000, pPaq: 67.25, pCaja: 1205.0, boca: 90, esp: "Boca 90 mm · Alto 108 mm · Base 59 mm", sku: "GN-VASO-PAPEL-BLANCO-04", img: null },
        { paq: 50, caja: 1000, pPaq: 75.24, pCaja: 1364.9, boca: 90, esp: "Boca 90 mm · Alto 139 mm · Base 59 mm", sku: "GN-VASO-PAPEL-BLANCO-05", img: null },
        { paq: 50, caja: 1000, pPaq: 87.51, pCaja: 1610.22, boca: 90, esp: "Boca 90 mm · Alto 163 mm · Base 60 mm", sku: "GN-VASO-PAPEL-BLANCO-06", img: null },
        { paq: 25, caja: 500, pPaq: 65.93, pCaja: 1248.68, boca: 105, esp: "Boca 105 mm", sku: "GN-VASO-PAPEL-BLANCO-07", img: null },
        { paq: 25, caja: 500, pPaq: 76.15, pCaja: 1453.04, boca: 115, esp: "Boca 115 mm", sku: "GN-VASO-PAPEL-BLANCO-08", img: null }
      ] } },
    { id: "vaso-papel-negro", nombre: "Vaso de papel negro", cat: "vasos-papel", mat: ["papel"], img: "vaso-papel-negro", uso: "Bebida fría o caliente", fotoPropia: true, personalizable: true,
      desc: "Vaso de papel negro con recubrimiento interior de polietileno, para bebida fría o caliente.",
      v: ["4 oz · boca 62 mm", "8 oz · boca 80 mm", "10 oz · boca 90 mm", "12 oz · boca 90 mm", "16 oz · boca 90 mm", "20 oz · boca 90 mm", "44 oz · boca 115 mm"],
      venta: { linea: "papel", tam: [
        { paq: 50, caja: 1000, pPaq: 52.62, pCaja: 912.31, boca: 62, esp: "Boca 62 mm · Alto 65 mm · Base 46 mm", sku: "GN-VASO-PAPEL-NEGRO-01", img: null },
        { paq: 50, caja: 1000, pPaq: 57.17, pCaja: 1003.38, boca: 80, esp: "Boca 80 mm · Alto 92 mm · Base 52 mm", sku: "GN-VASO-PAPEL-NEGRO-02", img: null },
        { paq: 50, caja: 1000, pPaq: 66.16, pCaja: 1183.17, boca: 90, esp: "Boca 90 mm · Alto 96 mm · Base 60 mm", sku: "GN-VASO-PAPEL-NEGRO-03", img: null },
        { paq: 50, caja: 1000, pPaq: 72.69, pCaja: 1313.82, boca: 90, esp: "Boca 90 mm · Alto 108 mm · Base 59 mm", sku: "GN-VASO-PAPEL-NEGRO-04", img: null },
        { paq: 50, caja: 1000, pPaq: 81.47, pCaja: 1489.32, boca: 90, esp: "Boca 90 mm · Alto 139 mm · Base 59 mm", sku: "GN-VASO-PAPEL-NEGRO-05", img: null },
        { paq: 50, caja: 1000, pPaq: 94.98, pCaja: 1759.58, boca: 90, esp: "Boca 90 mm · Alto 163 mm · Base 60 mm", sku: "GN-VASO-PAPEL-NEGRO-06", img: null },
        { paq: 50, caja: 500, pPaq: 156.28, pCaja: 1492.83, boca: 115, esp: "Boca 115 mm", sku: "GN-VASO-PAPEL-NEGRO-07", img: null }
      ] } },
    { id: "vaso-papel-kraft", nombre: "Vaso de papel kraft", cat: "vasos-papel", mat: ["papel", "kraft"], img: "vaso-papel-kraft-estudio", uso: "Bebida fría o caliente", fotoPropia: true, personalizable: true,
      desc: "Vaso de papel kraft con recubrimiento interior de polietileno, para bebida fría o caliente.",
      v: ["8 oz · boca 80 mm", "12 oz · boca 90 mm", "16 oz · boca 90 mm"],
      venta: { linea: "papel", tam: [
        { paq: 50, caja: 1000, pPaq: 53.15, pCaja: 923.03, boca: 80, esp: "Boca 80 mm · Alto 92 mm · Base 52 mm", sku: "GN-VASO-PAPEL-KRAFT-01", img: null },
        { paq: 50, caja: 1000, pPaq: 67.25, pCaja: 1205.0, boca: 90, esp: "Boca 90 mm · Alto 108 mm · Base 59 mm", sku: "GN-VASO-PAPEL-KRAFT-02", img: null },
        { paq: 50, caja: 1000, pPaq: 75.24, pCaja: 1364.9, boca: 90, esp: "Boca 90 mm · Alto 139 mm · Base 59 mm", sku: "GN-VASO-PAPEL-KRAFT-03", img: null }
      ] } },
    { id: "vaso-papel-doble-pared", nombre: "Vaso de papel doble pared", cat: "vasos-papel", mat: ["papel"], img: "vaso-papel-doble-pared-blanco", uso: "Bebida caliente", fotoPropia: true, personalizable: true,
      desc: "Vaso de papel de doble pared para bebida caliente, con recubrimiento interior de polietileno.",
      v: ["Blanco · 8 oz · boca 80 mm", "Blanco · 12 oz · boca 90 mm", "Blanco · 16 oz · boca 90 mm", "Negro · 12 oz · boca 90 mm", "Negro · 16 oz · boca 90 mm", "Genérico · 12 oz · boca 90 mm"],
      venta: { linea: "papel", tam: [
        { paq: 50, caja: 1000, pPaq: 50.42, pCaja: 868.43, boca: 80, esp: "Boca 80 mm · Alto 92 mm · Base 52 mm", sku: "GN-VASO-PAPEL-DOBLE-PARED-01", img: "vaso-papel-doble-pared-blanco" },
        { paq: 50, caja: 1000, pPaq: 60.58, pCaja: 1071.63, boca: 90, esp: "Boca 90 mm · Alto 108 mm · Base 59 mm", sku: "GN-VASO-PAPEL-DOBLE-PARED-02", img: "vaso-papel-doble-pared-blanco" },
        { paq: 25, caja: 500, pPaq: 68.53, pCaja: 1300.55, boca: 90, esp: "Boca 90 mm · Alto 139 mm · Base 59 mm", sku: "GN-VASO-PAPEL-DOBLE-PARED-03", img: "vaso-papel-doble-pared-blanco" },
        { paq: 50, caja: 1000, pPaq: 82.89, pCaja: 1517.78, boca: 90, esp: "Boca 90 mm · Alto 108 mm · Base 59 mm", sku: "GN-VASO-PAPEL-DOBLE-PARED-04", img: "vaso-papel-doble-pared-negro" },
        { paq: 28, caja: 560, pPaq: 83.46, pCaja: 1590.72, boca: 90, esp: "Boca 90 mm · Alto 139 mm · Base 59 mm", sku: "GN-VASO-PAPEL-DOBLE-PARED-05", img: "vaso-papel-doble-pared-negro" },
        { paq: 25, caja: 500, pPaq: 57.39, pCaja: 1077.87, boca: 90, esp: "Boca 90 mm · Alto 108 mm · Base 59 mm", sku: "GN-VASO-PAPEL-DOBLE-PARED-06", img: "vaso-papel-doble-pared-generico" }
      ] } },
    { id: "vaso-papel-color-44", nombre: "Vaso de papel de color 44 oz", cat: "vasos-papel", mat: ["papel"], img: "vaso-papel-44-rojo", uso: "Bebida fría o caliente", fotoPropia: true, personalizable: true,
      desc: "Vaso de papel de 44 oz en rojo, azul o gris, con recubrimiento interior de polietileno.",
      v: ["Rojo · 44 oz · boca 115 mm", "Azul · 44 oz · boca 115 mm", "Gris · 44 oz · boca 115 mm"],
      venta: { linea: "papel", tam: [
        { paq: 50, caja: 500, pPaq: 156.28, pCaja: 1492.83, boca: 115, esp: "Boca 115 mm", sku: "GN-VASO-PAPEL-COLOR-44-01", img: "vaso-papel-44-rojo" },
        { paq: 50, caja: 500, pPaq: 156.28, pCaja: 1492.83, boca: 115, esp: "Boca 115 mm", sku: "GN-VASO-PAPEL-COLOR-44-02", img: "vaso-papel-44-azul" },
        { paq: 50, caja: 500, pPaq: 156.28, pCaja: 1492.83, boca: 115, esp: "Boca 115 mm", sku: "GN-VASO-PAPEL-COLOR-44-03", img: "vaso-papel-44-gris" }
      ] } },

    /* ---------------- tapas para vaso de papel ---------------- */
    { id: "tapa-cafetera-62", nombre: "Tapa para vaso de papel de 4 oz", cat: "tapas-papel", mat: ["ps"], img: "tapa-cafetera-62-blanca", uso: "Tapa para vaso de papel de 4 oz", fotoPropia: true,
      desc: "Tapa cafetera de poliestireno para vaso de papel de 4 oz (boca 62 mm).",
      v: ["Blanca", "Negra"],
      venta: { linea: "ps", tam: [
        { paq: 50, caja: 1000, pPaq: 42.65, pCaja: 713.02, boca: 62, esp: "Boca 62 mm", sku: "GN-TAPA-CAFETERA-62-01", img: "tapa-cafetera-62-blanca" },
        { paq: 50, caja: 1000, pPaq: 42.65, pCaja: 713.02, boca: 62, esp: "Boca 62 mm", sku: "GN-TAPA-CAFETERA-62-02", img: "tapa-cafetera-62-negra" }
      ] } },
    { id: "tapa-cafetera-80", nombre: "Tapa para vaso de papel de 8 oz", cat: "tapas-papel", mat: ["ps", "pp"], img: "tapa-blanca-solo", uso: "Tapa para vaso de papel de 8 oz", fotoPropia: true,
      desc: "Tapas cafeteras para vaso de papel de 8 oz (boca 80 mm), en poliestireno y polipropileno.",
      v: ["Blanca · poliestireno", "Negra · poliestireno", "Negra plana con solapa · poliestireno", "Negra · polipropileno"],
      venta: { linea: "ps", tam: [
        { paq: 100, caja: 1000, pPaq: 159.56, pCaja: 1455.59, boca: 80, esp: "Boca 80 mm", sku: "GN-TAPA-CAFETERA-80-01", img: "tapa-blanca-solo" },
        { paq: 50, caja: 100, pPaq: null, pCaja: null, boca: 80, esp: "Boca 80 mm", sku: "GN-TAPA-CAFETERA-80-02", img: "tapa-cafetera-80-negra-ps" },
        { paq: 50, caja: 1000, pPaq: 39.24, pCaja: 644.77, boca: 80, esp: "Boca 80 mm", sku: "GN-TAPA-CAFETERA-80-03", img: "tienda-03" },
        { paq: 50, caja: 1000, pPaq: 58.11, pCaja: 1022.21, boca: 80, esp: "Boca 80 mm", sku: "GN-TAPA-CAFETERA-80-04", img: "tapa-kraft-cafe" }
      ] } },
    { id: "tapa-cafetera-90", nombre: "Tapa para vaso de papel de 10 a 20 oz", cat: "tapas-papel", mat: ["ps", "pp"], img: "tapa-blanca-plana", uso: "Tapa para vaso de papel de 10 a 20 oz", fotoPropia: true,
      desc: "Tapas cafeteras para vaso de papel de 10 a 20 oz (boca 90 mm): planas, de 3 óvalos y con tapón, en poliestireno y polipropileno.",
      v: ["Blanca 3 óvalos · poliestireno", "Negra 3 óvalos · poliestireno", "Negra · poliestireno", "Negra plana con solapa · poliestireno", "Negra con tapón · poliestireno", "Blanca · polipropileno", "Negra · polipropileno", "Blanca con tapón · polipropileno", "Negra con tapón · polipropileno"],
      venta: { linea: "ps", tam: [
        { paq: 50, caja: 1000, pPaq: 49.83, pCaja: 856.54, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-01", img: "tapa-blanca-plana" },
        { paq: 50, caja: 1000, pPaq: 49.83, pCaja: 856.54, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-02", img: "tapa-cafetera-90-negra-3ovalos" },
        { paq: 50, caja: 1000, pPaq: 56.75, pCaja: 994.9, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-03", img: "tapa-cafetera-90-negra-solo" },
        { paq: 50, caja: 1000, pPaq: 48.72, pCaja: 834.31, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-04", img: "tienda-08" },
        { paq: 50, caja: 1000, pPaq: 50.79, pCaja: 875.79, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-05", img: "tapa-viajera-negra" },
        { paq: 50, caja: 1000, pPaq: 52.25, pCaja: 904.9, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-06", img: "tapa-domo-blanca" },
        { paq: 50, caja: 1000, pPaq: 52.25, pCaja: 904.9, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-07", img: "tapa-cafetera-90-negra-pp" },
        { paq: 100, caja: 1200, pPaq: 134.32, pCaja: 1443.87, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-08", img: "tapa-cafetera-90-blanca-tapon" },
        { paq: 100, caja: 1200, pPaq: 126.5, pCaja: 1350.04, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-CAFETERA-90-09", img: "tapa-cafetera-90-negra-tapon" }
      ] } },
    { id: "tapa-papel-90", nombre: "Tapa de papel para vaso de 10 a 20 oz", cat: "tapas-papel", mat: ["papel"], img: "tapa-papel-blanca", uso: "Tapa para vaso de papel de 10 a 20 oz", fotoPropia: true, personalizable: true,
      desc: "Tapa de papel para vaso de papel de 10 a 20 oz (boca 90 mm). Se vende por caja.",
      v: ["Blanca · boca 90 mm"],
      venta: { linea: "papel", tam: [
        { paq: null, caja: 1000, pPaq: null, pCaja: 1503.0, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-PAPEL-90-01", img: null }
      ] } },

    /* ---------------- fajillas ---------------- */
    { id: "fajilla-kraft", nombre: "Fajilla kraft para vaso de 10 a 16 oz", cat: "fajillas", mat: ["kraft"], img: "fajilla-kraft", uso: "Fajilla para vaso de papel", fotoPropia: true, personalizable: true,
      desc: "Fajilla de papel kraft para vaso de papel de 10 a 16 oz, pegada o ajustable.",
      v: ["Pegada", "Ajustable"],
      venta: { linea: "kraft", tam: [
        { paq: 25, caja: 1000, pPaq: 26.35, pCaja: 913.87, boca: null, esp: "Kraft", sku: "GN-FAJILLA-KRAFT-01", img: "fajilla-kraft" },
        { paq: 50, caja: 1000, pPaq: 27.09, pCaja: 401.87, boca: null, esp: "Kraft", sku: "GN-FAJILLA-KRAFT-02", img: "fajilla-kraft" }
      ] } },

    /* ---------------- removedores ---------------- */
    { id: "removedor-madera", nombre: "Removedor de madera", cat: "removedores", mat: ["madera"], img: "agitador-madera", uso: "Removedor para bebida", fotoPropia: true,
      desc: "Removedor de madera para bebida, de 14 o 18 cm de largo.",
      v: ["14 cm", "18 cm"],
      venta: { linea: "madera", tam: [
        { paq: 1000, caja: 10000, pPaq: 213.98, pCaja: 739.81, boca: null, esp: "Removedor de madera 14 cm de largo", sku: "GN-REMOVEDOR-MADERA-01", img: null },
        { paq: 1000, caja: 10000, pPaq: 295.93, pCaja: 1559.29, boca: null, esp: "Removedor de madera 18 cm de largo", sku: "GN-REMOVEDOR-MADERA-02", img: null }
      ] } },

    /* ---------------- vasos pet y pp ---------------- */
    { id: "vaso-pet-78", nombre: "Vaso PET boca 78 mm", cat: "vasos-pet", mat: ["pet"], img: "vaso-pet-vpc", uso: "Bebida fría", fotoPropia: true, personalizable: true,
      desc: "Vaso de PET transparente para bebida fría, boca 78 mm.",
      v: ["7 oz · boca 78 mm", "9 oz · boca 78 mm", "10 oz · boca 78 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 69.8, pCaja: 1255.9, boca: 78, esp: "Boca 78 mm", sku: "GN-VASO-PET-78-01", img: "vaso-pet-vpc" },
        { paq: 50, caja: 1000, pPaq: 85.12, pCaja: 1562.44, boca: 78, esp: "Boca 78 mm", sku: "GN-VASO-PET-78-02", img: "vaso-pet-vpc" },
        { paq: 50, caja: 1000, pPaq: 67.75, pCaja: 1214.95, boca: 78, esp: "Boca 78 mm", sku: "GN-VASO-PET-78-03", img: "vaso-pet-vpc" }
      ] } },
    { id: "vaso-pet-92", nombre: "Vaso PET boca 92 mm", cat: "vasos-pet", mat: ["pet"], img: "vaso-pet-vpa", uso: "Bebida fría", fotoPropia: true, personalizable: true,
      desc: "Vaso de PET transparente para bebida fría, boca 92 mm.",
      v: ["12 oz · boca 92 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 88.59, pCaja: 1631.86, boca: 92, esp: "Boca 92 mm", sku: "GN-VASO-PET-92-01", img: "vaso-pet-vpa" }
      ] } },
    { id: "vaso-pet-95", nombre: "Vaso PET boca 95 mm", cat: "vasos-pet", mat: ["pet"], img: "vaso-pet-vpa", uso: "Bebida fría", fotoPropia: true, personalizable: true,
      desc: "Vaso de PET transparente para bebida fría, boca 95 mm.",
      v: ["9 oz · boca 95 mm", "12 oz · boca 95 mm", "16 oz · boca 95 mm", "20 oz · boca 95 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 71.39, pCaja: 1287.87, boca: 95, esp: "Boca 95 mm", sku: "GN-VASO-PET-95-01", img: "vaso-pet-vpa" },
        { paq: 50, caja: 1000, pPaq: 104.29, pCaja: 1945.81, boca: 95, esp: "Boca 95 mm", sku: "GN-VASO-PET-95-02", img: "vaso-pet-vpa" },
        { paq: 50, caja: 1000, pPaq: 130.48, pCaja: 2469.57, boca: 95, esp: "Boca 95 mm", sku: "GN-VASO-PET-95-03", img: "vaso-pet-vpa" },
        { paq: 50, caja: 1000, pPaq: 134.89, pCaja: 2557.72, boca: 95, esp: "Boca 95 mm", sku: "GN-VASO-PET-95-04", img: "vaso-pet-vpa" }
      ] } },
    { id: "vaso-pet-98", nombre: "Vaso PET boca 98 mm", cat: "vasos-pet", mat: ["pet"], img: "vaso-pet-vpb", uso: "Bebida fría", fotoPropia: true, personalizable: true,
      desc: "Vaso de PET transparente para bebida fría, boca 98 mm.",
      v: ["14 oz · boca 98 mm", "16 oz · boca 98 mm · caja de 1,000", "16 oz · boca 98 mm · caja de 500", "20 oz · boca 98 mm", "24 oz · boca 98 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 90.09, pCaja: 1661.89, boca: 98, esp: "Boca 98 mm", sku: "GN-VASO-PET-98-01", img: "vaso-pet-vpb" },
        { paq: 50, caja: 1000, pPaq: 105.25, pCaja: 1964.92, boca: 98, esp: "Boca 98 mm", sku: "GN-VASO-PET-98-02", img: "vaso-pet-vpb" },
        { paq: 50, caja: 500, pPaq: 91.54, pCaja: 845.37, boca: 98, esp: "Boca 98 mm", sku: "GN-VASO-PET-98-03", img: "vaso-pet-vpb" },
        { paq: 50, caja: 600, pPaq: 122.97, pCaja: 1391.62, boca: 98, esp: "Boca 98 mm", sku: "GN-VASO-PET-98-04", img: "vaso-pet-vpb" },
        { paq: 50, caja: 600, pPaq: 133.63, pCaja: 1519.54, boca: 98, esp: "Boca 98 mm", sku: "GN-VASO-PET-98-05", img: "vaso-pet-vpb" }
      ] } },
    { id: "vaso-pet-107", nombre: "Vaso PET boca 107 mm", cat: "vasos-pet", mat: ["pet"], img: "vaso-pet-vpb", uso: "Bebida fría", fotoPropia: true, personalizable: true,
      desc: "Vaso de PET transparente para bebida fría, boca 107 mm.",
      v: ["32 oz · boca 107 mm"],
      venta: { linea: "pet", tam: [
        { paq: 25, caja: 300, pPaq: 102.93, pCaja: 1193.18, boca: 107, esp: "Boca 107 mm", sku: "GN-VASO-PET-107-01", img: "vaso-pet-vpb" }
      ] } },
    { id: "vaso-pet-u", nombre: "Vaso PET en U", cat: "vasos-pet", mat: ["pet"], img: "vaso-pet-vpu", uso: "Bebida fría", fotoPropia: true, personalizable: true,
      desc: "Vaso de PET en forma de U para bebida fría, boca 90 mm.",
      v: ["12 oz · boca 90 mm", "16 oz · boca 90 mm", "24 oz · boca 90 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 85.82, pCaja: 1576.47, boca: 90, esp: "Boca 90 mm", sku: "GN-VASO-PET-U-01", img: "vaso-pet-vpu" },
        { paq: 50, caja: 1000, pPaq: 111.43, pCaja: 2088.55, boca: 90, esp: "Boca 90 mm", sku: "GN-VASO-PET-U-02", img: "vaso-pet-vpu" },
        { paq: 50, caja: 1000, pPaq: 130.99, pCaja: 2479.72, boca: 90, esp: "Boca 90 mm", sku: "GN-VASO-PET-U-03", img: "vaso-pet-vpu" }
      ] } },
    { id: "vaso-pp", nombre: "Vaso PP para bebida caliente", cat: "vasos-pet", mat: ["pp"], img: "tienda-42", uso: "Bebida caliente", personalizable: true,
      desc: "Vaso de polipropileno de 16 oz para bebida caliente.",
      v: ["En U · 16 oz · boca 89 mm", "16 oz · boca 92 mm", "16 oz · boca 95 mm"],
      venta: { linea: "pp", tam: [
        { paq: 50, caja: 1000, pPaq: 105.6, pCaja: 1971.94, boca: 89, esp: "Boca 89 mm", sku: "GN-VASO-PP-01", img: "tienda-40" },
        { paq: 25, caja: 1000, pPaq: 40.02, pCaja: 1460.71, boca: 92, esp: "Boca 92 mm", sku: "GN-VASO-PP-02", img: "tienda-41" },
        { paq: 25, caja: 1000, pPaq: 44.94, pCaja: 1657.5, boca: 95, esp: "Boca 95 mm", sku: "GN-VASO-PP-03", img: "tienda-42" }
      ] } },

    /* ---------------- tapas para vaso pet ---------------- */
    { id: "tapa-pet-plana-ranura", nombre: "Tapa PET plana con ranura", cat: "tapas-pet", mat: ["pet"], img: "tapa-fria-plana", uso: "Tapa para vaso PET", fotoPropia: true,
      desc: "Tapa plana de PET con ranura para popote.",
      v: ["Boca 78 mm", "Boca 90 mm", "Boca 92 mm", "Boca 95 mm", "Boca 98 mm", "Boca 107 mm"],
      venta: { linea: "pet", tam: [
        { paq: 100, caja: 1000, pPaq: 61.32, pCaja: 473.17, boca: 78, esp: "Boca 78 mm", sku: "GN-TAPA-PET-PLANA-RANURA-01", img: "tapa-fria-plana" },
        { paq: 50, caja: 1000, pPaq: 34.97, pCaja: 559.36, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-PET-PLANA-RANURA-02", img: "tapa-fria-plana" },
        { paq: 100, caja: 1000, pPaq: 79.37, pCaja: 653.74, boca: 92, esp: "Boca 92 mm", sku: "GN-TAPA-PET-PLANA-RANURA-03", img: "tapa-fria-plana" },
        { paq: 50, caja: 1000, pPaq: 47.18, pCaja: 803.5, boca: 95, esp: "Boca 95 mm", sku: "GN-TAPA-PET-PLANA-RANURA-04", img: "tapa-fria-plana" },
        { paq: 100, caja: 1000, pPaq: 76.57, pCaja: 625.66, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-PLANA-RANURA-05", img: "tapa-fria-plana" },
        { paq: 50, caja: 500, pPaq: 50.26, pCaja: 432.61, boca: 107, esp: "Boca 107 mm", sku: "GN-TAPA-PET-PLANA-RANURA-06", img: "tapa-fria-plana" }
      ] } },
    { id: "tapa-pet-plana-sin-ranura", nombre: "Tapa PET plana sin ranura", cat: "tapas-pet", mat: ["pet"], img: "tienda-44", uso: "Tapa para vaso PET",
      desc: "Tapa plana de PET, sin ranura.",
      v: ["Boca 78 mm"],
      venta: { linea: "pet", tam: [
        { paq: 100, caja: 1000, pPaq: 61.32, pCaja: 473.17, boca: 78, esp: "Boca 78 mm", sku: "GN-TAPA-PET-PLANA-SIN-RANURA-01", img: "tienda-44" }
      ] } },
    { id: "tapa-pet-domo", nombre: "Tapa PET domo con orificio", cat: "tapas-pet", mat: ["pet"], img: "tapa-fria-domo", uso: "Tapa para vaso PET", fotoPropia: true,
      desc: "Tapa domo de PET con orificio, para bebidas con crema o frappé.",
      v: ["Boca 78 mm", "Boca 90 mm", "Boca 92 mm", "Boca 95 mm", "Boca 98 mm", "Boca 98 mm · orificio ancho", "Boca 107 mm"],
      venta: { linea: "pet", tam: [
        { paq: 100, caja: 1000, pPaq: 70.25, pCaja: 562.47, boca: 78, esp: "Boca 78 mm", sku: "GN-TAPA-PET-DOMO-01", img: "tapa-fria-domo" },
        { paq: 50, caja: 1000, pPaq: 44.43, pCaja: 748.51, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-PET-DOMO-02", img: "tapa-fria-domo" },
        { paq: 100, caja: 1000, pPaq: 90.53, pCaja: 765.27, boca: 92, esp: "Boca 92 mm", sku: "GN-TAPA-PET-DOMO-03", img: "tapa-fria-domo" },
        { paq: 50, caja: 1000, pPaq: 62.5, pCaja: 1110.04, boca: 95, esp: "Boca 95 mm", sku: "GN-TAPA-PET-DOMO-04", img: "tapa-fria-domo" },
        { paq: 100, caja: 1000, pPaq: 96.73, pCaja: 827.29, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-DOMO-05", img: "tapa-fria-domo" },
        { paq: 100, caja: 1000, pPaq: 103.32, pCaja: 893.2, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-DOMO-06", img: "tapa-fria-domo" },
        { paq: 50, caja: 500, pPaq: 69.61, pCaja: 626.05, boca: 107, esp: "Boca 107 mm", sku: "GN-TAPA-PET-DOMO-07", img: "tapa-fria-domo" }
      ] } },
    { id: "tapa-pet-domo-oso", nombre: "Tapa PET domo oso con orificio", cat: "tapas-pet", mat: ["pet"], img: "tapa-pet-domo-oso", uso: "Tapa para vaso PET", fotoPropia: true,
      desc: "Tapa domo de PET con orejas de oso y orificio.",
      v: ["Boca 90 mm", "Boca 95 mm", "Boca 98 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 60.22, pCaja: 1064.41, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-PET-DOMO-OSO-01", img: "tapa-pet-domo-oso" },
        { paq: 50, caja: 1000, pPaq: 63.56, pCaja: 1131.1, boca: 95, esp: "Boca 95 mm", sku: "GN-TAPA-PET-DOMO-OSO-02", img: "tapa-pet-domo-oso" },
        { paq: 50, caja: 1000, pPaq: 67.67, pCaja: 1213.39, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-DOMO-OSO-03", img: "tapa-pet-domo-oso" }
      ] } },
    { id: "tapa-pet-sorbe", nombre: "Tapa PET sorbe", cat: "tapas-pet", mat: ["pet"], img: "tapa-fria-plana-lisa", uso: "Tapa para vaso PET", fotoPropia: true,
      desc: "Tapa de PET para beber sin popote.",
      v: ["Boca 90 mm", "Boca 98 mm · caja de 1,000", "Boca 98 mm · caja de 1,080"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 46.14, pCaja: 782.82, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-PET-SORBE-01", img: "tapa-fria-plana-lisa" },
        { paq: 50, caja: 1000, pPaq: 65.1, pCaja: 1161.91, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-SORBE-02", img: "tapa-fria-plana-lisa" },
        { paq: 90, caja: 1080, pPaq: 90.71, pCaja: 937.33, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-SORBE-03", img: "tapa-fria-plana-lisa" }
      ] } },
    { id: "tapa-pet-sorbe-tapon", nombre: "Tapa PET sorbe con tapón", cat: "tapas-pet", mat: ["pet"], img: "tienda-49", uso: "Tapa para vaso PET",
      desc: "Tapa de PET para beber sin popote, con tapón.",
      v: ["Boca 90 mm", "Boca 95 mm", "Boca 98 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 46.51, pCaja: 790.24, boca: 90, esp: "Boca 90 mm", sku: "GN-TAPA-PET-SORBE-TAPON-01", img: "tienda-49" },
        { paq: 50, caja: 1000, pPaq: 55.83, pCaja: 976.51, boca: 95, esp: "Boca 95 mm", sku: "GN-TAPA-PET-SORBE-TAPON-02", img: "tienda-49" },
        { paq: 50, caja: 1000, pPaq: 62.77, pCaja: 1115.48, boca: 98, esp: "Boca 98 mm", sku: "GN-TAPA-PET-SORBE-TAPON-03", img: "tienda-50" }
      ] } },

    /* ---------------- popotes, portavasos, servilletas y papel ---------------- */
    { id: "popote-tapioca", nombre: "Popote de tapioca biodegradable", cat: "popotes", mat: ["tapioca"], img: "popote-tapioca", uso: "Popote para bebida fría",
      desc: "Popote biodegradable de tapioca, de 21 cm. Se cotiza por caja.",
      v: ["21 cm · caja de 5 kg"] },
    { id: "popote-tapioca-estuchado", nombre: "Popote de tapioca estuchado", cat: "popotes", mat: ["tapioca"], img: "popote-tapioca-estuchado", uso: "Popote para bebida fría",
      desc: "Popote biodegradable de tapioca, de 21 cm, en sobre individual.",
      v: ["21 cm · diámetro 11 mm"],
      venta: { linea: "tapioca", tam: [
        { paq: 100, caja: 2000, pPaq: 148.03, pCaja: 2680.69, boca: null, esp: "Largo 21 cm · Diámetro 11 mm", sku: "GN-POPOTE-TAPIOCA-ESTUCHADO-01", img: null }
      ] } },
    { id: "popote-cuchara", nombre: "Popote cuchara biodegradable", cat: "popotes", mat: [], img: "foto-pendiente", uso: "Popote para raspados, nieves y frappés",
      desc: "Popote biodegradable de 26 cm con punta de cuchara. Se cotiza por caja.",
      v: ["26 cm · caja de 5 kg"] },
    { id: "portavaso-charola", nombre: "Portavasos charola", cat: "portavasos", mat: ["carton"], img: "portavaso-charola-4", uso: "Para llevar 2 o 4 bebidas", fotoPropia: true,
      desc: "Charola portavasos para llevar 2 o 4 bebidas.",
      v: ["2 espacios", "4 espacios"],
      venta: { linea: "carton", tam: [
        { paq: 100, caja: 600, pPaq: 221.62, pCaja: 1245.70, boca: null, esp: null, sku: "GN-PORTAVASO-CHAROLA-01", img: null },
        { paq: 1, caja: 300, pPaq: 2.47, pCaja: 699.11, boca: null, esp: null, sku: "GN-PORTAVASO-CHAROLA-02", img: null }
      ] } },
    { id: "portavaso-asa", nombre: "Portavasos con asa", cat: "portavasos", mat: ["carton"], img: "portavaso-caja-kraft", uso: "Para llevar 2 o 4 bebidas", fotoPropia: true,
      desc: "Portavasos de cartón con asa, para llevar 2 o 4 bebidas. Se cotiza por caja.",
      v: ["2 espacios · caja de 250 pzs", "4 espacios · caja de 200 pzs"] },
    { id: "servilleta-larga", nombre: "Servilleta larga", cat: "servilletas-papel", mat: ["papel"], img: "servilleta-larga", uso: "Servilleta para mesa o para llevar",
      desc: "Servilleta de papel de 39.0 x 37.5 cm. Se cotiza por caja.",
      v: ["39.0 x 37.5 cm · caja de 1,200 pzs"] },
    { id: "papel-encerado", nombre: "Papel grado alimenticio encerado", cat: "servilletas-papel", mat: ["papel"], img: "papel-encerado-kraft", uso: "Para envolver alimentos",
      desc: "Papel encerado grado alimenticio, para envolver alimentos. Se cotiza por caja.",
      v: ["Caja de 1,000 pzs"] },
    { id: "papel-rh", nombre: "Papel grado alimenticio RH", cat: "servilletas-papel", mat: ["papel"], img: "papel-rh", uso: "Para envolver alimentos",
      desc: "Papel grado alimenticio RH, para envolver alimentos. Se cotiza por caja.",
      v: ["Caja de 1,000 pzs"] },

    /* ---------------- de la Hoja1 del Excel (con sus precios) ---------------- */
    { id: "tapa-papel-105", nombre: "Tapa para vaso de papel de 32 oz", cat: "tapas-papel", mat: ["ps"], img: "foto-pendiente", uso: "Tapa para vaso de papel de 32 oz",
      desc: "Tapa plana de poliestireno con orificio para vaso de papel de 32 oz (boca 105 mm).",
      v: ["Plana con orificio · boca 105 mm"],
      venta: { linea: "ps", tam: [
        { paq: 120, caja: 960, pPaq: 120.17, pCaja: 826.95, boca: 105, esp: "Boca 105 mm · Material: Poliestireno", sku: "GN-TAPA-PAPEL-105-01", img: null }
      ] } },
    { id: "vaso-pp-fiestero", nombre: "Vaso PP fiestero 9 oz", cat: "vasos-pet", mat: ["pp"], img: "foto-pendiente", uso: "Bebida fría",
      desc: "Vaso de polipropileno de 9 oz para fiestas y eventos.",
      v: ["9 oz"],
      venta: { linea: "pp", tam: [
        { paq: 100, caja: 2500, pPaq: 68.69, pCaja: 1367.13, boca: null, esp: "9 oz · Material: Polipropileno", sku: "GN-VASO-PP-FIESTERO-01", img: null }
      ] } },
    { id: "contenedor-papel", nombre: "Contenedor de papel blanco", cat: "contenedores", mat: ["papel"], img: "contenedor-helado", uso: "Helado, sopa y comida para llevar", fotoPropia: true,
      desc: "Contenedor de papel blanco para alimentos, de 4 a 32 oz.",
      v: ["4 oz · boca 75 mm", "6 oz · boca 95 mm", "8 oz · boca 95 mm", "12 oz · boca 101 mm", "16 oz · boca 115 mm", "32 oz · boca 115 mm"],
      venta: { linea: "papel", tam: [
        { paq: 50, caja: 1000, pPaq: 52.71, pCaja: 914.28, boca: 75, esp: "Boca 75 mm", sku: "GN-CONTENEDOR-PAPEL-01", img: null },
        { paq: 50, caja: 1000, pPaq: 69.27, pCaja: 1245.41, boca: 95, esp: "Boca 95 mm", sku: "GN-CONTENEDOR-PAPEL-02", img: null },
        { paq: 50, caja: 1000, pPaq: 71.4, pCaja: 1287.91, boca: 95, esp: "Boca 95 mm", sku: "GN-CONTENEDOR-PAPEL-03", img: null },
        { paq: 50, caja: 1000, pPaq: 80.54, pCaja: 1470.84, boca: 101, esp: "Boca 101 mm", sku: "GN-CONTENEDOR-PAPEL-04", img: null },
        { paq: 25, caja: 500, pPaq: 59.48, pCaja: 1119.59, boca: 115, esp: "Boca 115 mm", sku: "GN-CONTENEDOR-PAPEL-05", img: null },
        { paq: 25, caja: 500, pPaq: 74.83, pCaja: 1426.55, boca: 115, esp: "Boca 115 mm", sku: "GN-CONTENEDOR-PAPEL-06", img: null }
      ] } },
    { id: "tapa-contenedor", nombre: "Tapa para contenedor de papel", cat: "tapas-contenedor", mat: ["pet", "papel"], img: "foto-pendiente", uso: "Tapa para contenedor de papel",
      desc: "Tapas para el contenedor de papel blanco: domo de PET con orificio, de papel o plana de PET, según la boca.",
      v: ["Domo PET con orificio · boca 75 mm", "Domo PET con orificio · boca 95 mm", "Domo PET con orificio · boca 101 mm", "De papel · boca 115 mm", "Plana PET · boca 115 mm"],
      venta: { linea: "pet", tam: [
        { paq: 50, caja: 1000, pPaq: 58.56, pCaja: 1031.27, boca: 75, esp: "Boca 75 mm · Material: PET", sku: "GN-TAPA-CONTENEDOR-01", img: null },
        { paq: 50, caja: 1000, pPaq: 90.07, pCaja: 1661.44, boca: 95, esp: "Boca 95 mm · Material: PET", sku: "GN-TAPA-CONTENEDOR-02", img: null },
        { paq: 50, caja: 1000, pPaq: 174.78, pCaja: 3355.5, boca: 101, esp: "Boca 101 mm · Material: PET", sku: "GN-TAPA-CONTENEDOR-03", img: null },
        { paq: 25, caja: 500, pPaq: 76.14, pCaja: 1452.74, boca: 115, esp: "Boca 115 mm · Material: Papel", sku: "GN-TAPA-CONTENEDOR-04", img: null },
        { paq: 25, caja: 500, pPaq: 34.32, pCaja: 616.4, boca: 115, esp: "Boca 115 mm · Material: PET", sku: "GN-TAPA-CONTENEDOR-05", img: null }
      ] } },
    { id: "caja-kraft", nombre: "Caja kraft para comida", cat: "cajas-charolas", mat: ["kraft"], img: "contenedor-kraft-rect", uso: "Comida para llevar", fotoPropia: true,
      desc: "Caja kraft para comida para llevar, de 26 a 96 oz.",
      v: ["26 oz · 11 x 9 x 6.5 cm", "45 oz · 15 x 12 x 6.5 cm", "49 oz · 20 x 14 x 5 cm", "66 oz · 20 x 14 x 6.5 cm", "96 oz · 20 x 14 x 9 cm"],
      venta: { linea: "kraft", tam: [
        { paq: 50, caja: 450, pPaq: 129.28, pCaja: 1100.48, boca: null, esp: "11 x 9 x 6.5 cm", sku: "GN-CAJA-KRAFT-01", img: null },
        { paq: 50, caja: 300, pPaq: 180.01, pCaja: 1038.08, boca: null, esp: "15 x 12 x 6.5 cm", sku: "GN-CAJA-KRAFT-02", img: null },
        { paq: 50, caja: 200, pPaq: 203.92, pCaja: 787.7, boca: null, esp: "20 x 14 x 5 cm", sku: "GN-CAJA-KRAFT-03", img: null },
        { paq: 50, caja: 200, pPaq: 223.72, pCaja: 866.88, boca: null, esp: "20 x 14 x 6.5 cm", sku: "GN-CAJA-KRAFT-04", img: null },
        { paq: 40, caja: 160, pPaq: 223.49, pCaja: 871.55, boca: null, esp: "20 x 14 x 9 cm", sku: "GN-CAJA-KRAFT-05", img: null }
      ] } },
    { id: "charola-papas", nombre: "Charola kraft para papas", cat: "cajas-charolas", mat: ["kraft"], img: "charola-kraft", uso: "Papas, alitas y botanas", fotoPropia: true,
      desc: "Charola kraft para papas, alitas y botanas.",
      v: ["Estándar"],
      venta: { linea: "kraft", tam: [
        { paq: 50, caja: 300, pPaq: 33.02, pCaja: 156.11, boca: null, esp: null, sku: "GN-CHAROLA-PAPAS-01", img: null }
      ] } },
    { id: "contenedor-pet", nombre: "Contenedor PET", cat: "cajas-charolas", mat: ["pet"], img: "almeja-transparente", uso: "Comida para llevar", fotoPropia: true,
      desc: "Contenedor transparente de PET para alimentos.",
      v: ["11.5 x 12.5 x 8 cm", "14.5 x 13.3 x 6 cm"],
      venta: { linea: "pet", tam: [
        { paq: 1, caja: 250, pPaq: 2.61, pCaja: 617.54, boca: null, esp: "11.5 x 12.5 x 8 cm", sku: "GN-CONTENEDOR-PET-01", img: null },
        { paq: 1, caja: 250, pPaq: 3.57, pCaja: 858.22, boca: null, esp: "14.5 x 13.3 x 6 cm", sku: "GN-CONTENEDOR-PET-02", img: null }
      ] } },
    { id: "contenedor-pet-pastel", nombre: "Contenedor PET para rebanada de pastel", cat: "cajas-charolas", mat: ["pet"], img: "contenedor-rebanada-pastel", uso: "Rebanada de pastel", fotoPropia: true,
      desc: "Contenedor triangular de PET para una rebanada de pastel.",
      v: ["Triangular"],
      venta: { linea: "pet", tam: [
        { paq: 1, caja: 250, pPaq: 2.62, pCaja: 620.3, boca: null, esp: null, sku: "GN-CONTENEDOR-PET-PASTEL-01", img: null }
      ] } },
    { id: "ensaladera-pet", nombre: "Ensaladera PET con tapa", cat: "ensaladeras", mat: ["pet"], img: "ensaladera-transparente", uso: "Ensaladas y bowls", fotoPropia: true,
      desc: "Ensaladera de PET transparente con tapa, de 18 a 64 oz.",
      v: ["18 oz", "32 oz", "48 oz", "64 oz"],
      venta: { linea: "pet", tam: [
        { paq: 1, caja: 150, pPaq: 6.71, pCaja: 985.24, boca: null, esp: null, sku: "GN-ENSALADERA-PET-01", img: null },
        { paq: 1, caja: 150, pPaq: 7.62, pCaja: 1121.74, boca: null, esp: null, sku: "GN-ENSALADERA-PET-02", img: null },
        { paq: 1, caja: 150, pPaq: 8.63, pCaja: 1274.22, boca: null, esp: null, sku: "GN-ENSALADERA-PET-03", img: null },
        { paq: 1, caja: 100, pPaq: 13.63, pCaja: 1349.11, boca: null, esp: null, sku: "GN-ENSALADERA-PET-04", img: null }
      ] } },
    { id: "souffle", nombre: "Soufflé PP de 2 oz", cat: "souffles", mat: ["pp"], img: "souffle-fecula", uso: "Salsas y aderezos", fotoPropia: true,
      desc: "Vaso soufflé de polipropileno de 2 oz para salsas y aderezos. Su tapa se vende aparte.",
      v: ["2 oz"],
      venta: { linea: "pp", tam: [
        { paq: 100, caja: 2500, pPaq: 42.69, pCaja: 717.33, boca: null, esp: null, sku: "GN-SOUFFLE-01", img: null }
      ] } },
    { id: "tapa-souffle", nombre: "Tapa PET para soufflé de 2 oz", cat: "tapas-contenedor", mat: ["pet"], img: "foto-pendiente", uso: "Tapa para soufflé",
      desc: "Tapa de PET para el soufflé de 2 oz.",
      v: ["2 oz"],
      venta: { linea: "pet", tam: [
        { paq: 100, caja: 2500, pPaq: 39.56, pCaja: 638.91, boca: null, esp: null, sku: "GN-TAPA-SOUFFLE-01", img: null }
      ] } },
    { id: "cono-crepa", nombre: "Cono para crepa", cat: "souffles", mat: [], img: "cono-crepa", uso: "Crepas", fotoPropia: true,
      desc: "Cono porta crepa para servir en la mano.",
      v: ["Estándar"],
      venta: { linea: "otro", tam: [
        { paq: 1, caja: 1000, pPaq: 1.77, pCaja: 1625, boca: null, esp: null, sku: "GN-CONO-CREPA-01", img: null }
      ] } },
    { id: "popote-pla-estuchado", nombre: "Popote PLA estuchado", cat: "popotes", mat: ["pla"], img: "popote-tapioca-estuchado", uso: "Popote para bebida fría",
      desc: "Popote de PLA de 25 cm en sobre individual.",
      v: ["25 cm"],
      venta: { linea: "pla", tam: [
        { paq: 100, caja: 2000, pPaq: 54.24, pCaja: 804.76, boca: null, esp: "Largo 25 cm", sku: "GN-POPOTE-PLA-ESTUCHADO-01", img: null }
      ] } },
    { id: "bolsa-semikraft", nombre: "Bolsa semikraft con fuelle", cat: "bolsas", mat: ["kraft"], img: "srv-bolsa-kraft", uso: "Para llevar", fotoPropia: true,
      desc: "Bolsa de papel semikraft con fuelle, en tres tamaños.",
      v: ["Chica · 25 x 30 x 12 cm", "Mediana · 28 x 35 x 15 cm", "Grande · 30 x 39 x 17 cm"],
      venta: { linea: "kraft", tam: [
        { paq: 50, caja: 250, pPaq: 107.6, pCaja: 502.98, boca: null, esp: "25 x 30 x 12 cm", sku: "GN-BOLSA-SEMIKRAFT-01", img: null },
        { paq: 50, caja: 250, pPaq: 132.02, pCaja: 625.12, boca: null, esp: "28 x 35 x 15 cm", sku: "GN-BOLSA-SEMIKRAFT-02", img: null },
        { paq: 50, caja: 250, pPaq: 151.27, pCaja: 721.35, boca: null, esp: "30 x 39 x 17 cm", sku: "GN-BOLSA-SEMIKRAFT-03", img: null }
      ] } },
    { id: "bobina-egapack", nombre: "Bobina Egapack 600 m", cat: "servilletas-papel", mat: [], img: "foto-pendiente", uso: "Para envolver alimentos",
      desc: "Bobina Egapack de 600 m de largo.",
      v: ["600 m"],
      venta: { linea: "otro", tam: [
        { paq: 1, caja: 6, pPaq: 151.43, pCaja: 907.76, boca: null, esp: "Largo 600 m", sku: "GN-BOBINA-EGAPACK-01", img: null }
      ] } },
    { id: "sanitas", nombre: "Sanitas 24 x 21 cm", cat: "servilletas-papel", mat: ["papel"], img: "foto-pendiente", uso: "Para secar y limpiar",
      desc: "Sanitas de Kimberly-Clark, 24 x 21 cm. Se cotiza por caja.",
      v: ["24 x 21 cm · caja de 20 paquetes"] },

  ];

  /* Ofertas y existencias. desc = % de descuento | agotado = sin stock. */
  var PROMOS = {};

  /* Tapas que le quedan a cada vaso (por boca/onzas). */
  var TAPAS_POR_VASO = {
    "vaso-papel-blanco": [
      "tapa-cafetera-62",
      "tapa-cafetera-80",
      "tapa-cafetera-90",
      "tapa-papel-90"
    ],
    "vaso-papel-negro": [
      "tapa-cafetera-62",
      "tapa-cafetera-80",
      "tapa-cafetera-90",
      "tapa-papel-90"
    ],
    "vaso-papel-kraft": [
      "tapa-cafetera-80",
      "tapa-cafetera-90",
      "tapa-papel-90"
    ],
    "vaso-papel-doble-pared": [
      "tapa-cafetera-80",
      "tapa-cafetera-90",
      "tapa-papel-90"
    ],
    "vaso-pet-78": [
      "tapa-pet-plana-ranura",
      "tapa-pet-plana-sin-ranura",
      "tapa-pet-domo"
    ],
    "vaso-pet-92": [
      "tapa-pet-plana-ranura",
      "tapa-pet-domo"
    ],
    "vaso-pet-95": [
      "tapa-pet-plana-ranura",
      "tapa-pet-domo",
      "tapa-pet-domo-oso",
      "tapa-pet-sorbe-tapon"
    ],
    "vaso-pet-98": [
      "tapa-pet-plana-ranura",
      "tapa-pet-domo",
      "tapa-pet-domo-oso",
      "tapa-pet-sorbe",
      "tapa-pet-sorbe-tapon"
    ],
    "vaso-pet-107": [
      "tapa-pet-plana-ranura",
      "tapa-pet-domo"
    ],
    "vaso-pet-u": [
      "tapa-pet-plana-ranura",
      "tapa-pet-domo",
      "tapa-pet-domo-oso",
      "tapa-pet-sorbe",
      "tapa-pet-sorbe-tapon"
    ],
    "vaso-pp": [
      "tapa-pet-plana-ranura",
      "tapa-pet-domo",
      "tapa-pet-domo-oso",
      "tapa-pet-sorbe-tapon"
    ]
  };

  return {
    CATEGORIAS: CATEGORIAS, MATERIALES: MATERIALES, PRODUCTOS: PRODUCTOS, PROMOS: PROMOS,
    TAPAS_POR_VASO: TAPAS_POR_VASO
  };
})();
