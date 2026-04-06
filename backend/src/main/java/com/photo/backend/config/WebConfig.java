package com.photo.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS設定。画像配信は ImageController が担当する。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Docker環境では ALLOWED_ORIGINS 環境変数で許可オリジンを追加できる
        // 例: ALLOWED_ORIGINS=http://192.168.0.100,https://example.com
        String extraOrigins = System.getenv("ALLOWED_ORIGINS");
        java.util.List<String> origins = new java.util.ArrayList<>(
            java.util.Arrays.asList("http://localhost:5173", "http://localhost:3000")
        );
        if (extraOrigins != null && !extraOrigins.isBlank()) {
            for (String o : extraOrigins.split(",")) {
                origins.add(o.trim());
            }
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
