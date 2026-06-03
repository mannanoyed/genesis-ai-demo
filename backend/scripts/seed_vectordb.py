#!/usr/bin/env python3
"""
Script to seed ChromaDB with Genesis vehicle data.
Run this before starting the backend if you want to pre-seed the vector database.

Usage:
    cd backend
    python scripts/seed_vectordb.py
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from services.rag_service import seed_vector_db, get_chroma_collection


def main():
    print("=" * 60)
    print("Genesis AI — ChromaDB Seeding Script")
    print("=" * 60)
    
    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not set. Please set it in backend/.env")
        sys.exit(1)
    
    print("\nSeeding vector database with Genesis vehicle data...")
    
    try:
        # Force re-seed by deleting existing collection
        if "--force" in sys.argv:
            print("Force flag detected — clearing existing data...")
            from services.rag_service import get_chroma_collection, _chroma_client
            collection = get_chroma_collection()
            # Get all IDs and delete
            all_data = collection.get()
            if all_data["ids"]:
                collection.delete(ids=all_data["ids"])
                print(f"Deleted {len(all_data['ids'])} existing documents.")
        
        seed_vector_db()
        
        # Verify
        collection = get_chroma_collection()
        count = collection.count()
        print(f"\nVerification: {count} documents in ChromaDB.")
        print("\nSeeding complete! You can now start the backend.")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
