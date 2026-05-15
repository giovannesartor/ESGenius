"""RAG service — chunks documents, computes embeddings, retrieves context.

Embedding strategy:
- Primary: OpenAI/DeepSeek embedding API if available.
- Fallback: deterministic hashing-based pseudo-embedding (works offline,
  retrieval quality lower but functional for MVP).

Stored as JSON list[float] in document_chunks.embedding column.
Retrieval uses cosine similarity in Python.
"""

from __future__ import annotations

import hashlib
import logging
import math
import re
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.models.document_chunk import DocumentChunk
from app.repositories.platform_repos import DocumentChunkRepository

logger = logging.getLogger(__name__)

EMBED_DIM = 256
DEFAULT_CHUNK_SIZE = 1200  # chars
DEFAULT_CHUNK_OVERLAP = 200


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:
    """Split text into overlapping chunks, respecting paragraph boundaries when possible."""
    if not text:
        return []

    # Normalize whitespace
    text = re.sub(r"\s+\n", "\n", text)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    chunks: list[str] = []
    buf = ""
    for para in paragraphs:
        if len(buf) + len(para) + 2 <= chunk_size:
            buf = (buf + "\n\n" + para).strip() if buf else para
        else:
            if buf:
                chunks.append(buf)
            # If para itself is bigger than chunk_size, split hard
            if len(para) > chunk_size:
                start = 0
                while start < len(para):
                    end = min(start + chunk_size, len(para))
                    chunks.append(para[start:end])
                    start = end - overlap if end - overlap > start else end
                buf = ""
            else:
                buf = para
    if buf:
        chunks.append(buf)

    # Add overlap between adjacent chunks
    if overlap > 0 and len(chunks) > 1:
        out: list[str] = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-overlap:]
            out.append(prev_tail + " " + chunks[i])
        return out
    return chunks


# ---- Embeddings ----
def _hash_embedding(text: str, dim: int = EMBED_DIM) -> list[float]:
    """Deterministic pseudo-embedding via token hashing. Local fallback."""
    vec = [0.0] * dim
    tokens = re.findall(r"[a-zA-ZÀ-ÿ0-9]+", text.lower())
    for tok in tokens:
        h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _openai_embedding(text: str) -> Optional[list[float]]:
    """Use DeepSeek/OpenAI compatible embedding endpoint if configured."""
    if not settings.DEEPSEEK_API_KEY:
        return None
    try:
        from openai import OpenAI

        # DeepSeek doesn't currently expose embeddings API publicly under same key.
        # Use OpenAI if user supplies OPENAI_API_KEY env. Fallback to None.
        import os

        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            return None
        client = OpenAI(api_key=openai_key)
        resp = client.embeddings.create(
            model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
            input=text[:8000],
        )
        return list(resp.data[0].embedding)
    except Exception as e:  # noqa: BLE001
        logger.debug(f"openai embedding failed: {e}")
        return None


def embed(text: str) -> tuple[list[float], str]:
    vec = _openai_embedding(text)
    if vec is not None:
        return vec, "text-embedding-3-small"
    return _hash_embedding(text), "hash-256"


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chunk_repo = DocumentChunkRepository(db)

    async def index_document(
        self,
        document_id,
        company_id,
        text: str,
        page_texts: Optional[list[tuple[int, str]]] = None,
    ) -> int:
        """Chunk and embed a document. Returns number of chunks created."""
        chunks_to_create: list[DocumentChunk] = []
        if page_texts:
            global_idx = 0
            for page_num, page_text in page_texts:
                for piece in chunk_text(page_text):
                    vec, model = embed(piece)
                    chunks_to_create.append(
                        DocumentChunk(
                            document_id=document_id,
                            company_id=company_id,
                            chunk_index=global_idx,
                            page_number=page_num,
                            content=piece,
                            token_count=len(piece.split()),
                            embedding=vec,
                            embedding_model=model,
                        )
                    )
                    global_idx += 1
        else:
            for idx, piece in enumerate(chunk_text(text)):
                vec, model = embed(piece)
                chunks_to_create.append(
                    DocumentChunk(
                        document_id=document_id,
                        company_id=company_id,
                        chunk_index=idx,
                        page_number=None,
                        content=piece,
                        token_count=len(piece.split()),
                        embedding=vec,
                        embedding_model=model,
                    )
                )

        if chunks_to_create:
            await self.chunk_repo.bulk_create(chunks_to_create)
        return len(chunks_to_create)

    async def retrieve(self, company_id, query: str, top_k: int = 5) -> list[DocumentChunk]:
        """Return top_k most similar chunks to query."""
        q_vec, _ = embed(query)
        chunks = await self.chunk_repo.list_for_company(company_id, limit=2000)
        scored = []
        for c in chunks:
            if not c.embedding:
                continue
            score = cosine(q_vec, c.embedding)
            scored.append((score, c))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:top_k]]
