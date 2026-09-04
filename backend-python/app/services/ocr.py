import pytesseract
import fitz  # PyMuPDF
from PIL import Image
import io
import re

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts text from a PDF. 
    First tries direct digital text extraction (fast and accurate).
    If empty (scanned image), falls back to Tesseract OCR without needing Poppler.
    """
    try:
        # Open PDF
        doc = fitz.open(pdf_path)
        raw_text = ""
        
        # 1. Try Native Text Extraction (Digital PDF)
        for page in doc:
            raw_text += page.get_text() + "\n"
            
        # 2. If it's too small or empty, it means it's a scanned image. Use OCR.
        if len(raw_text.strip()) < 50:
            raw_text = ""
            for page in doc:
                # Render page to an image (Pixmap)
                pix = page.get_pixmap(dpi=300)
                # Convert PyMuPDF Pixmap to PIL Image
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                # Run Tesseract
                raw_text += pytesseract.image_to_string(img, lang="por") + "\n"
                
        return raw_text
    except Exception as e:
        print(f"Error during extraction/OCR: {e}")
        raise e
        
import re

def parse_nfs_e_data(raw_text: str) -> dict:
    """
    Extracts CNPJ, Total Value, and Invoice Number from the raw OCR text using Regular Expressions.
    Now supports both NFS-e and NF-e (DANFE).
    """
    data = {
        "invoice_number": None,
        "issuer_cnpj": None,
        "total_value": 0.0,
        "issue_date": None,
        "description": None,
        "raw_text": raw_text
    }
    
    # Clean text to remove some broken characters
    clean_text = raw_text.replace('', '')

    # Extract Invoice Number
    # For NFS-e: "Número da Nota: 123"
    # For NF-e DANFE: "N\nSÉRIE\nFL\n1\n027262383\n1" or similar
    number_pattern_nfse = r'(?i)(?:n[uú]mero da nota|nota fiscal n[ºo°]|nfs-e n[ºo°])\s*:?\s*(\d+)'
    numbers_found = re.findall(number_pattern_nfse, clean_text)
    if numbers_found:
        data["invoice_number"] = numbers_found[0]
    else:
        # Fallback for NF-e DANFE structure where number is a 9-digit number alone on a line
        danfe_number_pattern = r'\b(\d{9})\b'
        danfe_numbers = re.findall(danfe_number_pattern, clean_text)
        if danfe_numbers:
            data["invoice_number"] = danfe_numbers[0]
    
    # Extract CNPJ
    # Looks for format XX.XXX.XXX/XXXX-XX
    cnpj_pattern = r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}'
    cnpjs_found = re.findall(cnpj_pattern, clean_text)
    if cnpjs_found:
        data["issuer_cnpj"] = cnpjs_found[0]
        
    # Extract Total Value
    value_pattern = r'\b(\d{1,3}(?:\.\d{3})*,\d{2})\b'
    values_found = re.findall(value_pattern, clean_text)
    if values_found:
        numeric_values = []
        for v in values_found:
            clean_v = v.replace('.', '').replace(',', '.')
            try:
                numeric_values.append(float(clean_v))
            except ValueError:
                pass
        if numeric_values:
            data["total_value"] = max(numeric_values)

    # Extract Issue Date (Data de Emissão)
    date_pattern = r'\b(\d{2}/\d{2}/\d{4})\b'
    dates_found = re.findall(date_pattern, clean_text)
    if dates_found:
        # Assuming the first date found is usually the issue date on NF-e/NFS-e
        data["issue_date"] = dates_found[0]
        
    # Extract Description (O que o documento representa)
    # Simple heuristic: look for lines after "DESCRIÇÃO" or "NATUREZA DA OPERAÇÃO"
    if "NATUREZA DA OPERA" in clean_text.upper():
        try:
            split_text = clean_text.upper().split("NATUREZA DA OPERA")[1]
            lines = split_text.split('\n')
            desc = [line.strip() for line in lines if line.strip() and len(line.strip()) > 3]
            if desc:
                # Get the first two lines to form a brief description
                data["description"] = (desc[0].replace('ÇÃO', '').strip() + " " + (desc[1] if len(desc) > 1 else "")).strip()[:100]
        except:
            pass
    elif "DESCRI" in clean_text.upper():
        try:
            split_text = clean_text.upper().split("DESCRI")[1]
            lines = split_text.split('\n')
            desc = [line.strip() for line in lines if line.strip() and len(line.strip()) > 3]
            if desc:
                data["description"] = (desc[0].replace('ÇÃO DO SERVIÇO', '').replace('ÇÃO', '').strip() + " " + (desc[1] if len(desc) > 1 else "")).strip()[:100]
        except:
            pass

    return data
