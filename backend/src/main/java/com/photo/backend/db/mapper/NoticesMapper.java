package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.Notices;
import com.photo.backend.db.entity.NoticesExample;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoticesMapper {
    long countByExample(NoticesExample example);

    int deleteByExample(NoticesExample example);

    int deleteByPrimaryKey(Long noticeId);

    int insert(Notices row);

    int insertSelective(Notices row);

    List<Notices> selectByExampleWithBLOBs(NoticesExample example);

    List<Notices> selectByExample(NoticesExample example);

    Notices selectByPrimaryKey(Long noticeId);

    int updateByExampleSelective(@Param("row") Notices row, @Param("example") NoticesExample example);

    int updateByExampleWithBLOBs(@Param("row") Notices row, @Param("example") NoticesExample example);

    int updateByExample(@Param("row") Notices row, @Param("example") NoticesExample example);

    int updateByPrimaryKeySelective(Notices row);

    int updateByPrimaryKeyWithBLOBs(Notices row);

    int updateByPrimaryKey(Notices row);
}