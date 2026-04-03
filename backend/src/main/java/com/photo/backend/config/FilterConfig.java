package com.photo.backend.config;

import com.photo.backend.security.JwtAuthFilter;
import com.photo.backend.security.JwtProvider;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * JWTフィルターをサーブレットコンテナに登録する。
 */
@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtProvider jwtProvider) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new JwtAuthFilter(jwtProvider));
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1);
        return registration;
    }
}
