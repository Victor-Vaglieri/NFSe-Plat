from datetime import datetime
import calendar

class SpedGenerator:
    def __init__(self, tenant, reference_month: str, invoices: list):
        self.tenant = tenant
        self.reference_month = reference_month
        self.invoices = invoices
        self.lines = []
        self.record_counts = {}

    def add_line(self, register_type: str, fields: list):
        # A SPED line always starts and ends with a pipe '|'
        line = f"|{register_type}|" + "|".join(str(f) if f is not None else "" for f in fields) + "|"
        self.lines.append(line)
        self.record_counts[register_type] = self.record_counts.get(register_type, 0) + 1

    def generate(self) -> str:
        # Parse reference_month (YYYY-MM)
        year, month = map(int, self.reference_month.split('-'))
        last_day = calendar.monthrange(year, month)[1]
        
        dt_start = f"01{month:02d}{year}"
        dt_end = f"{last_day:02d}{month:02d}{year}"
        
        tenant_name = "MOCK NFSE SAAS LTDA"
        tenant_cnpj = "00000000000191"
        
        # Bloco 0: Abertura, Identificação e Referências
        # 0000: Texto Fixo | Versão | Cod. Finalidade | Data Início | Data Fim | Nome | CNPJ | CPF | UF | IE | Cod Mun | IM
        self.add_line("0000", ["015", "1", dt_start, dt_end, tenant_name, tenant_cnpj, "", "SP", "", "3550308", "12345678"])
        self.add_line("0100", ["CONTADOR TESTE", "00011122233", "000000", "00000000000191", "11999999999", "contato@contabilidade.com"])
        self.add_line("A010", [tenant_cnpj]) # Estabelecimento
        
        # Bloco A: Documentos Fiscais - Serviços (ISS)
        # A100: Operação | Emitente | Participante | Situação | Série | Sub | Num Doc | Chave | Data | Data Exec | Valor Bruto
        for inv in self.invoices:
            # Emissão
            dt_emissao = inv.issue_date.strftime("%d%m%Y") if getattr(inv, 'issue_date', None) else ""
            val = f"{inv.total_value:.2f}".replace('.', ',') if inv.total_value else "0,00"
            status_code = "00" if inv.status in ("EMITIDA", "PROCESSADO", "BILLED") else "02" # 02 = Cancelado
            
            self.add_line("A100", ["0", "0", inv.recipient_cnpj or "", status_code, "1", "", inv.id, "", dt_emissao, dt_emissao, val, "0", "0", "0", "0", "0"])
            
            # A170: Itens do Documento (Vamos simular 1 item por nota para simplificar, com CST e Alíquotas)
            # Item | Descrição | Valor | CST PIS | CST COFINS | Base Calc PIS | Aliq PIS | Valor PIS | Base Calc COFINS | Aliq COFINS | Valor COFINS
            if inv.total_value and status_code == "00":
                v_pis = f"{inv.total_value * 0.0165:.2f}".replace('.', ',')
                v_cofins = f"{inv.total_value * 0.076:.2f}".replace('.', ',')
                self.add_line("A170", ["1", "SERVICO PRESTADO", val, "01", "01", val, "1,65", v_pis, val, "7,60", v_cofins])
                
        # Bloco 9: Controle e Encerramento do Arquivo
        # 9900: Totalização de linhas por registro
        self.add_line("9900", ["0000", self.record_counts.get("0000", 0)])
        self.add_line("9900", ["0100", self.record_counts.get("0100", 0)])
        self.add_line("9900", ["A010", self.record_counts.get("A010", 0)])
        self.add_line("9900", ["A100", self.record_counts.get("A100", 0)])
        self.add_line("9900", ["A170", self.record_counts.get("A170", 0)])
        
        # Register count of 9900 itself + 1 for 9999
        q_9900 = self.record_counts.get("9900", 0) + 1 
        self.add_line("9900", ["9900", q_9900])
        
        # 9999: Total geral de linhas
        total_lines = len(self.lines) + 1
        self.add_line("9999", [total_lines])
        
        # Retorna o arquivo formatado com quebras de linha Windows/CRLF (padrão SPED)
        return "\r\n".join(self.lines)
