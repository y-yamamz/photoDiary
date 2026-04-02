package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.PhotoTagsExample;
import com.photo.backend.db.entity.PhotoTagsKey;
import java.util.List;

import javax.management.MXBean;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PhotoTagsMapper {
    long countByExample(PhotoTagsExample example);

    int deleteByExample(PhotoTagsExample example);

    int deleteByPrimaryKey(PhotoTagsKey key);

    int insert(PhotoTagsKey row);

    int insertSelective(PhotoTagsKey row);

    List<PhotoTagsKey> selectByExample(PhotoTagsExample example);

    int updateByExampleSelective(@Param("row") PhotoTagsKey row, @Param("example") PhotoTagsExample example);

    int updateByExample(@Param("row") PhotoTagsKey row, @Param("example") PhotoTagsExample example);
}