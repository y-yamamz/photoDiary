package com.photo.backend.dto.request;

/**
 * 管理者によるユーザー容量上限変更リクエスト。
 * username でユーザーを特定して limitMb を更新する。
 */
public class StorageLimitRequest {
    private String adminSecret;
    private String username;
    private int limitMb;

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

    public int getLimitMb() {
        return limitMb;
    }

    public void setLimitMb(int limitMb) {
        this.limitMb = limitMb;
    }
}
