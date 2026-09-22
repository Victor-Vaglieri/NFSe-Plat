package com.nfse.saas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NfseSaasApplication {

	public static void main(String[] args) {
		SpringApplication.run(NfseSaasApplication.class, args);
	}

}