package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.Tags;
import com.photo.backend.db.entity.TagsExample;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TagsMapper {
    long countByExample(TagsExample example);

    int deleteByExample(TagsExample example);

    int deleteByPrimaryKey(Long tagId);

    int insert(Tags row);

    int insertSelective(Tags row);

    List<Tags> selectByExample(TagsExample example);

    Tags selectByPrimaryKey(Long tagId);

    int updateByExampleSelective(@Param("row") Tags row, @Param("example") TagsExample example);

    int updateByExample(@Param("row") Tags row, @Param("example") TagsExample example);

    int updateByPrimaryKeySelective(Tags row);

    int updateByPrimaryKey(Tags row);
}