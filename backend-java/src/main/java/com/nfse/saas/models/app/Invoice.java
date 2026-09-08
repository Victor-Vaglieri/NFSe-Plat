package com.nfse.saas.models.app;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "document_type")
    private String documentType = "NFS-e";

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "issuer_cnpj")
    private String issuerCnpj;

    @Column(name = "issuer_name")
    private String issuerName;

    @Column(name = "recipient_cnpj")
    private String recipientCnpj;

    private String description;

    @Column(name = "total_value")
    private Double totalValue;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    private String status = "PENDING";

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "raw_extracted_text", columnDefinition = "TEXT")
    private String rawExtractedText;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters omitted for brevity...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getIssuerCnpj() { return issuerCnpj; }
    public void setIssuerCnpj(String issuerCnpj) { this.issuerCnpj = issuerCnpj; }
    public String getIssuerName() { return issuerName; }
    public void setIssuerName(String issuerName) { this.issuerName = issuerName; }
    public String getRecipientCnpj() { return recipientCnpj; }
    public void setRecipientCnpj(String recipientCnpj) { this.recipientCnpj = recipientCnpj; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getTotalValue() { return totalValue; }
    public void setTotalValue(Double totalValue) { this.totalValue = totalValue; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getRawExtractedText() { return rawExtractedText; }
    public void setRawExtractedText(String rawExtractedText) { this.rawExtractedText = rawExtractedText; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
