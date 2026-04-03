package com.photo.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

/**
 * グループ登録・更新リクエスト。
 */
@Getter
@Setter
public class PhotoGroupRequest {
    private String groupName;
    private String comment;
}
