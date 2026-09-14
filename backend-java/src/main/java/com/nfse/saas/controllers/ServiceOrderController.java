package com.nfse.saas.controllers;

import com.nfse.saas.models.app.Contract;
import com.nfse.saas.models.app.ServiceOrder;
import com.nfse.saas.repositories.app.ContractRepository;
import com.nfse.saas.repositories.app.ServiceOrderRepository;
import com.nfse.saas.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/service-orders")
public class ServiceOrderController {

    @Autowired
    private ServiceOrderRepository serviceOrderRepository;
    
    @Autowired
    private ContractRepository contractRepository;

    @Value("${app-config.upload-dir}")
    private String uploadDirConfig;

    @GetMapping("/")
    public ResponseEntity<List<ServiceOrder>> getServiceOrders() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(serviceOrderRepository.findByTenantId(userDetails.getTenantId()));
    }

    @PostMapping("/")
    public ResponseEntity<?> createServiceOrder(
            @RequestParam("contract_id") Long contractId,
            @RequestParam("description") String description,
            @RequestParam("value") Double value,
            @RequestParam(value = "file", required = false) MultipartFile file) {
            
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long tenantId = userDetails.getTenantId();

        Optional<Contract> contractOpt = contractRepository.findById(contractId);
        if (contractOpt.isEmpty() || !contractOpt.get().getTenantId().equals(tenantId)) {
            return ResponseEntity.badRequest().body(Map.of("detail", "Contrato não encontrado."));
        }

        ServiceOrder os = new ServiceOrder();
        os.setTenantId(tenantId);
        os.setContract(contractOpt.get());
        os.setDescription(description);
        os.setValue(value);
        os.setStatus("PENDING");
        os.setExecutionDate(LocalDateTime.now());

        if (file != null && !file.isEmpty()) {
            try {
                File uploadDir = new File(uploadDirConfig).getAbsoluteFile();
                if (!uploadDir.exists()) uploadDir.mkdirs();

                String originalFilename = file.getOriginalFilename();
                String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
                File targetFile = new File(uploadDir, uniqueFilename);
                file.transferTo(targetFile);
                
                os.setFilePath("uploads/" + uniqueFilename);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of("detail", "Erro ao salvar arquivo da OS."));
            }
        }
        
        ServiceOrder saved = serviceOrderRepository.save(os);
        return ResponseEntity.ok(saved);
    }
}
