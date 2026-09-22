package com.nfse.saas.services;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.nfse.saas.models.app.Invoice;
import com.nfse.saas.models.app.Report;
import com.nfse.saas.repositories.app.InvoiceRepository;
import com.nfse.saas.repositories.app.ReportRepository;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Async
    public void generateMonthlyReportAsync(Long reportId, Long tenantId, String referenceMonth) {
        Report report = reportRepository.findById(reportId).orElse(null);
        if (report == null) return;

        try {
            // 1. Fetch Invoices for the month
            List<Invoice> allInvoices = invoiceRepository.findByTenantId(tenantId);
            String[] parts = referenceMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);

            List<Invoice> monthInvoices = allInvoices.stream().filter(inv -> {
                LocalDateTime dateStr = inv.getIssueDate();
                LocalDateTime dt = inv.getCreatedAt();
                if (dateStr != null) {
                    return dateStr.getYear() == year && dateStr.getMonthValue() == month;
                } else if (dt != null) {
                    return dt.getYear() == year && dt.getMonthValue() == month;
                }
                return false;
            }).collect(Collectors.toList());

            // 2. Generate PDF Base using PDFBox
            File reportsDir = new File(uploadDir, "reports");
            if (!reportsDir.exists()) reportsDir.mkdirs();

            String pdfName = "fechamento_" + tenantId + "_" + referenceMonth + "_" + reportId + ".pdf";
            File pdfFile = new File(reportsDir, pdfName);

            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage();
                doc.addPage(page);

                try (PDPageContentStream contentStream = new PDPageContentStream(doc, page)) {
                    contentStream.setFont(new PDType1Font(FontName.HELVETICA_BOLD), 24);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(40, 750);
                    contentStream.showText("VeVOn SaaS - Relatorio Gerencial");
                    contentStream.endText();

                    contentStream.setFont(new PDType1Font(FontName.HELVETICA), 12);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(40, 720);
                    contentStream.showText("Referencia: " + referenceMonth + " | Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                    contentStream.endText();

                    double totalValue = monthInvoices.stream().mapToDouble(i -> i.getTotalValue() != null ? i.getTotalValue() : 0.0).sum();
                    
                    contentStream.setFont(new PDType1Font(FontName.HELVETICA_BOLD), 14);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(40, 680);
                    contentStream.showText("Resumo Financeiro:");
                    contentStream.endText();

                    contentStream.setFont(new PDType1Font(FontName.HELVETICA), 12);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(40, 660);
                    contentStream.showText(String.format("Volume Total Bruto: R$ %.2f", totalValue));
                    contentStream.newLineAtOffset(0, -20);
                    contentStream.showText("Total de Notas: " + monthInvoices.size() + " notas");
                    contentStream.endText();
                }

                // Instead of merging PDF invoices which requires PDFMergerUtility and adds complexity to memory,
                doc.save(pdfFile);
            }

            // 3. Update Report Status
            report.setStatus("COMPLETED");
            report.setFilePath("uploads/reports/" + pdfName);
            reportRepository.save(report);

        } catch (Exception e) {
            e.printStackTrace();
            report.setStatus("ERROR");
            reportRepository.save(report);
        }
    }
}
