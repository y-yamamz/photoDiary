package com.photo.backend.db.mapper;

import com.photo.backend.db.entity.InquiryReplies;
import com.photo.backend.db.entity.InquiryRepliesExample;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface InquiryRepliesMapper {
    long countByExample(InquiryRepliesExample example);

    int deleteByExample(InquiryRepliesExample example);

    int deleteByPrimaryKey(Long replyId);

    int insert(InquiryReplies row);

    int insertSelective(InquiryReplies row);

    List<InquiryReplies> selectByExampleWithBLOBs(InquiryRepliesExample example);

    List<InquiryReplies> selectByExample(InquiryRepliesExample example);

    InquiryReplies selectByPrimaryKey(Long replyId);

    int updateByExampleSelective(@Param("row") InquiryReplies row, @Param("example") InquiryRepliesExample example);

    int updateByExampleWithBLOBs(@Param("row") InquiryReplies row, @Param("example") InquiryRepliesExample example);

    int updateByExample(@Param("row") InquiryReplies row, @Param("example") InquiryRepliesExample example);

    int updateByPrimaryKeySelective(InquiryReplies row);

    int updateByPrimaryKeyWithBLOBs(InquiryReplies row);

    int updateByPrimaryKey(InquiryReplies row);
}