import pytesseract
from pdf2image import convert_from_path
import os

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts raw text from a PDF file using pdf2image and pytesseract.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")
        
    try:
        # Convert PDF pages to images
        images = convert_from_path(pdf_path)
        
        extracted_text = ""
        for i, image in enumerate(images):
            # Use Tesseract to do OCR on the image
            text = pytesseract.image_to_string(image, lang='por') # 'por' for Portuguese
            extracted_text += f"\n--- Page {i+1} ---\n{text}"
            
        return extracted_text
    except Exception as e:
        print(f"Error during OCR: {e}")
        return ""
        
def parse_nfs_e_data(raw_text: str) -> dict:
    """
    Placeholder for the logic that will use heuristics or regex
    to find CNPJ, Value, etc., from the raw OCR text.
    """
    # TODO: Implement regex patterns to extract fields
    return {
        "issuer_cnpj": "00.000.000/0000-00", # Dummy
        "total_value": 0.0,
        "raw_text": raw_text
    }
