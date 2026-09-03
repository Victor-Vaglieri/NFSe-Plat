import pytesseract
from pdf2image import convert_from_path
import os

def extract_text_from_pdf(pdf_path: str) -> str:
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
        
import re

def parse_nfs_e_data(raw_text: str) -> dict:
    data = {
        "invoice_number": None,
        "issuer_cnpj": None,
        "total_value": 0.0,
        "raw_text": raw_text
    }
    
    # Extract Invoice Number (Número da Nota)
    # Looks for terms like "Número da Nota" or "Nota Fiscal No" followed by digits
    number_pattern = r'(?i)(?:n[uú]mero da nota|nota fiscal n[ºo°]|nfs-e n[ºo°])\s*:?\s*(\d+)'
    numbers_found = re.findall(number_pattern, raw_text)
    if numbers_found:
        data["invoice_number"] = numbers_found[0]
    
    # Extract CNPJ
    # Looks for format XX.XXX.XXX/XXXX-XX
    cnpj_pattern = r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}'
    cnpjs_found = re.findall(cnpj_pattern, raw_text)
    if cnpjs_found:
        # Just grab the first CNPJ found (usually the issuer or prestador on top)
        data["issuer_cnpj"] = cnpjs_found[0]
        
    # Extract Total Value
    # Looks for something like "Valor Total da Nota", "Valor Total R$", "R$", etc.
    # We'll look for "R$" followed by spaces and a number like "1.234,56" or "1234,56"
    value_pattern = r'R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})'
    values_found = re.findall(value_pattern, raw_text)
    
    if values_found:
        # Usually there are multiple R$ values, we can take the highest one assuming it's the total,
        # or grab a specific one if we anchor it to keywords. For now, let's grab the highest value.
        numeric_values = []
        for v in values_found:
            # Convert "1.234,56" to 1234.56
            clean_v = v.replace('.', '').replace(',', '.')
            try:
                numeric_values.append(float(clean_v))
            except ValueError:
                pass
        
        if numeric_values:
            data["total_value"] = max(numeric_values) # The maximum value is often the total

    return data
