package com.nfse.saas.controllers;

import com.nfse.saas.models.app.Invoice;
import com.nfse.saas.repositories.app.InvoiceRepository;
import com.nfse.saas.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import com.nfse.saas.services.PdfExtractionService;
import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PdfExtractionService pdfService;

    @GetMapping("/")
    public ResponseEntity<List<Invoice>> getInvoices() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long tenantId = userDetails.getTenantId();

        List<Invoice> invoices = invoiceRepository.findByTenantId(tenantId);
        return ResponseEntity.ok(invoices);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadInvoice(@RequestParam("file") MultipartFile file) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long tenantId = userDetails.getTenantId();

        if (file.isEmpty() || !file.getOriginalFilename().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body(Map.of("detail", "Somente arquivos PDF so aceitos."));
        }

        try {
            File uploadDir = new File("uploads").getAbsoluteFile();
            if (!uploadDir.exists()) uploadDir.mkdirs();

            String uniqueFilename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            File targetFile = new File(uploadDir, uniqueFilename);
            file.transferTo(targetFile);

            String rawText = pdfService.extractTextFromPdf(targetFile);
            Map<String, Object> extractedData = pdfService.parseNfseData(rawText);

            Invoice invoice = new Invoice();
            invoice.setTenantId(tenantId);
            invoice.setDocumentType("NFS-e");
            invoice.setInvoiceNumber((String) extractedData.get("invoice_number"));
            invoice.setIssuerCnpj((String) extractedData.get("issuer_cnpj"));
            invoice.setTotalValue((Double) extractedData.get("total_value"));
            invoice.setDescription((String) extractedData.get("description"));
            invoice.setStatus("PROCESSADO");
            invoice.setFilePath(targetFile.getAbsolutePath());
            invoice.setRawExtractedText(rawText);

            String issueDateStr = (String) extractedData.get("issue_date");
            if (issueDateStr != null) {
                try {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    invoice.setIssueDate(java.time.LocalDate.parse(issueDateStr, formatter).atStartOfDay());
                } catch (Exception e) {}
            }

            invoiceRepository.save(invoice);

            return ResponseEntity.ok(Map.of(
                "message", "Nota fiscal processada com sucesso!",
                "invoice_id", invoice.getId(),
                "extracted_data", Map.of(
                    "invoice_number", invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "",
                    "issuer_cnpj", invoice.getIssuerCnpj() != null ? invoice.getIssuerCnpj() : "",
                    "total_value", invoice.getTotalValue() != null ? invoice.getTotalValue() : 0.0,
                    "status", invoice.getStatus()
                )
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("detail", "Erro ao processar PDF: " + e.getMessage()));
        }
    }
}
