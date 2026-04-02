package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.PhotoGroups;
import com.photo.backend.db.entity.PhotoGroupsExample;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PhotoGroupsMapper {
    long countByExample(PhotoGroupsExample example);

    int deleteByExample(PhotoGroupsExample example);

    int deleteByPrimaryKey(Long groupId);

    int insert(PhotoGroups row);

    int insertSelective(PhotoGroups row);

    List<PhotoGroups> selectByExampleWithBLOBs(PhotoGroupsExample example);

    List<PhotoGroups> selectByExample(PhotoGroupsExample example);

    PhotoGroups selectByPrimaryKey(Long groupId);

    int updateByExampleSelective(@Param("row") PhotoGroups row, @Param("example") PhotoGroupsExample example);

    int updateByExampleWithBLOBs(@Param("row") PhotoGroups row, @Param("example") PhotoGroupsExample example);

    int updateByExample(@Param("row") PhotoGroups row, @Param("example") PhotoGroupsExample example);

    int updateByPrimaryKeySelective(PhotoGroups row);

    int updateByPrimaryKeyWithBLOBs(PhotoGroups row);

    int updateByPrimaryKey(PhotoGroups row);
}