package com.nfse.saas.controllers;

import com.nfse.saas.dtos.ReportRequest;
import com.nfse.saas.models.app.Invoice;
import com.nfse.saas.models.app.Report;
import com.nfse.saas.repositories.app.InvoiceRepository;
import com.nfse.saas.repositories.app.ReportRepository;
import com.nfse.saas.security.JwtUtils;
import com.nfse.saas.services.ReportService;
import com.nfse.saas.services.SpedGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ReportService reportService;

    @Autowired
    private SpedGeneratorService spedGeneratorService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/")
    public ResponseEntity<Report> requestReport(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ReportRequest request) {
        
        Long tenantId = jwtUtils.getTenantIdFromHeader(authHeader);

        // Check cache (24 hours)
        LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);
        Report existing = reportRepository.findFirstByTenantIdAndReferenceMonthAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                tenantId, request.getReferenceMonth(), oneDayAgo);

        if (existing != null) {
            return ResponseEntity.ok(existing);
        }

        Report newReport = new Report();
        newReport.setTenantId(tenantId);
        newReport.setReferenceMonth(request.getReferenceMonth());
        newReport.setStatus("PENDING");
        reportRepository.save(newReport);

        // Call async service
        reportService.generateMonthlyReportAsync(newReport.getId(), tenantId, request.getReferenceMonth());

        return ResponseEntity.ok(newReport);
    }

    @GetMapping("/")
    public ResponseEntity<List<Report>> listReports(
            @RequestHeader("Authorization") String authHeader) {
        Long tenantId = jwtUtils.getTenantIdFromHeader(authHeader);
        List<Report> reports = reportRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        if (reports.size() > 12) {
            reports = reports.subList(0, 12);
        }
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/sped/{referenceMonth}")
    public ResponseEntity<ByteArrayResource> generateSped(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String referenceMonth) {
        
        Long tenantId = jwtUtils.getTenantIdFromHeader(authHeader);
        
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

        String spedContent = spedGeneratorService.generateSped(tenantId, referenceMonth, monthInvoices);

        ByteArrayResource resource = new ByteArrayResource(spedContent.getBytes());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SPED_" + tenantId + "_" + referenceMonth + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .body(resource);
    }
}
