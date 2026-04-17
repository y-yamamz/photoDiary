package com.photo.backend.service;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.db.entity.*;
import com.photo.backend.db.mapper.*;
import com.photo.backend.dto.request.AdminNoticeRequest;
import com.photo.backend.dto.request.AdminReplyRequest;
import com.photo.backend.dto.request.BoardInquiryRequest;
import com.photo.backend.dto.response.AdminInquiryResponse;
import com.photo.backend.dto.response.InquiryReplyResponse;
import com.photo.backend.dto.response.InquiryResponse;
import com.photo.backend.dto.response.NoticeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 掲示板機能のビジネスロジックを担当するサービス。
 *
 * ユーザー向け操作：
 *   - お知らせ一覧取得（未読フラグ付き）+ 一括既読化
 *   - ヘッダーバッジ用・未読件数取得
 *   - 自分の問い合わせ一覧取得（返信含む）
 *   - 問い合わせ新規送信
 *
 * 管理者向け操作：
 *   - お知らせ一覧取得 / 新規投稿 / 編集 / 削除
 *   - 全ユーザーの問い合わせ一覧取得（ユーザー名 + 返信含む）
 *   - 問い合わせへの返信（個別 or 全体お知らせとして投稿）+ 対応済みへの更新
 */
@Service
public class BoardService {

    /** 日時フォーマット（表示用） */
    private static final String DATE_FORMAT = "yyyy-MM-dd HH:mm";

    private final NoticesMapper          noticesMapper;
    private final NoticesCustomMapper    noticesCustomMapper;
    private final NoticeReadsMapper      noticeReadsMapper;
    private final NoticeReadsCustomMapper noticeReadsCustomMapper;
    private final InquiriesMapper        inquiriesMapper;
    private final InquiryRepliesMapper   inquiryRepliesMapper;
    private final UsersMapper            usersMapper;

    public BoardService(NoticesMapper noticesMapper,
                        NoticesCustomMapper noticesCustomMapper,
                        NoticeReadsMapper noticeReadsMapper,
                        NoticeReadsCustomMapper noticeReadsCustomMapper,
                        InquiriesMapper inquiriesMapper,
                        InquiryRepliesMapper inquiryRepliesMapper,
                        UsersMapper usersMapper) {
        this.noticesMapper           = noticesMapper;
        this.noticesCustomMapper     = noticesCustomMapper;
        this.noticeReadsMapper       = noticeReadsMapper;
        this.noticeReadsCustomMapper = noticeReadsCustomMapper;
        this.inquiriesMapper         = inquiriesMapper;
        this.inquiryRepliesMapper    = inquiryRepliesMapper;
        this.usersMapper             = usersMapper;
    }

    // =========================================================
    // ユーザー向け操作
    // =========================================================

    /**
     * お知らせ一覧を取得し、未読だったものを既読に更新する。
     *
     * 処理フロー：
     *   1. notices を全件取得（新しい順）
     *   2. 当該ユーザーの既読 notice_id セットを取得
     *   3. 未読フラグを付与してレスポンスを構築
     *   4. 未読だったお知らせを一括 INSERT IGNORE で既読化
     *
     * @param userId 認証済みユーザーID
     * @return 未読フラグ付きのお知らせ一覧（新しい順）
     */
    @Transactional
    public List<NoticeResponse> getNoticesForUser(Long userId) {
        SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);

        // 1. 全体配信 + 当該ユーザー宛の個人通知を取得（新しい順）
        List<Notices> notices = noticesCustomMapper.selectForUserWithBLOBs(userId);

        if (notices.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. 当該ユーザーの既読 notice_id セットを取得
        NoticeReadsExample readsExample = new NoticeReadsExample();
        readsExample.createCriteria().andUserIdEqualTo(userId);
        Set<Long> readIds = noticeReadsMapper.selectByExample(readsExample)
                .stream()
                .map(NoticeReads::getNoticeId)
                .collect(Collectors.toSet());

        // 3. 未読フラグ・個人通知フラグを付与してレスポンス構築
        List<NoticeResponse> responses = notices.stream()
                .map(n -> NoticeResponse.builder()
                        .noticeId(n.getNoticeId())
                        .title(n.getTitle())
                        .body(n.getBody())
                        .createdAt(n.getCreatedAt() != null ? sdf.format(n.getCreatedAt()) : null)
                        .unread(!readIds.contains(n.getNoticeId()))
                        .personal(n.getTargetUserId() != null)
                        .build())
                .collect(Collectors.toList());

        // 4. 未読だったお知らせを一括既読化（INSERT IGNORE で重複は無視）
        List<Long> unreadIds = notices.stream()
                .map(Notices::getNoticeId)
                .filter(id -> !readIds.contains(id))
                .collect(Collectors.toList());
        if (!unreadIds.isEmpty()) {
            noticeReadsCustomMapper.bulkInsertIgnore(unreadIds, userId);
        }

        return responses;
    }

    /**
     * ヘッダーバッジ表示用の未読お知らせ件数を返す。
     *
     * notices テーブル全件から notice_reads に存在しないものをカウントする。
     * AlbumPage 初期表示時に呼び出す想定。
     *
     * @param userId 認証済みユーザーID
     * @return 未読お知らせ件数
     */
    public int getUnreadCount(Long userId) {
        return noticeReadsCustomMapper.countUnread(userId);
    }

    /**
     * 自分の問い合わせ一覧を返信込みで取得する。
     *
     * 各問い合わせに紐づく返信（inquiry_replies）を別途取得して付与する。
     * 問い合わせは新しい順（created_at DESC）で返す。
     *
     * @param userId 認証済みユーザーID
     * @return 問い合わせ一覧（返信リスト含む）
     */
    public List<InquiryResponse> getMyInquiries(Long userId) {
        SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);

        // 自分の問い合わせを新しい順で取得（body 含む）
        InquiriesExample example = new InquiriesExample();
        example.createCriteria().andUserIdEqualTo(userId);
        example.setOrderByClause("created_at DESC");
        List<Inquiries> inquiries = inquiriesMapper.selectByExampleWithBLOBs(example);

        return inquiries.stream()
                .map(inq -> InquiryResponse.builder()
                        .inquiryId(inq.getInquiryId())
                        .subject(inq.getSubject())
                        .body(inq.getBody())
                        .status(inq.getStatus() != null ? inq.getStatus().intValue() : 0)
                        .createdAt(inq.getCreatedAt() != null ? sdf.format(inq.getCreatedAt()) : null)
                        .replies(fetchReplies(inq.getInquiryId(), sdf))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * ユーザーが問い合わせを新規送信する。
     *
     * バリデーション：件名・本文が空でないことを確認する。
     *
     * @param userId  認証済みユーザーID
     * @param request 件名・本文
     */
    @Transactional
    public void submitInquiry(Long userId, BoardInquiryRequest request) {
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "件名を入力してください");
        }
        if (request.getBody() == null || request.getBody().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "本文を入力してください");
        }

        Inquiries inquiry = new Inquiries();
        inquiry.setUserId(userId);
        inquiry.setSubject(request.getSubject().trim());
        inquiry.setBody(request.getBody().trim());
        inquiry.setStatus((byte) 0); // 初期状態は「未対応」
        inquiry.setCreatedAt(new Date());
        inquiriesMapper.insertSelective(inquiry);
    }

    /**
     * ユーザーが自分の問い合わせを削除する。
     *
     * 所有者チェック：inquiries.user_id が認証済みユーザーと一致しない場合は 403 エラー。
     * FK の CASCADE DELETE により、紐づく inquiry_replies も自動削除される。
     * 管理者がすでに全体お知らせとして返信していた場合でも、notices は削除しない
     * （全ユーザーへの投稿済みお知らせを取り消すのは管理者の責任範囲とする）。
     *
     * @param inquiryId 削除対象の問い合わせID
     * @param userId    認証済みユーザーID（所有者チェック用）
     */
    @Transactional
    public void deleteMyInquiry(Long inquiryId, Long userId) {
        // 存在チェック
        Inquiries inquiry = inquiriesMapper.selectByPrimaryKey(inquiryId);
        if (inquiry == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "問い合わせが見つかりません");
        }
        // 所有者チェック：他ユーザーの問い合わせは削除不可
        if (!inquiry.getUserId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "この問い合わせを削除する権限がありません");
        }
        // 削除（CASCADE により inquiry_replies も自動削除される）
        inquiriesMapper.deleteByPrimaryKey(inquiryId);
    }

    // =========================================================
    // 管理者向け操作
    // =========================================================

    /**
     * お知らせ一覧を全件取得する（管理者向け）。
     *
     * 新しい順で返す。本文（body）も含む。
     *
     * @return お知らせ一覧
     */
    public List<NoticeResponse> getAllNotices() {
        SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);

        NoticesExample example = new NoticesExample();
        example.setOrderByClause("created_at DESC");
        List<Notices> notices = noticesMapper.selectByExampleWithBLOBs(example);

        return notices.stream()
                .map(n -> NoticeResponse.builder()
                        .noticeId(n.getNoticeId())
                        .title(n.getTitle())
                        .body(n.getBody())
                        .createdAt(n.getCreatedAt() != null ? sdf.format(n.getCreatedAt()) : null)
                        .unread(false) // 管理者側では未読フラグ不要
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 管理者が全ユーザーへのお知らせを新規投稿する。
     *
     * バリデーション：タイトル・本文が空でないことを確認する。
     *
     * @param request タイトル・本文
     */
    @Transactional
    public void createNotice(AdminNoticeRequest request) {
        validateNoticeRequest(request);

        Notices notice = new Notices();
        notice.setTitle(request.getTitle().trim());
        notice.setBody(request.getBody().trim());
        notice.setCreatedAt(new Date());
        noticesMapper.insertSelective(notice);
    }

    /**
     * 既存のお知らせを編集する。
     *
     * 指定した noticeId のお知らせが存在しない場合は 404 エラー。
     *
     * @param noticeId 編集対象のお知らせID
     * @param request  新しいタイトル・本文
     */
    @Transactional
    public void updateNotice(Long noticeId, AdminNoticeRequest request) {
        validateNoticeRequest(request);

        Notices existing = noticesMapper.selectByPrimaryKey(noticeId);
        if (existing == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "お知らせが見つかりません");
        }

        Notices updateRow = new Notices();
        updateRow.setNoticeId(noticeId);
        updateRow.setTitle(request.getTitle().trim());
        updateRow.setBody(request.getBody().trim());
        // selectByExampleWithBLOBs で body を取得しているため updateByPrimaryKeyWithBLOBs を使用
        noticesMapper.updateByPrimaryKeyWithBLOBs(updateRow);
    }

    /**
     * お知らせを削除する。
     *
     * CASCADE 設定により notice_reads の紐づきレコードも自動削除される。
     *
     * @param noticeId 削除対象のお知らせID
     */
    @Transactional
    public void deleteNotice(Long noticeId) {
        int deleted = noticesMapper.deleteByPrimaryKey(noticeId);
        if (deleted == 0) {
            throw new AppException(HttpStatus.NOT_FOUND, "お知らせが見つかりません");
        }
    }

    /**
     * 全ユーザーの問い合わせ一覧をユーザー名・返信込みで取得する（管理者向け）。
     *
     * 各問い合わせに対して：
     *   - UsersMapper からユーザー名を取得
     *   - InquiryRepliesMapper から返信を取得
     * して AdminInquiryResponse を構築する。
     *
     * @return 全問い合わせ一覧（新しい順）
     */
    public List<AdminInquiryResponse> getAllInquiries() {
        SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);

        // 全問い合わせを新しい順で取得（body 含む）
        InquiriesExample example = new InquiriesExample();
        example.setOrderByClause("created_at DESC");
        List<Inquiries> inquiries = inquiriesMapper.selectByExampleWithBLOBs(example);

        // ユーザー名のキャッシュ（同一ユーザーIDを何度も検索しないため）
        Map<Long, String> userNameCache = new HashMap<>();

        return inquiries.stream()
                .map(inq -> {
                    // ユーザー名をキャッシュから取得（なければDBから取得してキャッシュに登録）
                    String username = userNameCache.computeIfAbsent(inq.getUserId(), uid -> {
                        Users user = usersMapper.selectByPrimaryKey(uid);
                        return user != null ? user.getUsername() : "(削除済みユーザー)";
                    });

                    return AdminInquiryResponse.builder()
                            .inquiryId(inq.getInquiryId())
                            .userId(inq.getUserId())
                            .username(username)
                            .subject(inq.getSubject())
                            .body(inq.getBody())
                            .status(inq.getStatus() != null ? inq.getStatus().intValue() : 0)
                            .createdAt(inq.getCreatedAt() != null ? sdf.format(inq.getCreatedAt()) : null)
                            .replies(fetchReplies(inq.getInquiryId(), sdf))
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 管理者が問い合わせに返信し、ステータスを「対応済み」に更新する。
     *
     * 処理フロー（targetType=0：個別返信）：
     *   1. inquiry_replies に INSERT（notice_id=NULL）
     *   2. inquiries.status を 1（対応済み）に UPDATE
     *
     * 処理フロー（targetType=1：全体お知らせとして投稿）：
     *   1. notices に INSERT（タイトル + 返信本文）
     *   2. inquiry_replies に INSERT（notice_id=発行されたID）
     *   3. inquiries.status を 1（対応済み）に UPDATE
     *
     * ①〜③は @Transactional によりアトミックに実行される。
     *
     * @param inquiryId 返信対象の問い合わせID
     * @param request   返信本文・配信先種別・お知らせタイトル（全体投稿時）
     */
    @Transactional
    public void replyToInquiry(Long inquiryId, AdminReplyRequest request) {
        // 対象問い合わせの存在チェック
        Inquiries inquiry = inquiriesMapper.selectByPrimaryKey(inquiryId);
        if (inquiry == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "問い合わせが見つかりません");
        }

        if (request.getBody() == null || request.getBody().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "返信内容を入力してください");
        }

        Long noticeId = null;

        if (request.getTargetType() == 1) {
            // targetType=1（全体お知らせとして投稿）の場合
            if (request.getNoticeTitle() == null || request.getNoticeTitle().trim().isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "全体お知らせとして投稿する場合はタイトルを入力してください");
            }
            // ① notices テーブルに全体配信として INSERT
            Notices notice = new Notices();
            notice.setTitle(request.getNoticeTitle().trim());
            notice.setBody(request.getBody().trim());
            notice.setCreatedAt(new Date());
            noticesMapper.insertSelective(notice);
            // AUTO_INCREMENT で採番された ID を取得
            noticeId = notice.getNoticeId();
        } else {
            // targetType=0（個別返信）の場合：返信先ユーザーのお知らせに個人通知を登録
            Notices personalNotice = new Notices();
            personalNotice.setTargetUserId(inquiry.getUserId());
            personalNotice.setTitle("「" + inquiry.getSubject() + "」へのご返信");
            personalNotice.setBody(request.getBody().trim());
            personalNotice.setCreatedAt(new Date());
            noticesMapper.insertSelective(personalNotice);
            noticeId = personalNotice.getNoticeId();
        }

        // ② inquiry_replies テーブルに INSERT
        InquiryReplies reply = new InquiryReplies();
        reply.setInquiryId(inquiryId);
        reply.setBody(request.getBody().trim());
        reply.setTargetType((byte) request.getTargetType());
        reply.setNoticeId(noticeId); // 個別返信の場合は NULL
        reply.setCreatedAt(new Date());
        inquiryRepliesMapper.insertSelective(reply);

        // ③ inquiries.status を「対応済み（1）」に更新
        Inquiries updateRow = new Inquiries();
        updateRow.setStatus((byte) 1);
        InquiriesExample updateExample = new InquiriesExample();
        updateExample.createCriteria().andInquiryIdEqualTo(inquiryId);
        inquiriesMapper.updateByExampleSelective(updateRow, updateExample);
    }

    /**
     * 管理者が問い合わせへの返信を削除する。
     *
     * 処理フロー：
     *   1. 対象の返信を取得（存在チェック）
     *   2. inquiry_replies から削除
     *   3. targetType=1（全体お知らせとして投稿）かつ notice_id が存在する場合、
     *      notices テーブルからも削除する（全ユーザーのお知らせ一覧から消える）
     *   4. 紐づく inquiries.status を 0（未対応）に戻す
     *      （返信が消えたため、再度対応が必要な状態に戻す）
     *
     * ①〜④は @Transactional によりアトミックに実行される。
     *
     * @param replyId 削除対象の返信ID
     */
    @Transactional
    public void deleteReply(Long replyId) {
        // 1. 返信の存在チェックと内容取得（notice_id が必要なため）
        // body は BLOB のため WithBLOBs でなく PrimaryKey で取得（bodyは不要）
        InquiryReplies reply = inquiryRepliesMapper.selectByPrimaryKey(replyId);
        if (reply == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "返信が見つかりません");
        }

        Long inquiryId = reply.getInquiryId();
        Long linkedNoticeId = reply.getNoticeId(); // null = 個別返信

        // 2. inquiry_replies から返信を削除
        inquiryRepliesMapper.deleteByPrimaryKey(replyId);

        // 3. 全体お知らせとして投稿されていた場合、notices からも削除する
        //    （全ユーザーのお知らせ一覧から消す）
        if (linkedNoticeId != null) {
            noticesMapper.deleteByPrimaryKey(linkedNoticeId);
        }

        // 4. 問い合わせのステータスを「未対応（0）」に戻す
        //    返信が削除されたため、再対応が必要な状態に戻す
        Inquiries updateRow = new Inquiries();
        updateRow.setStatus((byte) 0);
        InquiriesExample updateExample = new InquiriesExample();
        updateExample.createCriteria().andInquiryIdEqualTo(inquiryId);
        inquiriesMapper.updateByExampleSelective(updateRow, updateExample);
    }

    // =========================================================
    // プライベートヘルパー
    // =========================================================

    /**
     * 指定問い合わせIDに紐づく返信リストを取得する。
     *
     * 返信は作成日時昇順（古い順）で返す。
     *
     * @param inquiryId 問い合わせID
     * @param sdf       日時フォーマッター
     * @return 返信レスポンスリスト
     */
    private List<InquiryReplyResponse> fetchReplies(Long inquiryId, SimpleDateFormat sdf) {
        InquiryRepliesExample example = new InquiryRepliesExample();
        example.createCriteria().andInquiryIdEqualTo(inquiryId);
        example.setOrderByClause("created_at ASC");
        // body は BLOB カラムのため selectByExampleWithBLOBs を使用
        return inquiryRepliesMapper.selectByExampleWithBLOBs(example).stream()
                .map(r -> InquiryReplyResponse.builder()
                        .replyId(r.getReplyId())
                        .body(r.getBody())
                        .targetType(r.getTargetType() != null ? r.getTargetType().intValue() : 0)
                        .createdAt(r.getCreatedAt() != null ? sdf.format(r.getCreatedAt()) : null)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * お知らせ投稿・編集リクエストのバリデーション。
     *
     * @param request タイトル・本文を含むリクエスト
     * @throws AppException タイトルまたは本文が空の場合
     */
    private void validateNoticeRequest(AdminNoticeRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "タイトルを入力してください");
        }
        if (request.getBody() == null || request.getBody().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "本文を入力してください");
        }
    }
}
