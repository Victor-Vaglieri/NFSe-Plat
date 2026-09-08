package com.nfse.saas.security;

import com.nfse.saas.models.auth.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long tenantId;
    private String username; // We use email as username
    private String password;

    public UserDetailsImpl(Long id, Long tenantId, String username, String password) {
        this.id = id;
        this.tenantId = tenantId;
        this.username = username;
        this.password = password;
    }

    public static UserDetailsImpl build(User user) {
        return new UserDetailsImpl(
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getHashedPassword()
        );
    }

    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList(); // Authorities left empty for now
    }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
