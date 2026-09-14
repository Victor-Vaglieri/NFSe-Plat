package com.nfse.saas.repositories.app;

import com.nfse.saas.models.app.ServiceOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {
    List<ServiceOrder> findByTenantId(Long tenantId);
    List<ServiceOrder> findByContractIdAndTenantId(Long contractId, Long tenantId);
}
