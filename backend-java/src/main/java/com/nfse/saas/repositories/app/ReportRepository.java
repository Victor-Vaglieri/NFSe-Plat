package com.nfse.saas.repositories.app;

import com.nfse.saas.models.app.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    
    Report findFirstByTenantIdAndReferenceMonthAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            Long tenantId, String referenceMonth, LocalDateTime createdAt);
}
