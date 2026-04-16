package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.NoticeReads;
import com.photo.backend.db.entity.NoticeReadsExample;
import com.photo.backend.db.entity.NoticeReadsKey;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoticeReadsMapper {
    long countByExample(NoticeReadsExample example);

    int deleteByExample(NoticeReadsExample example);

    int deleteByPrimaryKey(NoticeReadsKey key);

    int insert(NoticeReads row);

    int insertSelective(NoticeReads row);

    List<NoticeReads> selectByExample(NoticeReadsExample example);

    NoticeReads selectByPrimaryKey(NoticeReadsKey key);

    int updateByExampleSelective(@Param("row") NoticeReads row, @Param("example") NoticeReadsExample example);

    int updateByExample(@Param("row") NoticeReads row, @Param("example") NoticeReadsExample example);

    int updateByPrimaryKeySelective(NoticeReads row);

    int updateByPrimaryKey(NoticeReads row);
}