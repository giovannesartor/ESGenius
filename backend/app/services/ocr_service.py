"""OCR service — uses pytesseract for scanned PDFs (gracefully degrades)."""

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def ocr_image_bytes(image_bytes: bytes, lang: str = "eng+por+spa") -> str:
    """Run OCR on image bytes. Returns empty string if Tesseract not available."""
    try:
        import pytesseract  # type: ignore
        from PIL import Image  # type: ignore
    except ImportError:
        logger.warning("pytesseract or Pillow not installed; OCR disabled.")
        return ""

    try:
        img = Image.open(io.BytesIO(image_bytes))
        return pytesseract.image_to_string(img, lang=lang)
    except Exception as e:  # noqa: BLE001
        logger.warning(f"OCR failed: {e}")
        return ""


def ocr_pdf_pages(pdf_path: str, lang: str = "eng+por+spa") -> list[tuple[int, str]]:
    """OCR all pages of a PDF. Returns list of (page_number, text).

    Renders each page to PNG via PyMuPDF, then runs Tesseract.
    """
    try:
        import fitz  # type: ignore
    except ImportError:
        logger.warning("PyMuPDF not installed; OCR PDF disabled.")
        return []

    pages: list[tuple[int, str]] = []
    try:
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc, start=1):
            try:
                pix = page.get_pixmap(dpi=200)
                png_bytes = pix.tobytes("png")
                text = ocr_image_bytes(png_bytes, lang=lang)
                pages.append((i, text))
            except Exception as e:  # noqa: BLE001
                logger.warning(f"OCR page {i} failed: {e}")
                pages.append((i, ""))
        doc.close()
    except Exception as e:  # noqa: BLE001
        logger.error(f"OCR pdf open failed: {e}")
    return pages


def is_ocr_available() -> bool:
    try:
        import pytesseract  # type: ignore
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False
