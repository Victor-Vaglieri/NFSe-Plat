package com.nfse.saas.dtos;

public class JwtResponse {
    private String accessToken;

    public JwtResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getAccess_token() { return accessToken; }
    public void setAccess_token(String accessToken) { this.accessToken = accessToken; }
}
