package com.photo.backend.db.entity;

import java.util.Date;

public class NoticeReads extends NoticeReadsKey {
    private Date readAt;

    public Date getReadAt() {
        return readAt;
    }

    public void setReadAt(Date readAt) {
        this.readAt = readAt;
    }
}