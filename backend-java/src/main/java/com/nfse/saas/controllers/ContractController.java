package com.nfse.saas.controllers;

import com.nfse.saas.models.app.Contract;
import com.nfse.saas.repositories.app.ContractRepository;
import com.nfse.saas.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    @Autowired
    private ContractRepository contractRepository;

    @GetMapping("/")
    public ResponseEntity<List<Contract>> getContracts() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(contractRepository.findByTenantId(userDetails.getTenantId()));
    }

    @PostMapping("/")
    public ResponseEntity<Contract> createContract(@RequestBody Contract contract) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        contract.setTenantId(userDetails.getTenantId());
        contract.setStatus("ACTIVE");
        
        // Handle dates properly in real world, ignoring strict validations for brevity
        if (contract.getStartDate() == null) {
            contract.setStartDate(LocalDateTime.now());
        }
        
        Contract saved = contractRepository.save(contract);
        return ResponseEntity.ok(saved);
    }
}
