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
        // Docker環境では ALLOWED_ORIGINS 環境変数でオリジンを追加できる
        // ワイルドカードパターンも使用可能
        // 例: ALLOWED_ORIGINS=http://192.168.0.100,https://*.trycloudflare.com
        String extraOrigins = System.getenv("ALLOWED_ORIGINS");
        java.util.List<String> patterns = new java.util.ArrayList<>(
            java.util.Arrays.asList("http://localhost:5173", "http://localhost:3000")
        );
        if (extraOrigins != null && !extraOrigins.isBlank()) {
            for (String o : extraOrigins.split(",")) {
                patterns.add(o.trim());
            }
        }
        registry.addMapping("/api/**")
                .allowedOriginPatterns(patterns.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
