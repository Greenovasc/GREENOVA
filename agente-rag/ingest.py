"""Vectoriza catalogo.json y lo guarda en una colección local de ChromaDB.

Uso:
    python ingest.py

Variables de entorno:
    OPENAI_API_KEY   (requerida) — nunca la pegues en este archivo ni la subas
                     al repo. Expórtala en la terminal o ponla en un .env local
                     (ya está en .gitignore) con OPENAI_API_KEY=sk-...
    CHROMA_DIR       (opcional) carpeta donde persiste la base vectorial.
                     Por defecto "./chroma_db".

Cada producto de catalogo.json se convierte en un documento de texto plano
(nombre + categoría + material + medidas + precios) y se manda a embeddings.
Los datos originales (precios, si se cotiza, notas) se guardan aparte como
metadata de Chroma, para que agent.py no tenga que volver a parsear texto.

Este script se puede correr las veces que haga falta: siempre borra la
colección anterior y la reconstruye completa, así que catalogo.json es la
única fuente de verdad — nunca hay que editar la base vectorial a mano.
"""
from __future__ import annotations

import json
import os
import pathlib

import chromadb
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

RAIZ = pathlib.Path(__file__).parent.resolve()
CATALOGO_JSON = RAIZ / "catalogo.json"
CHROMA_DIR = os.environ.get("CHROMA_DIR", str(RAIZ / "chroma_db"))
COLECCION = "catalogo_greenova"
MODELO_EMBEDDING = "text-embedding-3-small"

# La API de embeddings acepta lotes; 100 documentos por llamada es un margen
# cómodo muy por debajo del límite de tokens por request.
TAMANO_LOTE = 100


def texto_para_embedding(producto: dict) -> str:
    """Arma la descripción en español que de verdad se manda a embeddings.

    Entre más contexto natural tenga (sinónimos, medidas, material), mejor
    encuentra la búsqueda semántica preguntas como 'algo para café caliente
    que no queme la mano' sin que el cliente diga el nombre exacto del SKU.
    """
    partes = [producto["nombre"], producto["categoria"]]
    if producto.get("material"):
        partes.append(f"Material: {producto['material']}")
    if producto.get("boca_mm"):
        partes.append(f"Boca de {producto['boca_mm']} mm")
    if producto.get("medidas"):
        partes.append(producto["medidas"])
    if producto["cotizar"]:
        partes.append("Precio sobre pedido, se cotiza según volumen y personalización")
    else:
        for p in producto["precios"]:
            partes.append(f"{p['presentacion']} de {p['piezas']} piezas a ${p['precio_pza']:.2f} MXN por pieza")
    if producto.get("notas"):
        partes.append(producto["notas"])
    return ". ".join(partes)


def metadata_para_chroma(producto: dict) -> dict:
    """Chroma solo acepta str/int/float/bool en metadata: las listas/objetos
    (precios) se guardan como JSON serializado y agent.py los deserializa."""
    return {
        "nombre": producto["nombre"],
        "categoria": producto["categoria"],
        "material": producto.get("material") or "",
        "boca_mm": producto.get("boca_mm") or 0,
        "medidas": producto.get("medidas") or "",
        "cotizar": producto["cotizar"],
        "precios_json": json.dumps(producto["precios"], ensure_ascii=False),
        "notas": producto.get("notas") or "",
    }


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("Falta OPENAI_API_KEY en el entorno. Expórtala antes de correr ingest.py.")

    with open(CATALOGO_JSON, encoding="utf-8") as f:
        catalogo = json.load(f)
    productos = catalogo["productos"]
    print(f"[ingest] {len(productos)} productos en {CATALOGO_JSON.name}")

    cliente = OpenAI()
    chroma = chromadb.PersistentClient(path=CHROMA_DIR)

    # Se reconstruye desde cero: evita que queden productos huérfanos si
    # catalogo.json perdió alguno desde la última corrida.
    try:
        chroma.delete_collection(COLECCION)
    except Exception:
        pass
    # hnsw:space="cosine": así la distancia que devuelve collection.query()
    # es directamente 1 - similitud_coseno, y agent.py puede mostrar un
    # score legible en vez de la distancia euclidiana por defecto de Chroma.
    coleccion = chroma.create_collection(COLECCION, metadata={"hnsw:space": "cosine"})

    for inicio in range(0, len(productos), TAMANO_LOTE):
        lote = productos[inicio:inicio + TAMANO_LOTE]
        documentos = [texto_para_embedding(p) for p in lote]

        respuesta = cliente.embeddings.create(model=MODELO_EMBEDDING, input=documentos)
        vectores = [d.embedding for d in respuesta.data]

        coleccion.add(
            ids=[p["id"] for p in lote],
            embeddings=vectores,
            documents=documentos,
            metadatas=[metadata_para_chroma(p) for p in lote],
        )
        print(f"[ingest] vectorizados {inicio + len(lote)}/{len(productos)}")

    print(f"[ingest] listo. Colección '{COLECCION}' guardada en {CHROMA_DIR}")


if __name__ == "__main__":
    main()
