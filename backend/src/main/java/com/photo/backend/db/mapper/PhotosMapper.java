package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.Photos;
import com.photo.backend.db.entity.PhotosExample;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PhotosMapper {
    long countByExample(PhotosExample example);

    int deleteByExample(PhotosExample example);

    int deleteByPrimaryKey(Long photoId);

    int insert(Photos row);

    int insertSelective(Photos row);

    List<Photos> selectByExampleWithBLOBs(PhotosExample example);

    List<Photos> selectByExample(PhotosExample example);

    Photos selectByPrimaryKey(Long photoId);

    int updateByExampleSelective(@Param("row") Photos row, @Param("example") PhotosExample example);

    int updateByExampleWithBLOBs(@Param("row") Photos row, @Param("example") PhotosExample example);

    int updateByExample(@Param("row") Photos row, @Param("example") PhotosExample example);

    int updateByPrimaryKeySelective(Photos row);

    int updateByPrimaryKeyWithBLOBs(Photos row);

    int updateByPrimaryKey(Photos row);
}