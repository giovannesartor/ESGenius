"""Document processing pipeline — extract text, tables, OCR fallback."""

import logging
import os
from typing import Any, Optional

import fitz  # PyMuPDF
import pandas as pd

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Processes uploaded documents to extract text and tabular data."""

    def extract_text_from_pdf(self, file_path: str) -> dict[str, Any]:
        """Extract text and tables from a PDF using PyMuPDF."""
        doc = fitz.open(file_path)
        pages = []
        full_text = []

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")

            if not text.strip():
                # OCR fallback using Tesseract
                text = self._ocr_page(page)

            pages.append({
                "page_number": page_num + 1,
                "text": text,
                "tables": self._extract_tables_from_page(page),
            })
            full_text.append(text)

        doc.close()

        return {
            "page_count": len(pages),
            "full_text": "\n\n".join(full_text),
            "pages": pages,
        }

    def extract_data_from_csv(self, file_path: str) -> dict[str, Any]:
        """Extract data from a CSV file."""
        df = pd.read_csv(file_path)
        return {
            "columns": list(df.columns),
            "row_count": len(df),
            "data": df.to_dict(orient="records"),
            "summary": df.describe().to_dict(),
        }

    def extract_data_from_excel(self, file_path: str) -> dict[str, Any]:
        """Extract data from an Excel file."""
        sheets = {}
        xls = pd.ExcelFile(file_path)

        for sheet_name in xls.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            sheets[sheet_name] = {
                "columns": list(df.columns),
                "row_count": len(df),
                "data": df.to_dict(orient="records"),
                "summary": df.describe().to_dict(),
            }

        return {
            "sheet_count": len(sheets),
            "sheets": sheets,
        }

    def process_file(self, file_path: str, file_type: str) -> dict[str, Any]:
        """Route file to the correct processor based on type."""
        processors = {
            "pdf": self.extract_text_from_pdf,
            "csv": self.extract_data_from_csv,
            "xlsx": self.extract_data_from_excel,
        }

        processor = processors.get(file_type)
        if not processor:
            raise ValueError(f"Unsupported file type: {file_type}")

        return processor(file_path)

    def _extract_tables_from_page(self, page: Any) -> list[list[list[str]]]:
        """Extract tables from a PDF page."""
        try:
            tables = page.find_tables()
            return [table.extract() for table in tables]
        except Exception as e:
            logger.warning(f"Table extraction failed: {e}")
            return []

    def _ocr_page(self, page: Any) -> str:
        """OCR fallback for scanned PDF pages."""
        try:
            import pytesseract
            from PIL import Image
            import io

            pix = page.get_pixmap(dpi=300)
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            text = pytesseract.image_to_string(image)
            return text
        except ImportError:
            logger.warning("Tesseract OCR not available — skipping OCR")
            return ""
        except Exception as e:
            logger.warning(f"OCR failed: {e}")
            return ""
