import datetime
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import hashes
from cryptography.x509.oid import NameOID
from cryptography import x509

# TODO: esta mockado para gerar um certificado autoassinado para testes. Em produção, se deve usar um certificado válido emitido por uma autoridade .

def generate_mock_certificate():
    print("Gerando chave privada RSA...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    print("Gerando Certificado X.509 de Teste (Simulação e-CNPJ A1)...")
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, u"BR"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"SP"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, u"Sao Paulo"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Mock NFSe SaaS LTDA"),
        x509.NameAttribute(NameOID.COMMON_NAME, u"Mock e-CNPJ"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        # Válido por 1 ano
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([x509.DNSName(u"localhost")]),
        critical=False,
    ).sign(private_key, hashes.SHA256())

    with open("mock_key.pem", "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ))

    with open("mock_cert.pem", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print("Certificado gerado com sucesso: mock_cert.pem e mock_key.pem")

if __name__ == "__main__":
    generate_mock_certificate()
