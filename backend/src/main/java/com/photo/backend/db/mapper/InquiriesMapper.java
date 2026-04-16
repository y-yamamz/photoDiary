package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.Inquiries;
import com.photo.backend.db.entity.InquiriesExample;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface InquiriesMapper {
    long countByExample(InquiriesExample example);

    int deleteByExample(InquiriesExample example);

    int deleteByPrimaryKey(Long inquiryId);

    int insert(Inquiries row);

    int insertSelective(Inquiries row);

    List<Inquiries> selectByExampleWithBLOBs(InquiriesExample example);

    List<Inquiries> selectByExample(InquiriesExample example);

    Inquiries selectByPrimaryKey(Long inquiryId);

    int updateByExampleSelective(@Param("row") Inquiries row, @Param("example") InquiriesExample example);

    int updateByExampleWithBLOBs(@Param("row") Inquiries row, @Param("example") InquiriesExample example);

    int updateByExample(@Param("row") Inquiries row, @Param("example") InquiriesExample example);

    int updateByPrimaryKeySelective(Inquiries row);

    int updateByPrimaryKeyWithBLOBs(Inquiries row);

    int updateByPrimaryKey(Inquiries row);
}