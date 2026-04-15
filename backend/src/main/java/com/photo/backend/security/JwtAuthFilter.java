package com.photo.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 全リクエストに対してJWTを検証するフィルター。
 * /api/login は認証不要のためスキップする。
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String USER_ID_ATTR = "userId";

    private final JwtProvider jwtProvider;

    public JwtAuthFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // ログイン・ユーザー登録・パスワード変更・ファイル配信は認証不要
        return path.equals("/api/login")
                || path.equals("/api/users/register")
                || path.equals("/api/users/password")
                || path.startsWith("/images/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(AUTH_HEADER);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            unauthorized(response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length());
        if (!jwtProvider.validate(token)) {
            unauthorized(response);
            return;
        }

        // 検証済みユーザーIDをリクエスト属性に保存し後続処理へ渡す
        request.setAttribute(USER_ID_ATTR, jwtProvider.getUserId(token));
        chain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"認証が必要です\"}");
    }
}
