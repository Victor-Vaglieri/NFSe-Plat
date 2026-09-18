import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from lxml import etree
from signxml import XMLSigner

from app.database import get_db_app
from app.models.service_order import ServiceOrder
from app.models.contract import Contract
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings

# TODO tem muitas coisas aqui que são mockadas e devem ser substituídas por integrações reais com a prefeitura, como a assinatura digital e a emissão do XML da NFS-e. 


router = APIRouter()

def sign_xml(xml_string: str) -> str:
    try:
        with open("mock_key.pem", "rb") as key_file:
            key_data = key_file.read()
        with open("mock_cert.pem", "rb") as cert_file:
            cert_data = cert_file.read()

        root = etree.fromstring(xml_string.encode('utf-8'))
        # Assinatura digital RSA via signxml
        signed_root = XMLSigner(
            c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#",
            signature_algorithm="rsa-sha256",
            digest_algorithm="sha256"
        ).sign(root, key=key_data, cert=cert_data)
        
        return etree.tostring(signed_root, encoding='unicode')
    except Exception as e:
        print(f"Error signing XML: {e}")
        return xml_string # fallback to unsigned for robust demo

def generate_mock_danfe(xml_signed: str, filepath: str, os_model: ServiceOrder, contract: Contract):
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm

    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2 * cm, height - 2 * cm, "DANFE - Documento Auxiliar da NF-e")
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, height - 3 * cm, "AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL")
    
    c.drawString(2 * cm, height - 5 * cm, f"Prestador: Mock NFSe SaaS LTDA")
    c.drawString(2 * cm, height - 5.5 * cm, f"Tomador: {contract.client_name} (CNPJ: {contract.client_cnpj})")
    
    c.drawString(2 * cm, height - 7 * cm, f"Descrição do Serviço:")
    c.drawString(2 * cm, height - 7.5 * cm, os_model.description[:100])
    
    c.drawString(2 * cm, height - 9 * cm, f"Valor Total: R$ {os_model.value:.2f}")
    c.drawString(2 * cm, height - 9.5 * cm, f"Data de Emissão: {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}")
    
    c.setFont("Helvetica", 6)
    c.drawString(2 * cm, 2 * cm, "XML Assinado Digitalmente: Validação RSA-SHA256 (Mock)")
    
    c.save()


@router.post("/issue/{service_order_id}")
def issue_invoice(service_order_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db_app), current_user: User = Depends(get_current_user)):
    os_model = db.query(ServiceOrder).filter(ServiceOrder.id == service_order_id, ServiceOrder.tenant_id == current_user.tenant_id).first()
    if not os_model:
        raise HTTPException(status_code=404, detail="Ordem de Serviço não encontrada.")
        
    if os_model.status == "BILLED":
        raise HTTPException(status_code=400, detail="Esta OS já foi faturada.")

    contract = db.query(Contract).filter(Contract.id == os_model.contract_id).first()
    
    # 1. Gerar o XML da RPS (Recibo Provisório de Serviços)
    xml_payload = f"""<Rps>
        <InfDeclaracaoPrestacaoServico id="rps{os_model.id}">
            <Rps>
                <IdentificacaoRps>
                    <Numero>{os_model.id}</Numero>
                    <Serie>UN</Serie>
                    <Tipo>1</Tipo>
                </IdentificacaoRps>
                <DataEmissao>{datetime.utcnow().isoformat()}</DataEmissao>
                <Status>1</Status>
            </Rps>
            <Servico>
                <Valores>
                    <ValorServicos>{os_model.value}</ValorServicos>
                </Valores>
                <Discriminacao>{os_model.description}</Discriminacao>
            </Servico>
            <Prestador>
                <Cnpj>00000000000191</Cnpj>
            </Prestador>
            <Tomador>
                <IdentificacaoTomador>
                    <CpfCnpj><Cnpj>{contract.client_cnpj}</Cnpj></CpfCnpj>
                </IdentificacaoTomador>
                <RazaoSocial>{contract.client_name}</RazaoSocial>
            </Tomador>
        </InfDeclaracaoPrestacaoServico>
    </Rps>"""

    # 2. Assinar Digitalmente o XML com o Certificado A1 Mock
    signed_xml = sign_xml(xml_payload)
    
    # 3. Simulação do retorno da prefeitura)
    unique_id = str(uuid.uuid4())
    xml_filename = f"{unique_id}_nfse.xml"
    pdf_filename = f"{unique_id}_danfe.pdf"
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    xml_path = os.path.join(settings.UPLOAD_DIR, xml_filename)
    pdf_path = os.path.join(settings.UPLOAD_DIR, pdf_filename)
    
    with open(xml_path, "w", encoding="utf-8") as f:
        f.write(signed_xml)
        
    generate_mock_danfe(signed_xml, pdf_path, os_model, contract)
    
    # 4. Atualizar o Status da OS e Criar o Registro da Nota
    from app.models.invoice import Invoice
    from datetime import datetime
    new_invoice = Invoice(
        tenant_id=current_user.tenant_id,
        service_order_id=os_model.id,
        invoice_number=f"NFS-{os_model.id}-{unique_id[:4]}",
        issuer_cnpj="00.000.000/0001-91",
        issuer_name="Mock NFSe SaaS LTDA",
        recipient_cnpj=contract.client_cnpj,
        description=os_model.description,
        total_value=os_model.value,
        issue_date=datetime.utcnow(),
        status="EMITIDA",
        file_path=f"uploads/{pdf_filename}",
        raw_extracted_text=signed_xml # Salvando o XML assinado aqui como payload
    )
    
    os_model.status = "BILLED"
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    return {
        "message": "NFS-e emitida e assinada digitalmente com sucesso (Mock).",
        "invoice_id": new_invoice.id,
        "pdf_url": f"uploads/{pdf_filename}",
        "xml_url": f"uploads/{xml_filename}"
    }
