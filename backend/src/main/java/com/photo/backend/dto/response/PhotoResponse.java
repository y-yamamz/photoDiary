package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PhotoResponse {
    private Long photoId;
    private Long userId;
    private Long groupId;
    private String filePath;
    private String fileName;
    private String takenAt;
    private String location;
    private String description;
    private Integer sortOrder;
    private String createdAt;
    private List<TagResponse> tags;
}
