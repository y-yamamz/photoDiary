package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PhotoGroupResponse {
    private Long groupId;
    private Long userId;
    private String groupName;
    private String comment;
    private Integer sortOrder;
    private String createdAt;
}
