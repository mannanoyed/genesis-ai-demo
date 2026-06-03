import json
import os
from pathlib import Path
from typing import Optional

import chromadb
from chromadb.config import Settings
from openai import OpenAI

DATA_DIR = Path(__file__).parent.parent / "data"
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).parent.parent / "chroma_db"))

_chroma_client = None
_collection = None
_openai_client = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client


def get_chroma_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        _collection = _chroma_client.get_or_create_collection(
            name="genesis_knowledge",
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def embed_text(text: str) -> list[float]:
    client = get_openai_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def seed_vector_db():
    """Load all Genesis vehicle data and FAQ into ChromaDB."""
    collection = get_chroma_collection()

    # Check if already seeded
    existing = collection.count()
    if existing > 0:
        print(f"ChromaDB already seeded with {existing} documents. Skipping.")
        return

    documents = []
    embeddings = []
    metadatas = []
    ids = []

    # Load vehicle data
    with open(DATA_DIR / "genesis_vehicles.json", "r") as f:
        vehicles = json.load(f)

    for vehicle in vehicles:
        vid = vehicle["id"]
        name = vehicle["name"]

        # Document 1: Overview + Performance
        perf_text = f"""
        {name} ({vehicle.get('type', '')}) - {vehicle.get('year', 2024)}
        Tagline: {vehicle.get('tagline', '')}
        Starting Price (UAE): AED {vehicle.get('starting_price_aed', 0):,}
        Best For: {vehicle.get('best_for', '')}
        Competitors: {', '.join(vehicle.get('competitors', []))}
        """

        if vehicle.get("is_electric"):
            motor = vehicle.get("motor", {})
            perf_text += f"""
        Motor: {motor.get('configuration', '')} - {motor.get('horsepower', '')} HP
        Battery: {vehicle.get('battery_kwh', '')} kWh
        Range: {vehicle.get('range_km_wltp', '')} km (WLTP)
        0-100 km/h: {vehicle.get('zero_to_100_kmh', '')}
        Fast Charging: {vehicle.get('fast_charge', '')}
        """
        else:
            engines = vehicle.get("engines", [])
            for eng in engines:
                perf_text += f"""
        Engine: {eng.get('displacement', '')} - {eng.get('horsepower', '')} HP, {eng.get('torque_nm', '')} Nm torque
        """
            perf_text += f"""
        Transmission: {vehicle.get('transmission', '')}
        Drivetrain: {vehicle.get('drivetrain', '')}
        0-100 km/h: {vehicle.get('zero_to_100_kmh', '')}
        """

        documents.append(perf_text.strip())
        metadatas.append({"vehicle_id": vid, "vehicle_name": name, "category": "performance_overview"})
        ids.append(f"{vid}_performance")

        # Document 2: Dimensions + Specs
        dims = vehicle.get("dimensions", {})
        dim_text = f"""
        {name} Dimensions and Specifications:
        Length: {dims.get('length_mm', '')} mm
        Width: {dims.get('width_mm', '')} mm
        Height: {dims.get('height_mm', '')} mm
        Wheelbase: {dims.get('wheelbase_mm', '')} mm
        Seating Capacity: {vehicle.get('seating', '')} passengers
        Wheels: {vehicle.get('wheels', '')}
        Drivetrain: {vehicle.get('drivetrain', '')}
        """
        if dims.get("note"):
            dim_text += f"\nNote: {dims['note']}"

        documents.append(dim_text.strip())
        metadatas.append({"vehicle_id": vid, "vehicle_name": name, "category": "dimensions"})
        ids.append(f"{vid}_dimensions")

        # Document 3: Interior + Features
        features = vehicle.get("features", {})
        feat_text = f"""
        {name} Interior and Technology Features:
        """
        for k, v in features.items():
            if isinstance(v, list):
                feat_text += f"\n{k.replace('_', ' ').title()}: {', '.join(v)}"
            else:
                feat_text += f"\n{k.replace('_', ' ').title()}: {v}"

        highlights = vehicle.get("highlights", [])
        if highlights:
            feat_text += f"\nKey Highlights: {', '.join(highlights)}"

        documents.append(feat_text.strip())
        metadatas.append({"vehicle_id": vid, "vehicle_name": name, "category": "features_interior"})
        ids.append(f"{vid}_features")

        # Document 4: Safety
        safety = vehicle.get("safety", {})
        safety_text = f"""
        {name} Safety Features:
        Airbags: {safety.get('airbags', '')}
        ADAS Systems: {', '.join(safety.get('adas', []))}
        """

        documents.append(safety_text.strip())
        metadatas.append({"vehicle_id": vid, "vehicle_name": name, "category": "safety"})
        ids.append(f"{vid}_safety")

        # Document 5: Pricing and Recommendation
        price_text = f"""
        {name} Pricing and Recommendation:
        Starting Price (UAE/AED): AED {vehicle.get('starting_price_aed', 0):,}
        Type: {vehicle.get('type', '')}
        Best For: {vehicle.get('best_for', '')}
        Key Competitors: {', '.join(vehicle.get('competitors', []))}
        """
        if vehicle.get("family_note"):
            price_text += f"\nFamily Note: {vehicle['family_note']}"
        if vehicle.get("v8_note"):
            price_text += f"\nEngine Note: {vehicle['v8_note']}"

        documents.append(price_text.strip())
        metadatas.append({"vehicle_id": vid, "vehicle_name": name, "category": "pricing_recommendation"})
        ids.append(f"{vid}_pricing")

    # Load FAQ data
    with open(DATA_DIR / "genesis_faq.json", "r") as f:
        faqs = json.load(f)

    for faq in faqs:
        faq_text = f"""
        Genesis FAQ - {faq['question']}
        Answer: {faq['answer']}
        Keywords: {', '.join(faq.get('keywords', []))}
        """
        documents.append(faq_text.strip())
        metadatas.append({"vehicle_id": "general", "vehicle_name": "Genesis Brand", "category": f"faq_{faq['category']}"})
        ids.append(f"faq_{faq['id']}")

    print(f"Generating embeddings for {len(documents)} documents...")

    # Batch embed
    batch_size = 50
    all_embeddings = []
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        client = get_openai_client()
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )
        all_embeddings.extend([r.embedding for r in response.data])
        print(f"  Embedded {min(i + batch_size, len(documents))}/{len(documents)}")

    collection.add(
        documents=documents,
        embeddings=all_embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    print(f"Successfully seeded {len(documents)} documents into ChromaDB.")


def retrieve_context(
    query: str,
    vehicle_id: Optional[str] = None,
    n_results: int = 5
) -> str:
    """Retrieve relevant context from ChromaDB for a given query."""
    collection = get_chroma_collection()

    query_embedding = embed_text(query)

    where_filter = None
    if vehicle_id and vehicle_id != "general":
        where_filter = {"vehicle_id": vehicle_id}

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )

    if not results["documents"] or not results["documents"][0]:
        return "No specific context found. Please use your general Genesis knowledge."

    context_parts = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        if dist < 1.0:  # Filter out very dissimilar results
            context_parts.append(f"[{meta.get('vehicle_name', 'Genesis')} - {meta.get('category', '')}]\n{doc}")

    return "\n\n---\n\n".join(context_parts) if context_parts else "Please use your general Genesis knowledge."
