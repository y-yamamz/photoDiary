package com.photo.backend.dto.request;

/**
 * 管理者によるストレージ使用量再計算リクエスト。
 */
public class RecalculateStorageRequest {
    private String adminSecret;
    private String username;

    public String getAdminSecret() {
        return adminSecret;
    }

    public void setAdminSecret(String adminSecret) {
        this.adminSecret = adminSecret;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
