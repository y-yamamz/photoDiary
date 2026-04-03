package com.photo.backend.service;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.db.entity.PhotoGroups;
import com.photo.backend.db.entity.PhotoGroupsExample;
import com.photo.backend.db.mapper.PhotoGroupsMapper;
import com.photo.backend.dto.request.PhotoGroupRequest;
import com.photo.backend.dto.response.PhotoGroupResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * グループのCRUDサービス。
 * 全操作でユーザー所有確認を行う。
 */
@Service
public class PhotoGroupService {

    private final PhotoGroupsMapper photoGroupsMapper;
    private static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");

    public PhotoGroupService(PhotoGroupsMapper photoGroupsMapper) {
        this.photoGroupsMapper = photoGroupsMapper;
    }

    /** グループ一覧取得 */
    public List<PhotoGroupResponse> getAll(Long userId) {
        PhotoGroupsExample example = new PhotoGroupsExample();
        example.createCriteria().andUserIdEqualTo(userId);
        example.setOrderByClause("sort_order ASC, group_id ASC");
        return photoGroupsMapper.selectByExample(example).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** グループ登録 */
    public PhotoGroupResponse create(Long userId, PhotoGroupRequest request) {
        PhotoGroups group = new PhotoGroups();
        group.setUserId(userId);
        group.setGroupName(request.getGroupName());
        group.setComment(request.getComment());
        group.setCreatedAt(new Date());
        photoGroupsMapper.insertSelective(group);
        return toResponse(photoGroupsMapper.selectByPrimaryKey(group.getGroupId()));
    }

    /** グループ更新 */
    public PhotoGroupResponse update(Long userId, Long groupId, PhotoGroupRequest request) {
        PhotoGroups group = getOwnedGroup(userId, groupId);
        group.setGroupName(request.getGroupName());
        group.setComment(request.getComment());
        photoGroupsMapper.updateByPrimaryKeySelective(group);
        return toResponse(photoGroupsMapper.selectByPrimaryKey(groupId));
    }

    /** グループ削除 */
    public void delete(Long userId, Long groupId) {
        getOwnedGroup(userId, groupId); // 所有確認
        photoGroupsMapper.deleteByPrimaryKey(groupId);
    }

    // ── private ─────────────────────────────────────────────────

    private PhotoGroups getOwnedGroup(Long userId, Long groupId) {
        PhotoGroups group = photoGroupsMapper.selectByPrimaryKey(groupId);
        if (group == null || !group.getUserId().equals(userId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "グループが見つかりません");
        }
        return group;
    }

    private PhotoGroupResponse toResponse(PhotoGroups g) {
        return PhotoGroupResponse.builder()
                .groupId(g.getGroupId())
                .userId(g.getUserId())
                .groupName(g.getGroupName())
                .comment(g.getComment())
                .sortOrder(g.getSortOrder())
                .createdAt(g.getCreatedAt() != null ? SDF.format(g.getCreatedAt()) : null)
                .build();
    }
}
