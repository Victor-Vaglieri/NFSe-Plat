package com.nfse.saas.services;

import com.nfse.saas.models.app.Invoice;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SpedGeneratorService {

    public String generateSped(Long tenantId, String referenceMonth, List<Invoice> invoices) {
        StringBuilder sb = new StringBuilder();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("ddMMyyyy");
        String currentDate = now.format(dtf);

        // Block 0: Abertura e Identificação
        // Layout: |0000|013|0|01012024|31012024|NOME EMPRESA|CNPJ|||||
        String startDate = "01" + referenceMonth.substring(5, 7) + referenceMonth.substring(0, 4);
        String endDate = "28" + referenceMonth.substring(5, 7) + referenceMonth.substring(0, 4); // Dummy end date for SPED

        sb.append(String.format("|0000|013|0|%s|%s|TENANT_%d|00000000000100|||||\r\n", startDate, endDate, tenantId));
        sb.append("|0001|0|\r\n"); // Abertura do bloco 0 com movimento

        // Block A: Documentos Fiscais de Serviços (NFS-e)
        sb.append("|A001|0|\r\n"); // Abertura bloco A com movimento
        
        double totalValue = 0.0;
        int invoiceCount = 0;

        for (Invoice inv : invoices) {
            if ("ERROR".equals(inv.getStatus())) continue;

            String issueDate = "";
            if (inv.getIssueDate() != null) {
                issueDate = inv.getIssueDate().format(dtf);
            } else if (inv.getCreatedAt() != null) {
                issueDate = inv.getCreatedAt().format(dtf);
            }

            Double val = inv.getTotalValue() != null ? inv.getTotalValue() : 0.0;
            totalValue += val;
            invoiceCount++;

            String valStr = String.format(java.util.Locale.US, "%.2f", val).replace(".", ",");
            String cnpj = inv.getIssuerCnpj() != null ? inv.getIssuerCnpj().replaceAll("[^0-9]", "") : "";
            if (cnpj.isEmpty()) cnpj = "00000000000000";

            String docNum = inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : String.valueOf(inv.getId());
            
            // |A100|IND_OPER|IND_EMIT|COD_PART|COD_SIT|SER|SUB|NUM_DOC|CHV_NFSE|DT_DOC|DT_EXE_SERV|VL_DOC|
            sb.append(String.format("|A100|1|0|%s|00|1||%s||%s|%s|%s||\r\n", 
                cnpj, docNum, issueDate, issueDate, valStr));
                
            // |A170|NUM_ITEM|COD_ITEM|DESCR|VL_ITEM|
            String desc = inv.getDescription() != null ? inv.getDescription().replace("\n", " ").replace("|", " ") : "Servicos Prestados";
            if (desc.length() > 50) desc = desc.substring(0, 50);
            sb.append(String.format("|A170|1|01|%s|%s|\r\n", desc, valStr));
        }

        // Block A Closure
        sb.append(String.format("|A990|%d|\r\n", (invoiceCount * 2) + 2)); // 2 linhas por nota + A001 + A990

        // Block 9: Encerramento do Arquivo
        sb.append("|9001|0|\r\n");
        sb.append("|9900|0000|1|\r\n");
        sb.append("|9900|0001|1|\r\n");
        sb.append("|9900|A001|1|\r\n");
        sb.append(String.format("|9900|A100|%d|\r\n", invoiceCount));
        sb.append(String.format("|9900|A170|%d|\r\n", invoiceCount));
        sb.append("|9900|A990|1|\r\n");
        sb.append("|9900|9001|1|\r\n");
        sb.append("|9900|9900|9|\r\n");
        sb.append("|9900|9990|1|\r\n");
        sb.append("|9900|9999|1|\r\n");
        sb.append("|9990|11|\r\n");
        
        int totalLines = 1 + 1 + 1 + (invoiceCount * 2) + 1 + 1 + 11 + 1 + 1;
        sb.append(String.format("|9999|%d|\r\n", totalLines));

        return sb.toString();
    }
}
