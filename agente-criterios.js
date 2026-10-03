/* GreeNova SC - criterios y base de conocimiento del agente.
   ===========================================================================
   ESTE ES EL ARCHIVO QUE TÚ EDITAS. No hace falta tocar nada más.

   El agente contesta en dos niveles:

   1. RAG  — busca en el catálogo (los productos de productos.js) y en los
             HECHOS de abajo. Si encuentra la respuesta, la da al instante,
             sin llamar a la IA y sin costo.
   2. IA   — si el RAG no alcanza, manda la pregunta a Claude junto con lo que
             sí encontró y con los CRITERIOS de abajo, y Claude resuelve.

   Todo lo que escribas aquí es lo que el agente puede decir. Si un dato no
   está aquí ni en el catálogo, el agente tiene prohibido inventarlo: dice que
   no lo sabe y pasa el contacto de ventas.
   =========================================================================== */
window.GREENOVA_AGENTE = (function () {
  "use strict";

  /* ---------------------------------------------------------------------
     CRITERIOS — las reglas con las que la IA contesta.
     Escríbelas en lenguaje normal. Agrega, quita o cambia lo que quieras.
     --------------------------------------------------------------------- */
  var CRITERIOS = [
    "Eres el asistente de GreeNova SC, empresa mexicana de empaque desechable para el sector alimenticio, con sede en la Ciudad de México.",
    "Hablas español de México, de tú, directo y breve. Dos o tres frases cuando alcance. Nada de relleno ni de lenguaje publicitario.",
    "Solo puedes afirmar datos que aparezcan en el CATÁLOGO o en los HECHOS que se te pasan. Si te preguntan algo que no está ahí, dilo con claridad y ofrece el contacto de ventas. Nunca inventes medidas, materiales, certificaciones ni tiempos.",
    "Menciona el IVA una sola vez por conversación, y solo si hablas de precios.",
    "En la tienda se compra por paquete o por caja, y los precios ya incluyen IVA. Si preguntan cuánto cuesta, da el precio tal como viene en el CATÁLOGO para esa medida y presentación. Si la medida no está en el contexto, di que el precio está en la tienda. NUNCA inventes descuentos ni precios por pieza.",
    "El pedido mínimo es un paquete (o una caja, cuando ese producto solo se vende por caja). NUNCA prometas tiempos de entrega: ventas los confirma con el pedido.",
    "Cuando alguien busque un producto, di la medida exacta y cuántas piezas trae el paquete y la caja, tal como vienen en el catálogo.",
    "Para elegir tapa, lo que importa es el diámetro de boca del vaso, no las onzas. Si te dan onzas, pide la boca o menciona las bocas que existen para esa medida.",
    "Si la persona quiere su logo impreso, explica que hay serigrafía sobre vasos de papel, vasos PET, fajillas y tapas de papel, y que también se hacen contenedores y bolsas a medida. Las tapas de plástico no se pueden imprimir.",
    "Si la persona quiere comprar, dile que agregue sus productos al carrito de la tienda y envíe su pedido, o que escriba a ventas@greenovasc.com.mx / 55 2260 1113.",
    "La gente no pide las cosas como se llaman en el catálogo. Traduce siempre: \"vaso para café\" o \"vaso para bebida caliente\" es el VASO DE PAPEL; \"vaso para bebida fría\", \"vaso para frappé\" o \"vaso transparente\" es el VASO PET. Usa la lista de EQUIVALENCIAS que se te pasa en el contexto y responde con el nombre del catálogo, no con el que usó la persona.",
    "Todo el catálogo está en la tienda, por secciones: vasos, tapas, comida para llevar (contenedores, cajas, charolas, ensaladeras, soufflés y conos), accesorios para bebida y bolsas, servilletas y envoltura. Lo que tiene precio se compra (\"Comprar ahora\"); lo que no tiene precio en la lista se cotiza con \"Pedir cotización\". Platos y cubiertos no están en la tienda: se cotizan con \"Envía tu lista\" o escribiendo a ventas.",
    "SÍ ENVIAMOS A TODO MÉXICO. Si preguntan por cualquier estado, ciudad o pueblo del país, la respuesta es sí: GreeNova envía a nivel nacional desde la Ciudad de México. Lo único que no sabes es el costo y el tiempo del envío: eso lo confirma ventas.",
    "Eres un vendedor, no un buscador. Si alguien describe su negocio o lo que va a servir en vez de pedir un producto por nombre (\"tengo una heladería\", \"vasos para helado\", \"vendo frappés\"), recomiéndale de una vez los productos que le sirven, con la medida exacta y para qué le sirve cada uno. Usa la GUÍA DE USOS que se te pasa; si su caso no está ahí, razona con el catálogo: bebida caliente en vaso de papel, bebida fría o postre en vaso PET, y la tapa según la boca del vaso.",
    "NUNCA escribas nombres de archivo ni rutas (tienda.html, producto.html, .php). Habla como persona: \"en la tienda\". El enlace se lo pone el sitio solo.",
    "Cuando alguien diga que quiere comprar o hacer un pedido, no lo mandes a leer instrucciones. Pregúntale qué productos quiere, en qué medida y cuántos paquetes o cajas de cada uno. Si en el bloque CARRITO ya trae productos, retómalos por nombre y cantidad.",
    "Cierra siempre las conversaciones de compra con el contacto directo: 55 2260 1113 o ventas@greenovasc.com.mx.",
    "No hables de la competencia ni compares con otras marcas.",
    "Si la pregunta no tiene nada que ver con empaque, GreeNova o el pedido, dilo amablemente y reencauza."
  ];

  /* ---------------------------------------------------------------------
     HECHOS — la base de conocimiento fuera del catálogo de productos.
     Cada entrada se busca por separado. Agrega las que quieras.
     --------------------------------------------------------------------- */
  var HECHOS = [
    { t: "Contacto y horario de ventas",
      c: "Correo: ventas@greenovasc.com.mx. Teléfonos: 55 2260 1113 y 55 7051 1149. Sitio: www.greenovasc.com.mx. GreeNova SC está en Cacamatzin 21, Arenal 1ra Secc., Venustiano Carranza, 15600, Ciudad de México." },

    { t: "Dónde estamos: dirección y ubicación",
      c: "GreeNova SC está en Cacamatzin 21, Arenal 1ra Secc., Venustiano Carranza, 15600, Ciudad de México. Desde ahí enviamos a todo México; tú eliges la paquetería al pagar." },

    { t: "Cómo se compra: paquete o caja",
      c: "En la tienda cada producto se compra por paquete o por caja. Cada medida dice cuántas piezas trae el paquete y cuántas la caja, y su precio con IVA incluido. El pedido mínimo es un paquete." },

    { t: "Materiales que se manejan",
      c: "Vasos de papel (blanco, negro, kraft, doble pared y de color), vasos de PET y de polipropileno (PP), tapas de poliestireno (PS), polipropileno (PP), PET y papel, fajillas de kraft y removedores de madera." },

    { t: "Envíos a todo México",
      c: "Sí, GreeNova envía a todo el país. La salida es desde la Ciudad de México hacia cualquier estado de la República. El costo y el tiempo dependen del destino y del volumen; ventas los confirma con el pedido." },

    { t: "Imprimir tu logo: serigrafía y personalización",
      c: "GreeNova imprime tu logo en serigrafía sobre vasos de papel, vasos PET, fajillas y tapas de papel. También diseña y produce contenedores para alimentos a medida, con o sin impresión, y bolsas de papel bond y kraft personalizadas, con o sin asa. Las tapas de plástico no se imprimen." },

    { t: "Cómo elegir la tapa correcta",
      c: "La tapa se elige por el diámetro de boca del vaso, no por las onzas. Vasos de papel: boca 62 mm (4 oz), 80 mm (8 oz) y 90 mm (10 a 20 oz). Vasos PET: bocas de 78, 90, 92, 95, 98 y 107 mm. En la tienda, al ver un vaso, salen las tapas de su misma boca." },

    { t: "Qué hay en la tienda y qué se cotiza",
      c: "Todo el catálogo 2026 está en la tienda. Con precio en línea: vasos de papel, PET y PP; tapas para vaso y para contenedor; contenedor de papel blanco de 4, 6, 8, 12, 16 y 32 oz; caja kraft de 26, 45, 49, 66 y 96 oz; charola kraft para papas; contenedor PET; contenedor PET para rebanada de pastel; ensaladera PET con tapa de 18, 32, 48 y 64 oz; soufflé PP de 2 oz y su tapa; cono para crepa; fajillas; removedores; popote de tapioca estuchado; popote PLA estuchado de 25 cm; portavasos charola de 2 y 4 espacios; bolsa semikraft con fuelle chica, mediana y grande, y bobina Egapack de 600 m. Sin precio en línea, se cotizan con \"Pedir cotización\": popote de tapioca a granel (caja de 5 kg), popote cuchara, portavasos con asa, servilleta larga, papel grado alimenticio RH y encerado, Sanitas y la tapa negra de poliestireno para vaso de 8 oz. Platos y cubiertos no están en la tienda: se piden con \"Envía tu lista\" o escribiendo a ventas." },

    { t: "Accesorios que se cotizan: popote cuchara, portavasos con asa, servilleta y papel",
      c: "Salen en la tienda sin precio en línea; se cotizan con el botón \"Pedir cotización\". Portavasos con asa de 2 espacios (caja de 250) y de 4 espacios (caja de 200); servilleta larga de 39.0 x 37.5 cm (caja de 1,200); papel grado alimenticio RH y encerado, para envolver alimentos (caja de 1,000); popote de tapioca biodegradable de 21 cm (caja de 5 kg) y popote cuchara biodegradable de 26 cm (caja de 5 kg)." },

    { t: "Cómo hacer un pedido",
      c: "Agrega a tu carrito lo que necesitas, por paquete o por caja, y envía tu pedido desde la tienda. Si prefieres, escribe directo a ventas@greenovasc.com.mx o al 55 2260 1113." }
  ];

  /* ---------------------------------------------------------------------
     EQUIVALENCIAS — cómo lo pide la gente vs. cómo se llama en el catálogo.
     Si alguien escribe cualquier palabra de "dice", la búsqueda agrega en
     silencio las palabras de "es" antes de buscar, para que salgan los
     productos correctos aunque nadie los haya nombrado.
     Agrega las que se te ocurran; se aplican solas.
     --------------------------------------------------------------------- */
  var SINONIMOS = [
    { dice: ["cafe", "café", "capuchino", "capuccino", "americano", "latte", "te", "té",
             "bebida caliente", "bebidas calientes", "linea caliente", "chocolate caliente",
             "atole", "coffee", "to go", "cafeteria", "cafetería", "barra"],
      es: "vaso de papel bebida caliente",
      busca: ["vaso de papel"] },

    { dice: ["bebida fria", "bebidas frias", "bebida fría", "bebidas frías", "linea fria",
             "frappe", "frappé", "licuado", "smoothie", "jugo", "agua fresca", "refresco",
             "michelada", "cerveza", "vaso transparente", "vaso de plastico", "vaso de plástico",
             "cristal", "hielo"],
      es: "vaso PET bebida fria transparente",
      busca: ["vaso pet"] },

    { dice: ["tapa", "tapas", "tapita", "lid"],
      es: "tapa para vaso",
      busca: ["tapa"] },

    { dice: ["removedor", "stirrer", "palito", "agitador", "agitar"],
      es: "removedor de madera",
      busca: ["removedor"] },

    { dice: ["manga", "funda", "cinturon", "cinturón", "sleeve", "quema", "caliente la mano"],
      es: "fajilla kraft para vaso",
      busca: ["fajilla"] },

    { dice: ["domo", "tapa transparente", "tapa alta", "crema batida"],
      es: "tapa PET domo",
      busca: ["domo"] },

    { dice: ["envio", "envío", "envian", "envían", "envias", "envías", "mandan", "mandas",
             "llega", "llegan", "paqueteria", "paquetería", "flete", "foraneo", "foráneo",
             "tlaxcala", "puebla", "hidalgo", "queretaro", "querétaro", "guanajuato", "jalisco",
             "guadalajara", "monterrey", "nuevo leon", "nuevo león", "merida", "mérida", "yucatan",
             "yucatán", "cancun", "cancún", "quintana roo", "tijuana", "baja california", "oaxaca",
             "veracruz", "chiapas", "sonora", "sinaloa", "michoacan", "michoacán", "guerrero",
             "acapulco", "morelos", "cuernavaca", "toluca", "estado de mexico", "estado de méxico",
             "provincia", "interior de la republica", "interior de la república", "foraneos"],
      es: "envios a todo Mexico nacional desde la Ciudad de Mexico",
      busca: [] },

    { dice: ["plato", "platos", "cubiertos", "cuchara", "tenedor", "cuchillo"],
      es: "productos que se cotizan platos cubiertos complementos",
      busca: [] },

    { dice: ["contenedor", "contenedores", "comida para llevar", "sopa"],
      es: "contenedor",
      busca: ["contenedor", "caja kraft"] },

    { dice: ["bowl", "bowls", "ensaladera", "ensaladeras"],
      es: "ensaladera",
      busca: ["ensaladera"] },

    { dice: ["souffle", "salsero", "salseros", "aderezo", "salsa"],
      es: "souffle",
      busca: ["souffle"] },

    { dice: ["bolsa", "bolsas"],
      es: "bolsa",
      busca: ["bolsa"] },

    { dice: ["donde estan", "donde se ubican", "ubicacion", "ubicados", "direccion", "domicilio",
             "sucursal", "tienda fisica", "como llego", "donde quedan", "su oficina", "sus oficinas"],
      es: "donde estamos direccion ubicacion Cacamatzin Ciudad de Mexico",
      busca: [] },

    /* Los que ya están en la tienda aunque se coticen. */
    { dice: ["popote", "pajilla", "pajita", "sorbete", "carrizo", "straw"],
      es: "popote",
      busca: ["popote"] },

    { dice: ["servilleta", "napkin"],
      es: "servilleta",
      busca: ["servilleta"] },

    { dice: ["portavasos", "porta vasos", "portavaso", "cargador de vasos", "charola para vasos"],
      es: "portavasos",
      busca: ["portavasos"] },

    { dice: ["papel encerado", "papel para envolver", "papel antigrasa", "papel para hamburguesa",
             "papel para tortas", "envolver"],
      es: "papel grado alimenticio",
      busca: ["papel grado alimenticio"] }
  ];

  /* ---------------------------------------------------------------------
     GIROS — cómo vende un vendedor con sentido común.

     Gabriel (2026-10-03): "alguien que abrió una heladería busca vasos para
     helado y le tienen que salir las opciones que podrían ser buenas para
     helado, y así con todos nuestros productos". Cuando alguien no pregunta
     por un producto sino por su NECESIDAD ("tengo una heladería", "vasos para
     frappé", "vendo micheladas"), el asistente y el buscador de la tienda le
     enseñan esta lista, con foto, medida y para qué le sirve cada cosa.

     `nombre`  cómo se llama el uso (sale de título en la tienda y en la ficha)
     `dice`    las palabras con las que la gente lo describe
     `intro`   la frase con la que abre el asistente
     `recs`    lo que se recomienda, en orden:
               { id, v, por }  un producto de la tienda; `v` es el principio
                               de la medida tal como está en el catálogo
                               ("4 oz", "Boca 95 mm", "Blanco · 12 oz")
               { cotiza, por } algo de COTIZA (abajo), que no se vende en línea

     El orden de la tabla importa: gana el primer uso que coincida. Por eso
     los jugos van antes que la fruta en vaso ("jugo de fruta" es jugo).
     Para agregar un uso nuevo basta con una entrada más.
     --------------------------------------------------------------------- */
  /* EL ORDEN IMPORTA: gana el primer uso que coincida. Por eso van primero
     los lugares cuyas frases traen palabras de otros usos ("cafetería
     escolar" es escuela, "cafetería del hospital" es oficina, "café frío" es
     frappé, "café de olla" es atole), luego lo específico (pizzería, sushi) y
     al final lo genérico (bar, eventos, restaurante): "restaurante de sushi"
     es sushi y "bar de mariscos" es marisquería. */
  var GIROS = [
    { nombre: "Escuelas y cooperativas",
      dice: ["escuela", "colegio", "primaria", "secundaria", "prepa", "preparatoria", "universidad",
             "cooperativa", "cooperativa escolar", "cafeteria escolar", "guarderia", "kinder"],
      intro: "Para escuelas y cooperativas:",
      recs: [
        { id: "vaso-pet-78", v: "9 oz", por: "Fruta picada, gelatina o yogurt." },
        { id: "tapa-pet-plana-sin-ranura", v: "Boca 78 mm", por: "Cierra parejo, sin hoyo: no se sale nada." },
        { id: "vaso-pet-95", v: "12 oz", por: "Agua fresca o jugo." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para ese vaso, con ranura para popote." },
        { id: "popote-tapioca-estuchado", v: "21 cm", por: "Popote en sobre individual, más higiénico." },
        { id: "papel-encerado", v: "Caja", por: "Para envolver tortas y sándwiches." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Oficinas, consultorios y hospitales",
      /* "oficina" sola no: "¿dónde está su oficina?" es pregunta por GreeNova. */
      dice: ["para oficina", "para la oficina", "para mi oficina", "en la oficina", "oficinas corporativas",
             "corporativo", "comedor de empleados", "consultorio", "clinica", "hospital", "cafeteria del hospital",
             "garrafon", "dispensador de agua", "enfriador de agua", "sala de espera", "recepcion",
             "coworking", "despacho"],
      intro: "Para oficinas, consultorios y salas de espera:",
      recs: [
        { id: "vaso-papel-blanco", v: "4 oz", por: "Agua del garrafón." },
        { id: "vaso-pet-78", v: "7 oz", por: "Agua o refresco." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "El café de la oficina." },
        { id: "tapa-cafetera-80", v: "Blanca · poliestireno", por: "La tapa de ese vaso." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Hoteles",
      dice: ["hotel", "motel", "hostal", "airbnb", "room service", "buffet", "desayuno buffet",
             "amenidades", "habitacion", "spa"],
      intro: "Para hoteles:",
      recs: [
        { id: "vaso-papel-blanco", v: "8 oz", por: "Café de la habitación o del buffet." },
        { id: "tapa-cafetera-80", v: "Blanca · poliestireno", por: "La tapa de ese vaso." },
        { id: "vaso-papel-doble-pared", v: "Blanco · 12 oz", por: "Café para llevar del lobby." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { id: "vaso-pet-95", v: "9 oz", por: "El jugo del desayuno." },
        { id: "portavaso-charola", v: "2 espacios", por: "Room service de dos bebidas." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Frappés y café frío",
      dice: ["frappe", "frapuccino", "frappuccino", "cafe frio", "iced coffee", "iced latte", "cold brew",
             "moka frio", "cafe helado"],
      intro: "Para frappés y café frío:",
      recs: [
        { id: "vaso-pet-98", v: "16 oz", por: "El tamaño clásico del frappé." },
        { id: "tapa-pet-domo", v: "Boca 98 mm", por: "Para ese vaso; deja espacio a la crema batida." },
        { id: "vaso-pet-92", v: "12 oz", por: "Frappé chico o iced latte." },
        { id: "tapa-pet-sorbe", v: "Boca 98 mm", por: "Café frío para tomar sin popote." },
        { id: "popote-tapioca", v: "21 cm", por: "Popote biodegradable." },
        { id: "portavaso-asa", v: "4 espacios", por: "Para llevar cuatro bebidas." }
      ] },

    { nombre: "Tamales, atole y desayunos",
      dice: ["tamal", "tamales", "tamaleria", "atole", "atoleria", "champurrado", "cafe de olla",
             "chocolate caliente", "guajolota", "chilaquiles"],
      intro: "Para tamales, atole y desayunos:",
      recs: [
        { id: "vaso-papel-kraft", v: "12 oz", por: "Atole, champurrado o café de olla." },
        { id: "vaso-papel-kraft", v: "8 oz", por: "La medida chica." },
        { id: "tapa-cafetera-90", v: "Blanca 3 óvalos · poliestireno", por: "La tapa del vaso de 12 oz." },
        { id: "tapa-cafetera-80", v: "Blanca · poliestireno", por: "La tapa del vaso de 8 oz." },
        { id: "papel-encerado", v: "Caja", por: "Para envolver tamales y guajolotas." },
        { id: "bolsa-semikraft", v: "Mediana", por: "Para llevar el pedido." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Helado y nieve",
      dice: ["helado", "heladeria", "nieve", "neveria", "paleteria", "michoacana", "gelato", "gelateria",
             "yogurt helado", "frozen yogurt", "malteada", "sundae", "banana split", "raspado", "granizado",
             "chamoyada", "mangonada", "nieve de garrafa"],
      intro: "Para helado y nieve, esto es lo que mejor funciona:",
      recs: [
        { id: "vaso-papel-blanco", v: "4 oz", por: "Una bola, probaditas o porción para niños." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "Dos bolas o una copa con toppings." },
        { id: "vaso-papel-negro", v: "8 oz", por: "El mismo tamaño en negro: se ve más gourmet." },
        { id: "vaso-papel-blanco", v: "12 oz", por: "Tres bolas, o helado para compartir." },
        { id: "contenedor-papel", v: "16 oz", por: "Helado para llevar; lo hay de 4 a 32 oz." },
        { id: "tapa-contenedor", v: "De papel · boca 115 mm", por: "La tapa de ese contenedor." },
        { id: "vaso-pet-95", v: "12 oz", por: "Malteadas, nieves y raspados: se luce el color." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Para ese vaso; deja espacio a la crema y los toppings." },
        { id: "popote-cuchara", v: "26 cm", por: "Para nieves, raspados y chamoyadas: es popote y cuchara." }
      ] },

    { nombre: "Cafetería",
      dice: ["cafeteria", "coffee shop", "barista", "barra de cafe", "negocio de cafe", "vendo cafe",
             "cafe para llevar", "cafe de especialidad", "torrefactora", "teteria", "espresso bar",
             "carrito de cafe", "cafe movil", "cafe", "capuchino", "cappuccino", "latte", "americano",
             "espresso", "expreso", "te chai", "desayuno", "almuerzo"],
      intro: "Para cafetería, el arranque típico es:",
      recs: [
        { id: "vaso-papel-blanco", v: "12 oz", por: "Latte, capuchino y americano." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "Americano chico o flat white." },
        { id: "vaso-papel-negro", v: "4 oz", por: "Espresso y cortado." },
        { id: "tapa-cafetera-62", v: "Negra", por: "La tapa del vaso de 4 oz." },
        { id: "vaso-papel-doble-pared", v: "Blanco · 12 oz", por: "Bebidas muy calientes: la doble pared cuida la mano." },
        { id: "tapa-cafetera-90", v: "Negra · poliestireno", por: "La tapa de los vasos de 10 a 20 oz." },
        { id: "fajilla-kraft", v: "Ajustable", por: "Para que el vaso de 10 a 16 oz no queme." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { id: "portavaso-charola", v: "4 espacios", por: "Pedidos de cuatro bebidas para llevar." }
      ] },

    { nombre: "Jugos, licuados y smoothies",
      dice: ["jugueria", "jugo", "licuado", "smoothie", "batido", "proteina", "gimnasio", "gym",
             "crossfit", "nutricion", "club de nutricion", "jugo verde", "jugos naturales"],
      intro: "Para jugos, licuados y smoothies:",
      recs: [
        { id: "vaso-pet-95", v: "16 oz", por: "Jugo o licuado mediano." },
        { id: "vaso-pet-95", v: "20 oz", por: "Licuado grande." },
        { id: "vaso-pet-u", v: "16 oz", por: "Smoothie: la forma en U se ve más premium." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para el vaso de boca 95, con ranura para popote." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Si lleva fruta o granola encima." },
        { id: "popote-tapioca-estuchado", v: "21 cm", por: "Popote en sobre individual, para llevar." },
        { id: "portavaso-asa", v: "4 espacios", por: "Para llevar cuatro bebidas." }
      ] },

    { nombre: "Bubble tea",
      dice: ["bubble tea", "bubble", "boba", "te de tapioca", "bebida de tapioca", "milk tea", "matcha",
             "taro", "te de burbujas"],
      intro: "Para bubble tea y bebidas con tapioca:",
      recs: [
        { id: "vaso-pet-u", v: "16 oz", por: "La forma en U de las barras de bubble tea." },
        { id: "vaso-pet-u", v: "24 oz", por: "Tamaño grande." },
        { id: "vaso-pp", v: "En U · 16 oz", por: "Para el milk tea caliente." },
        { id: "tapa-pet-domo-oso", v: "Boca 90 mm", por: "Domo con orejas de oso: la foto que todos suben." },
        { id: "tapa-pet-plana-ranura", v: "Boca 90 mm", por: "Tapa plana para popote." },
        { id: "popote-tapioca", v: "21 cm", por: "Popote biodegradable de 21 cm." }
      ] },

    { nombre: "Aguas frescas y limonadas",
      dice: ["agua fresca", "agua de jamaica", "horchata", "limonada", "naranjada", "agua de sabor",
             "te helado", "tepache", "tejuino"],
      intro: "Para aguas frescas y limonadas:",
      recs: [
        { id: "vaso-pet-95", v: "16 oz", por: "Agua mediana." },
        { id: "vaso-pet-98", v: "24 oz", por: "Agua grande." },
        { id: "vaso-pet-107", v: "32 oz", por: "La de casi un litro." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para el vaso de boca 95, con ranura para popote." },
        { id: "tapa-pet-sorbe-tapon", v: "Boca 98 mm", por: "Se toma sin popote y el tapón la cierra para llevar." },
        { id: "popote-pla-estuchado", v: "25 cm", por: "Popote en sobre individual, para llevar." },
        { id: "popote-tapioca", v: "21 cm", por: "Popote biodegradable." }
      ] },

    { nombre: "Mariscos",
      dice: ["marisqueria", "mariscos", "coctel de camaron", "coctel de mariscos", "campechana", "aguachile",
             "ceviche", "ostiones", "ostioneria", "vuelve a la vida", "mariscada"],
      intro: "Para marisquería:",
      recs: [
        { id: "vaso-pet-78", v: "10 oz", por: "Coctel chico." },
        { id: "tapa-pet-plana-sin-ranura", v: "Boca 78 mm", por: "Cierra sin hoyo: no se sale el caldo." },
        { id: "vaso-pet-95", v: "16 oz", por: "Coctel grande o campechana." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Para ese vaso, si va para llevar." },
        { id: "vaso-pet-107", v: "32 oz", por: "La michelada de la casa." },
        { id: "souffle", v: "2 oz", por: "Para la salsa y el limón." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Fruta, esquites y postres en vaso",
      dice: ["fruteria", "fruta picada", "fruta", "coctel de frutas", "esquite", "elote", "elote en vaso",
             "fresas con crema", "gelatina", "postre", "postre en vaso", "yogurt", "yogur", "parfait",
             "botana", "snack", "trolelote"],
      intro: "Para fruta, esquites y postres en vaso:",
      recs: [
        { id: "vaso-pet-78", v: "9 oz", por: "Fruta picada, gelatina o postre individual." },
        { id: "tapa-pet-plana-sin-ranura", v: "Boca 78 mm", por: "Cierra parejo, sin hoyo: no se sale nada." },
        { id: "vaso-pet-95", v: "12 oz", por: "Fresas con crema o yogurt con granola." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Para ese vaso, si lleva crema o toppings." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "Esquites calientes." },
        { id: "vaso-papel-blanco", v: "12 oz", por: "Esquite grande." }
      ] },

    { nombre: "Pizzería",
      dice: ["pizza", "pizzeria", "calzone", "comida italiana", "pasta"],
      intro: "Para pizzería, lo que acompaña a la pizza:",
      recs: [
        { id: "vaso-pet-95", v: "16 oz", por: "Refresco o agua, en mesa o para llevar." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para ese vaso, con ranura para popote." },
        { id: "vaso-papel-color-44", v: "Rojo", por: "Refresco grande para compartir." },
        { id: "souffle", v: "2 oz", por: "Aderezo, chile de aceite o salsa aparte." },
        { id: "papel-rh", v: "Caja", por: "Para servir la rebanada o forrar la charola." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." },
        { id: "portavaso-asa", v: "4 espacios", por: "Para que el repartidor lleve las bebidas." }
      ] },

    { nombre: "Hamburguesas, alitas y comida rápida",
      dice: ["hamburguesa", "hamburgueseria", "hot dog", "hotdog", "alitas", "boneless", "papas a la francesa",
             "papas fritas", "pollo frito", "comida rapida", "food truck", "snack bar", "food court",
             "plaza comercial"],
      intro: "Para hamburguesas, alitas y comida rápida:",
      recs: [
        { id: "papel-encerado", v: "Caja", por: "Para envolver hamburguesas y hot dogs." },
        { id: "charola-papas", v: "Estándar", por: "Para papas, alitas y boneless." },
        { id: "souffle", v: "2 oz", por: "Para cátsup, aderezos y salsas." },
        { id: "vaso-papel-color-44", v: "Rojo", por: "Refresco grande; también en azul y en gris." },
        { id: "vaso-papel-blanco", v: "32 oz", por: "Refresco mediano." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." },
        { id: "portavaso-asa", v: "4 espacios", por: "Para llevar cuatro bebidas." }
      ] },

    { nombre: "Tacos, tortas y antojitos",
      dice: ["taco", "taqueria", "torta", "torteria", "quesadilla", "gordita", "sope", "tlacoyo", "burrito",
             "garnacha", "antojito", "carnitas", "barbacoa", "birria", "consome", "tostada", "flauta",
             "pambazo", "huarache", "taquiza"],
      intro: "Para tacos, tortas y antojitos:",
      recs: [
        { id: "papel-encerado", v: "Caja", por: "Para envolver tacos, tortas y burritos." },
        { id: "papel-rh", v: "Caja", por: "Para forrar el plato o la charola." },
        { id: "souffle", v: "2 oz", por: "Para las salsas." },
        { id: "vaso-papel-blanco", v: "12 oz", por: "Consomé de barbacoa o de birria." },
        { id: "tapa-cafetera-90", v: "Blanca 3 óvalos · poliestireno", por: "La tapa de ese vaso." },
        { id: "vaso-pet-95", v: "16 oz", por: "El agua fresca." },
        { id: "tapa-pet-sorbe-tapon", v: "Boca 95 mm", por: "Con tapón: el agua no se tira en el camino." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Ensaladas y comida saludable",
      dice: ["ensalada", "poke", "bowl", "comida saludable", "saludable", "fit", "vegana", "vegano",
             "vegetariana", "healthy", "acai"],
      intro: "Para ensaladas y comida saludable:",
      recs: [
        { id: "ensaladera-pet", v: "32 oz", por: "Ensaladas y pokes, con tapa; de 18 a 64 oz." },
        { id: "souffle", v: "2 oz", por: "El aderezo aparte." },
        { id: "vaso-pet-u", v: "16 oz", por: "Smoothie o jugo verde." },
        { id: "tapa-pet-domo", v: "Boca 90 mm", por: "Para ese vaso, si lleva fruta o granola encima." },
        { id: "vaso-pet-78", v: "9 oz", por: "Fruta o yogurt con granola." },
        { id: "tapa-pet-plana-sin-ranura", v: "Boca 78 mm", por: "La tapa de ese vaso, sin hoyo." },
        { id: "popote-tapioca-estuchado", v: "21 cm", por: "Popote en sobre individual." }
      ] },

    { nombre: "Sushi y comida asiática",
      dice: ["sushi", "comida japonesa", "comida china", "ramen", "wok", "comida thai", "asiatica",
             "oriental", "teriyaki", "dumplings", "gyozas", "chop suey"],
      intro: "Para sushi y comida asiática:",
      recs: [
        { id: "caja-kraft", v: "26 oz", por: "Arroz, wok o rollos." },
        { id: "souffle", v: "2 oz", por: "Soya, salsa de anguila o chipotle." },
        { id: "contenedor-papel", v: "16 oz", por: "Sopa o ramen para llevar." },
        { id: "vaso-pet-95", v: "16 oz", por: "Té helado." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para ese vaso, con ranura para popote." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Panadería y pastelería",
      dice: ["panaderia", "pan dulce", "pasteleria", "reposteria", "pastel", "cupcake", "galleta", "dona",
             "churro", "churreria", "bizcocheria"],
      intro: "Para panadería y pastelería:",
      recs: [
        { id: "bolsa-semikraft", v: "Mediana", por: "Bolsas de papel para el pan." },
        { id: "contenedor-pet-pastel", v: "Triangular", por: "Rebanada de pastel para llevar." },
        { id: "vaso-papel-kraft", v: "12 oz", por: "Café o chocolate para acompañar." },
        { id: "tapa-cafetera-90", v: "Blanca 3 óvalos · poliestireno", por: "La tapa de ese vaso." },
        { id: "tapa-papel-90", v: "Blanca", por: "La misma medida en tapa de papel, si quieres menos plástico." },
        { id: "papel-encerado", v: "Caja", por: "Para envolver pan y sándwiches." }
      ] },

    { nombre: "Crepas y waffles",
      dice: ["crepa", "creperia", "waffle", "wafle", "hot cakes", "hotcakes"],
      intro: "Para crepas y waffles:",
      recs: [
        { id: "cono-crepa", v: "Estándar", por: "Para servir la crepa en la mano." },
        { id: "papel-encerado", v: "Caja", por: "Para envolver el waffle." },
        { id: "vaso-papel-kraft", v: "12 oz", por: "Café o chocolate caliente." },
        { id: "tapa-cafetera-90", v: "Negra · poliestireno", por: "La tapa de ese vaso." },
        { id: "vaso-pet-98", v: "16 oz", por: "Frappé para acompañar." },
        { id: "tapa-pet-domo", v: "Boca 98 mm", por: "Para ese vaso, con crema batida." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Cine, palomitas y eventos masivos",
      dice: ["cine", "palomitas", "dulceria", "feria", "estadio", "kermes", "concierto", "festival",
             "arena", "autocinema", "refresco"],
      intro: "Para cine, palomitas y eventos masivos:",
      recs: [
        { id: "vaso-papel-color-44", v: "Rojo", por: "Refresco grande; también en azul y en gris." },
        { id: "vaso-papel-blanco", v: "44 oz", por: "Refresco grande o palomitas." },
        { id: "vaso-papel-blanco", v: "32 oz", por: "Refresco mediano." },
        { id: "tapa-papel-105", v: "Plana", por: "La tapa del vaso de papel de 32 oz." },
        { id: "vaso-pet-107", v: "32 oz", por: "Michelada o refresco de casi un litro." },
        { id: "tapa-pet-plana-ranura", v: "Boca 107 mm", por: "Para ese vaso, con ranura para popote." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Micheladas y bar",
      dice: ["michelada", "chela", "cerveza", "cerveceria", "cerveza artesanal", "bar", "cantina", "antro",
             "club", "discoteca", "karaoke", "billar", "clamato", "cocteleria", "coctel", "mezcaleria",
             "pulqueria", "terraza", "beach club"],
      intro: "Para micheladas y barra:",
      recs: [
        { id: "vaso-pet-107", v: "32 oz", por: "La michelada grande." },
        { id: "vaso-pet-98", v: "24 oz", por: "Michelada mediana o cerveza de barril." },
        { id: "vaso-pet-98", v: "16 oz", por: "Cerveza o coctel." },
        { id: "tapa-pet-plana-ranura", v: "Boca 107 mm", por: "Para la de 32 oz, si se va para llevar." },
        { id: "popote-tapioca", v: "21 cm", por: "Popote biodegradable." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Eventos y catering",
      dice: ["evento", "fiesta", "catering", "banquete", "boda", "xv anos", "quince anos", "bautizo",
             "primera comunion", "posada", "graduacion", "coffee break", "congreso", "convencion", "expo",
             "cumpleanos", "baby shower"],
      intro: "Para eventos, catering y coffee break:",
      recs: [
        { id: "vaso-papel-blanco", v: "8 oz", por: "Café y té." },
        { id: "tapa-cafetera-80", v: "Blanca · poliestireno", por: "La tapa de ese vaso." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { id: "vaso-pet-95", v: "9 oz", por: "Agua, refresco o jugo." },
        { id: "vaso-pet-78", v: "7 oz", por: "Shots, degustaciones o postres mini." },
        { id: "vaso-pp-fiestero", v: "9 oz", por: "Vaso fiestero para refresco o agua." },
        { id: "souffle", v: "2 oz", por: "Salsas y aderezos de la mesa." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." },
        { id: "portavaso-charola", v: "4 espacios", por: "Para repartir bebidas en charola." }
      ] },

    { nombre: "Tiendas de conveniencia y gasolineras",
      dice: ["tienda de conveniencia", "abarrotes", "miscelanea", "minisuper", "tiendita", "gasolinera",
             "cafe de maquina", "maquina de cafe", "autoservicio"],
      intro: "Para tiendas de conveniencia y gasolineras:",
      recs: [
        { id: "vaso-papel-blanco", v: "12 oz", por: "Café de máquina." },
        { id: "vaso-papel-blanco", v: "16 oz", por: "Café grande." },
        { id: "tapa-cafetera-90", v: "Negra · poliestireno", por: "La tapa de esos vasos." },
        { id: "fajilla-kraft", v: "Pegada", por: "Para que el vaso no queme." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { id: "vaso-papel-color-44", v: "Rojo", por: "Refresco de máquina grande." }
      ] },

    { nombre: "Restaurantes y comida para llevar",
      dice: ["restaurante", "fonda", "cocina economica", "comida corrida", "comedor", "comida para llevar",
             "para llevar", "delivery", "rappi", "uber eats", "didi food", "dark kitchen", "menu del dia"],
      intro: "Para restaurantes y comida para llevar:",
      recs: [
        { id: "caja-kraft", v: "45 oz", por: "El guisado o el plato fuerte." },
        { id: "contenedor-papel", v: "12 oz", por: "Sopa, arroz o frijoles." },
        { id: "souffle", v: "2 oz", por: "Salsas y aderezos." },
        { id: "tapa-souffle", v: "2 oz", por: "La tapa del soufflé, para llevar." },
        { id: "contenedor-pet", v: "11.5", por: "Transparente: ensalada o postre para llevar." },
        { id: "vaso-pet-95", v: "16 oz", por: "El agua del día." },
        { id: "tapa-pet-sorbe-tapon", v: "Boca 95 mm", por: "Con tapón: no se tira en el camino." },
        { id: "bolsa-semikraft", v: "Mediana", por: "Para entregar el pedido." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." },
        { id: "portavaso-asa", v: "4 espacios", por: "Para que el repartidor lleve las bebidas." }
      ] },

    { nombre: "Negocio nuevo",
      dice: ["abrir un negocio", "voy a abrir", "empezando", "emprender", "negocio nuevo",
             "que me recomiendas", "no se que necesito", "asesorame"],
      intro: "Depende del giro, pero para bebidas lo que casi nadie deja fuera es:",
      recs: [
        { id: "vaso-papel-blanco", v: "12 oz", por: "Bebida caliente." },
        { id: "tapa-cafetera-90", v: "Negra · poliestireno", por: "Su tapa." },
        { id: "vaso-pet-98", v: "16 oz", por: "Bebida fría." },
        { id: "tapa-pet-domo", v: "Boca 98 mm", por: "Su tapa." },
        { id: "servilleta-larga", v: "39.0", por: "Servilleta de 39 x 37.5 cm." }
      ] }
  ];

  /* ---------------------------------------------------------------------
     COTIZA — lo de la hoja de Excel que no está en la tienda: se pide con
     "Envía tu lista". El asistente lo recomienda igual que lo demás.
     (Popotes, portavasos, servilletas y papel ya están en la tienda: se
     cotizan desde su ficha.) `img` es la foto de assets/prod/; `pide` abre
     la tienda con el aviso de cotización.
     --------------------------------------------------------------------- */
  var COTIZA = {
    /* Vacía desde el 2026-10-03: todo el catálogo ya está en la tienda (con
       precio, o con "Pedir cotización" si no lo tiene). Si algún día hay que
       recomendar algo que no esté en la tienda, va aquí:
       "id": { nombre: "…", v: "…", img: "foto de assets/prod", pide: "…" } */
  };

  /* ---------------------------------------------------------------------
     FOTOS CON COMIDA — la foto de cada producto en uso, con su bebida o su
     comida (Gabriel, 2026-10-03: "vendiéndoles el sueño"). Se guardan en
     assets/uso/<f>.webp, cuadradas de 900 px.
     La clave es el id del producto (o del renglón de COTIZA). Si una medida
     se usa para algo muy distinto, va aparte con "id|medida": el vaso blanco
     de 4 oz sale con helado aunque el de 12 oz salga con café.
     Mientras un producto no tenga la suya, se usa su foto de estudio.
     --------------------------------------------------------------------- */
  var FOTOS_USO = {
    /* 05 · vaso de doble pared con latte (una foto por color) */
    "vaso-papel-doble-pared": { f: "vaso-papel-doble-pared-blanco", alt: "Latte con arte en vaso de papel de doble pared blanco." },
    "vaso-papel-doble-pared|Negro": { f: "vaso-papel-doble-pared-negro", alt: "Latte con arte en vaso de papel de doble pared negro." },
    "vaso-papel-doble-pared|Genérico": { f: "vaso-papel-doble-pared-generico", alt: "Latte con arte en vaso de papel de doble pared con estampado verde." }
  };

  /* Preguntas sugeridas que aparecen al abrir el chat. */
  var SUGERENCIAS = [
    "¿Qué vasos me sirven para helado?",
    "Voy a abrir una cafetería, ¿qué necesito?",
    "¿Qué tapa va con un vaso de 12 oz?",
    "¿Pueden imprimir mi logo?"
  ];

  /* Cuando ni el RAG ni la IA pueden contestar. */
  var SALIDA = "Eso no lo tengo confirmado y prefiero no inventarlo. " +
               "Escríbele a ventas: ventas@greenovasc.com.mx o 55 2260 1113, ahí te lo resuelven.";

  /* =====================================================================
     De aquí para abajo ya no hace falta tocar nada: son las funciones con
     las que el asistente, la tienda y la ficha de producto leen las tablas.
     ===================================================================== */
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  /* ---------- faltas de ortografía ----------
     Gabriel (2026-10-03): el asistente tiene que entender aunque escriban mal
     ("vachos" -> vasos, "eladeria" -> heladería, "pisseria" -> pizzería). Es
     la misma regla del buscador de la tienda: se compara cómo SUENAN las
     palabras (b = v, s = z = c(e, i), y = ll, k = c = qu, sin h muda y sin
     plural) y se toleran 1 letra de diferencia en palabras de 4 letras, 2 de
     5 a 8 y 3 en las más largas (de más, de menos, cambiada o volteada). */
  function suena(w) {
    w = w.replace(/ll/g, "y").replace(/qu/g, "k").replace(/c([ei])/g, "s$1").replace(/z/g, "s")
         .replace(/c(?!h)/g, "k").replace(/v/g, "b").replace(/w/g, "u").replace(/(^|[^c])h/g, "$1")
         .replace(/(.)\1+/g, "$1");
    if (w.length > 4 && /[^aeiou]es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && /s$/.test(w)) w = w.slice(0, -1);
    return w;
  }
  function distancia(a, b, tope) {
    if (Math.abs(a.length - b.length) > tope) return tope + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var minFila = tope + 1;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < minFila) minFila = d[i][j];
      }
      if (minFila > tope) return tope + 1;
    }
    return d[a.length][b.length];
  }
  function tolerancia(n) { return n <= 3 ? 0 : n === 4 ? 1 : n <= 8 ? 2 : 3; }

  /* Palabras de todos los días que nunca se "corrigen", aunque se parezcan a
     una del catálogo ("tengo" no es "tango", "vendo" no es "vaso"). */
  var COMUNES = {};
  ("para tengo tienes tiene tienen quiero quisiera necesito necesita necesitamos vendo vende venden " +
   "vendemos busco buscando negocio abri abrir abrimos nuevo nueva como cuanto cuantos cuanta cuantas " +
   "cuesta cuestan precio precios donde cuando hacen hace pueden puedo puede favor gracias hola buenas " +
   "buenos tardes dias noches mucho muchos poco pocos grande grandes chico chicos chica chicas mediano " +
   "mediana medida medidas onzas litro litros caja cajas paquete paquetes pieza piezas envio envios envian " +
   "mandan llega llegan pedido pedidos comprar compra cotizar cotizacion logo imprimir impresion tambien " +
   "algo alguna alguno algun este esta estos estas ese esos esas bien sirve sirven usar tipo tipos sobre " +
   "entre desde hasta cual cuales porque pero todo todos toda todas otra otro otros mejor barato barata " +
   "caro cara tienda pagina asistente ustedes usted mismo misma menos solo sola local puesto cosas cosa " +
   "vender servir sirvo llevar mano casa calle semana mensual diario diaria cliente clientes gente " +
   "personas tienen tenemos manejan venta ventas mayoreo menudeo").split(" ").forEach(function (w) { COMUNES[w] = 1; });

  /* Arma un corrector: cada palabra que no conoce la cambia por la que más se
     le parece de `fuertes` (las que importan: productos, usos). Las de
     `conocidas` ya están bien escritas y no se tocan. */
  function corrector(fuertes, conocidas) {
    var conocida = {}, lista = [], vista = {}, memo = {};
    (conocidas || []).forEach(function (t) {
      norm(t).split(" ").forEach(function (w) { if (w) conocida[w] = 1; });
    });
    fuertes.forEach(function (t) {
      norm(t).split(" ").forEach(function (w) {
        if (w.length < 3 || /\d/.test(w)) return;
        conocida[w] = 1;
        if (!vista[w]) { vista[w] = 1; lista.push({ w: w, s: suena(w) }); }
      });
    });
    function una(t) {
      if (t.length < 4 || /\d/.test(t) || conocida[t] || COMUNES[t]) return t;
      if (Object.prototype.hasOwnProperty.call(memo, t)) return memo[t];
      var st = suena(t), max = tolerancia(st.length), mejor = null, dm = max + 1;
      lista.forEach(function (v) {
        var d = v.s === st ? 0 : distancia(st, v.s, max);
        if (d < dm || (d === dm && mejor && v.w.length < mejor.length)) { dm = d; mejor = v.w; }
      });
      return (memo[t] = mejor && dm <= max ? mejor : t);
    }
    return function (texto) { return norm(texto || "").split(" ").map(una).join(" "); };
  }

  /* Palabra completa, con el plural tolerado: "helado" pega en "helados" y
     en "vasos para helado", pero "bar" no pega dentro de "barra". */
  var REG_GIROS = GIROS.map(function (g) {
    return g.dice.map(function (t) { return new RegExp("(^| )" + norm(t) + "(e?s)?( |$)"); });
  });

  function usoExacto(n) {
    for (var i = 0; i < GIROS.length; i++) {
      for (var j = 0; j < REG_GIROS[i].length; j++) {
        if (REG_GIROS[i][j].test(n)) return GIROS[i];
      }
    }
    return null;
  }

  /* Para los usos, el corrector solo conoce las palabras de la tabla; las del
     catálogo (vaso, tapa, papel…) se dejan como están. */
  var corrigeUso = null;
  /* `yaCorregido`: el asistente ya pasó la pregunta por su propio corrector
     (que conoce todo el catálogo); no se corrige dos veces. */
  function usoDe(texto, yaCorregido) {
    var n = norm(texto || "");
    if (!n) return null;
    var exacto = usoExacto(n);
    if (exacto || yaCorregido) return exacto;
    if (!corrigeUso) {
      var fuertes = [];
      GIROS.forEach(function (g) { fuertes = fuertes.concat(g.dice); });
      var G = window.GREENOVA || {};
      /* Lo que ya está bien escrito y no es un uso: el catálogo, los
         sinónimos (ciudades incluidas: "Mérida" no es "feria") y los hechos. */
      var catalogo = (G.PRODUCTOS || []).map(function (p) { return p.nombre + " " + p.desc + " " + p.v.join(" "); })
        .concat((G.CATEGORIAS || []).map(function (c) { return c.nombre; }))
        .concat(SINONIMOS.map(function (x) { return x.dice.join(" ") + " " + x.es; }))
        .concat(HECHOS.map(function (h) { return h.t + " " + h.c; }));
      corrigeUso = corrector(fuertes, catalogo);
    }
    return usoExacto(corrigeUso(n));
  }

  /* Índice de la medida de un producto que empieza con `v` ("4 oz"), o 0. */
  function medidaDe(p, v) {
    if (!p || !v) return 0;
    for (var k = 0; k < p.v.length; k++) {
      if (p.v[k].indexOf(v) === 0) return k;
    }
    return 0;
  }

  /* Foto con comida de un producto (y de su medida, si tiene una propia).
     Devuelve { src, alt } o null. */
  function fotoUso(id, medida) {
    var f = null;
    if (medida) {
      Object.keys(FOTOS_USO).some(function (clave) {
        var partes = clave.split("|");
        if (partes[0] === id && partes[1] && medida.indexOf(partes[1]) === 0) { f = FOTOS_USO[clave]; return true; }
        return false;
      });
    }
    f = f || FOTOS_USO[id];
    return f ? { src: "assets/uso/" + f.f + ".webp?v=" + (f.ver || "1"), alt: f.alt || "" } : null;
  }

  /* Los usos en los que sale un producto, para la ficha ("Ideal para"). */
  function usosDe(id) {
    return GIROS.filter(function (g) {
      return g.nombre !== "Negocio nuevo" && g.recs.some(function (r) { return r.id === id; });
    });
  }

  return {
    CRITERIOS: CRITERIOS,
    HECHOS: HECHOS,
    SINONIMOS: SINONIMOS,
    GIROS: GIROS,
    COTIZA: COTIZA,
    FOTOS_USO: FOTOS_USO,
    SUGERENCIAS: SUGERENCIAS,
    SALIDA: SALIDA,
    usoDe: usoDe,
    corrector: corrector,
    medidaDe: medidaDe,
    fotoUso: fotoUso,
    usosDe: usosDe,
    /* Dónde vive la función que guarda la API key. Hay dos versiones del mismo
       endpoint porque hay dos tipos de hosting: Node (Render, Vercel) y PHP
       (Hostinger). Se elige por dominio, así el mismo código sirve en todos
       sin tocar nada. Ver README. */
    ENDPOINT: /(^|\.)(onrender\.com|vercel\.app)$/.test(location.hostname)
      ? "/api/chat"
      : "/php/chat.php"
  };
})();
