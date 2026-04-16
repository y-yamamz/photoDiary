package com.photo.backend.controller;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.dto.request.AdminNoticeRequest;
import com.photo.backend.dto.request.AdminReplyRequest;
import com.photo.backend.dto.response.AdminInquiryResponse;
import com.photo.backend.dto.response.NoticeResponse;
import com.photo.backend.service.BoardService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理者向け掲示板API。
 *
 * 既存 AdminController と分離し、掲示板操作を専用クラスに集約する。
 * JwtAuthFilter の除外対象（/api/admin/**）のため JWT 認証不要。
 * 代わりにすべてのエンドポイントで管理者シークレットキーを検証する。
 *
 * GET    /api/admin/board/notices                 お知らせ一覧取得
 * POST   /api/admin/board/notices                 お知らせ新規投稿
 * PUT    /api/admin/board/notices/{noticeId}      お知らせ編集
 * DELETE /api/admin/board/notices/{noticeId}      お知らせ削除
 * GET    /api/admin/board/inquiries               全ユーザー問い合わせ一覧取得
 * POST   /api/admin/board/inquiries/{id}/reply    問い合わせへ返信 + 対応済みへ更新
 */
@RestController
@RequestMapping("/api/admin/board")
public class AdminBoardController {

    private final BoardService boardService;

    /** application.yml の admin.secret を注入 */
    @Value("${admin.secret}")
    private String adminSecret;

    public AdminBoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    // =========================================================
    // お知らせ管理
    // =========================================================

    /**
     * お知らせ一覧を全件取得する。
     *
     * 管理者シークレットキーを QueryParam で受け取る。
     * フロント側の管理者画面「お知らせ投稿」タブの投稿済み一覧表示に使用する。
     *
     * @param secret 管理者シークレットキー（クエリパラメータ）
     * @return お知らせ一覧（新しい順）
     */
    @GetMapping("/notices")
    public ResponseEntity<ApiResponse<List<NoticeResponse>>> getNotices(
            @RequestParam String adminSecret) {
        verifySecret(adminSecret);
        return ResponseEntity.ok(ApiResponse.success(boardService.getAllNotices()));
    }

    /**
     * 全ユーザーへのお知らせを新規投稿する。
     *
     * リクエストボディの adminSecret でシークレットキーを検証する。
     * 投稿後すぐに全ユーザーのお知らせ一覧に表示される。
     *
     * @param request タイトル・本文・管理者シークレットキー
     * @return 成功時は 201 Created
     */
    @PostMapping("/notices")
    public ResponseEntity<ApiResponse<Void>> createNotice(
            @RequestBody AdminNoticeRequest request) {
        verifySecret(request.getAdminSecret());
        boardService.createNotice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null));
    }

    /**
     * 既存のお知らせを編集する。
     *
     * タイトルと本文を更新する。
     * 対象の noticeId が存在しない場合は 404 エラー。
     *
     * @param noticeId 編集対象のお知らせID（PathVariable）
     * @param request  新しいタイトル・本文・管理者シークレットキー
     * @return 成功時は 200 OK
     */
    @PutMapping("/notices/{noticeId}")
    public ResponseEntity<ApiResponse<Void>> updateNotice(
            @PathVariable Long noticeId,
            @RequestBody AdminNoticeRequest request) {
        verifySecret(request.getAdminSecret());
        boardService.updateNotice(noticeId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * お知らせを削除する。
     *
     * notice_reads の紐づきレコードは CASCADE DELETE により自動削除される。
     * 対象の noticeId が存在しない場合は 404 エラー。
     *
     * @param noticeId    削除対象のお知らせID（PathVariable）
     * @param adminSecret 管理者シークレットキー（クエリパラメータ）
     * @return 成功時は 200 OK
     */
    @DeleteMapping("/notices/{noticeId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(
            @PathVariable Long noticeId,
            @RequestParam String adminSecret) {
        verifySecret(adminSecret);
        boardService.deleteNotice(noticeId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // =========================================================
    // 問い合わせ管理
    // =========================================================

    /**
     * 全ユーザーの問い合わせ一覧をユーザー名・返信込みで取得する。
     *
     * 管理者シークレットキーを QueryParam で受け取る。
     * フロント側の管理者画面「問い合わせ一覧」タブの表示に使用する。
     * 未対応の件数はフロント側で status=0 のもをカウントして算出する。
     *
     * @param adminSecret 管理者シークレットキー（クエリパラメータ）
     * @return 問い合わせ一覧（ユーザー名・返信含む、新しい順）
     */
    @GetMapping("/inquiries")
    public ResponseEntity<ApiResponse<List<AdminInquiryResponse>>> getInquiries(
            @RequestParam String adminSecret) {
        verifySecret(adminSecret);
        return ResponseEntity.ok(ApiResponse.success(boardService.getAllInquiries()));
    }

    /**
     * 問い合わせに返信し、ステータスを「対応済み」に更新する。
     *
     * targetType=0（個別返信）の場合：
     *   - inquiry_replies に INSERT（notice_id=NULL）
     *   - inquiries.status を 1（対応済み）に UPDATE
     *
     * targetType=1（全体お知らせとして投稿）の場合：
     *   - notices に INSERT（全ユーザーのお知らせ一覧に表示）
     *   - inquiry_replies に INSERT（notice_id=発行されたID）
     *   - inquiries.status を 1（対応済み）に UPDATE
     *
     * 上記処理は BoardService 内で @Transactional によりアトミックに実行される。
     *
     * @param inquiryId 返信対象の問い合わせID（PathVariable）
     * @param request   返信本文・配信先種別・お知らせタイトル・管理者シークレットキー
     * @return 成功時は 200 OK
     */
    @PostMapping("/inquiries/{inquiryId}/reply")
    public ResponseEntity<ApiResponse<Void>> replyToInquiry(
            @PathVariable Long inquiryId,
            @RequestBody AdminReplyRequest request) {
        verifySecret(request.getAdminSecret());
        boardService.replyToInquiry(inquiryId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 問い合わせへの返信を削除する。
     *
     * 返信削除後の処理（BoardService 内でトランザクション保証）：
     *   - targetType=1（全体お知らせとして投稿）の場合、notices テーブルからも削除する
     *     → 全ユーザーのお知らせ一覧からも消える
     *   - 対象の問い合わせステータスを 0（未対応）に戻す
     *     → 返信が消えたため再対応が必要な状態に戻す
     *
     * @param replyId     削除対象の返信ID（PathVariable）
     * @param adminSecret 管理者シークレットキー（クエリパラメータ）
     * @return 成功時は 200 OK
     */
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> deleteReply(
            @PathVariable Long replyId,
            @RequestParam String adminSecret) {
        verifySecret(adminSecret);
        boardService.deleteReply(replyId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── プライベートヘルパー ─────────────────────────────

    /**
     * 管理者シークレットキーを検証する。
     *
     * 不一致の場合は 403 Forbidden エラーをスローする。
     * 全エンドポイントの冒頭で呼び出す。
     *
     * @param secret リクエストから受け取ったシークレットキー
     */
    private void verifySecret(String secret) {
        if (!this.adminSecret.equals(secret)) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
    }
}
