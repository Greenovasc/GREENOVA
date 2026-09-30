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
    "En la tienda se compra por paquete o por caja, y los precios ya incluyen IVA. Si preguntan cuánto cuesta, da el precio tal como viene en el CATÁLOGO para esa medida y presentación. Si la medida no está en el contexto, di que el precio está en la tienda. NUNCA inventes descuentos ni precios por pieza.",
    "El pedido mínimo es un paquete (o una caja, cuando ese producto solo se vende por caja). NUNCA prometas tiempos de entrega: ventas los confirma con el pedido.",
    "Cuando alguien busque un producto, di la medida exacta y cuántas piezas trae el paquete y la caja, tal como vienen en el catálogo.",
    "Para elegir tapa, lo que importa es el diámetro de boca del vaso, no las onzas. Si te dan onzas, pide la boca o menciona las bocas que existen para esa medida.",
    "Si la persona quiere su logo impreso, explica que hay serigrafía sobre vasos de papel, vasos PET, fajillas y tapas de papel, y que también se hacen contenedores y bolsas a medida. Las tapas de plástico no se pueden imprimir.",
    "Si la persona quiere comprar, dile que agregue sus productos al carrito de la tienda y envíe su pedido, o que escriba a ventas@greenovasc.com.mx / 55 2260 1113.",
    "La gente no pide las cosas como se llaman en el catálogo. Traduce siempre: \"vaso para café\" o \"vaso para bebida caliente\" es el VASO DE PAPEL; \"vaso para bebida fría\", \"vaso para frappé\" o \"vaso transparente\" es el VASO PET. Usa la lista de EQUIVALENCIAS que se te pasa en el contexto y responde con el nombre del catálogo, no con el que usó la persona.",
    "Contenedores para alimentos, bowls y ensaladeras, bolsas y complementos (platos, cubiertos, servilletas, popotes) no se venden en la tienda en línea: se cotizan. Pídele que mande su lista en \"Envía tu lista\" o que escriba a ventas.",
    "SÍ ENVIAMOS A TODO MÉXICO. Si preguntan por cualquier estado, ciudad o pueblo del país, la respuesta es sí: GreeNova envía a nivel nacional desde la Ciudad de México. Lo único que no sabes es el costo y el tiempo del envío: eso lo confirma ventas.",
    "Eres un vendedor, no un buscador. Si alguien describe su negocio o su necesidad en vez de pedir un producto por nombre (\"tengo una cafetería\", \"vendo frappés\"), recomiéndale de una vez los productos del catálogo que se usan en ese giro, con su medida.",
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
      c: "Correo: ventas@greenovasc.com.mx. Teléfonos: 55 2260 1113 y 55 7051 1149. Sitio: www.greenovasc.com.mx. GreeNova SC está en la Ciudad de México." },

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

    { t: "Productos que se cotizan",
      c: "Además de la tienda en línea, GreeNova cotiza contenedores para alimentos (papel, bagazo de caña de azúcar, fécula de maíz, paja de trigo y PET), bowls y ensaladeras (kraft, PET y PLA), bolsas (papel y bond) y complementos (platos, cucharas, tenedores, cuchillos, servilletas y popotes). Se piden con \"Envía tu lista\" o escribiendo a ventas." },

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

    { dice: ["contenedor", "contenedores", "bowl", "bowls", "ensaladera", "bolsa", "bolsas",
             "plato", "platos", "cubiertos", "cuchara", "tenedor", "cuchillo", "servilleta",
             "servilletas", "popote", "popotes", "para llevar", "comida"],
      es: "productos que se cotizan contenedores bowls bolsas complementos",
      busca: [] }
  ];

  /* ---------------------------------------------------------------------
     GIROS — cómo vende un vendedor con sentido común.

     Cuando alguien no pregunta por un producto sino por su NECESIDAD ("tengo
     una cafetería", "necesito para llevar", "vendo postres"), no hay que
     mandarlo a ventas: hay que recomendarle lo que se usa en ese giro. Esta
     tabla es exactamente eso, y el asistente la contesta al instante y gratis.

     `dice`  las palabras con las que la gente describe su negocio o su necesidad
     `intro` la frase con la que abre la recomendación
     `ids`   productos del catálogo, en el orden en que conviene ofrecerlos

     Para agregar un giro nuevo basta con una entrada más aquí.
     --------------------------------------------------------------------- */
  var GIROS = [
    { dice: ["cafeteria", "cafetería", "coffee shop", "barista", "barra de cafe",
             "negocio de cafe", "vendo cafe", "cafeteria nueva", "torrefactora"],
      intro: "Para cafetería, el arranque típico es:",
      ids: ["vaso-papel-blanco", "tapa-cafetera-90", "fajilla-kraft", "removedor-madera",
            "vaso-papel-doble-pared"] },

    { dice: ["jugueria", "juguería", "smoothies", "licuados", "jugos", "aguas frescas",
             "bubble tea", "boba", "frappes", "frappés"],
      intro: "Para jugos, licuados y bebidas frías:",
      ids: ["vaso-pet-98", "tapa-pet-domo", "tapa-pet-plana-ranura", "vaso-pet-u"] },

    { dice: ["evento", "eventos", "fiesta", "fiestas", "catering", "banquete",
             "coffee break", "boda", "posada", "graduacion", "graduación"],
      intro: "Para eventos y catering:",
      ids: ["vaso-papel-blanco", "tapa-cafetera-90", "vaso-pet-95", "tapa-pet-plana-ranura",
            "removedor-madera"] },

    { dice: ["abrir un negocio", "voy a abrir", "empezando", "emprender",
             "negocio nuevo", "que me recomiendas", "qué me recomiendas",
             "no se que necesito", "no sé qué necesito", "asesorame", "asesórame"],
      intro: "Depende del giro, pero para bebidas lo que casi nadie deja fuera es:",
      ids: ["vaso-papel-blanco", "tapa-cafetera-90", "vaso-pet-98", "tapa-pet-domo"] }
  ];

  /* Preguntas sugeridas que aparecen al abrir el chat. */
  var SUGERENCIAS = [
    "¿Qué tapa va con un vaso de 12 oz?",
    "¿Cuánto cuesta la caja de vasos de 12 oz?",
    "¿Pueden imprimir mi logo?",
    "¿Hacen envíos a Monterrey?"
  ];

  /* Cuando ni el RAG ni la IA pueden contestar. */
  var SALIDA = "Eso no lo tengo confirmado y prefiero no inventarlo. " +
               "Escríbele a ventas: ventas@greenovasc.com.mx o 55 2260 1113, ahí te lo resuelven.";

  return {
    CRITERIOS: CRITERIOS,
    HECHOS: HECHOS,
    SINONIMOS: SINONIMOS,
    GIROS: GIROS,
    SUGERENCIAS: SUGERENCIAS,
    SALIDA: SALIDA,
    /* Dónde vive la función que guarda la API key. Hay dos versiones del mismo
       endpoint porque hay dos tipos de hosting: Node (Render, Vercel) y PHP
       (Hostinger). Se elige por dominio, así el mismo código sirve en todos
       sin tocar nada. Ver README. */
    ENDPOINT: /(^|\.)(onrender\.com|vercel\.app)$/.test(location.hostname)
      ? "/api/chat"
      : "/php/chat.php"
  };
})();
