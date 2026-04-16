package com.photo.backend.db.entity;

import java.util.Date;

public class Users {
    private Long userId;

    private String username;

    private String password;

    private Date createdAt;

    private Date updatedAt;

    private Integer storageLimitMb;

    private Long storageUsedBytes;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getStorageLimitMb() {
        return storageLimitMb;
    }

    public void setStorageLimitMb(Integer storageLimitMb) {
        this.storageLimitMb = storageLimitMb;
    }

    public Long getStorageUsedBytes() {
        return storageUsedBytes;
    }

    public void setStorageUsedBytes(Long storageUsedBytes) {
        this.storageUsedBytes = storageUsedBytes;
    }
}