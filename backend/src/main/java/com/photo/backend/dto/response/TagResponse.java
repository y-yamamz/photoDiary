package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TagResponse {
    private Long tagId;
    private String tagName;
}
