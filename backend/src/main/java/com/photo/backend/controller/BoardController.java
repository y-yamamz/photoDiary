package com.photo.backend.controller;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.dto.request.BoardInquiryRequest;
import com.photo.backend.dto.response.InquiryResponse;
import com.photo.backend.dto.response.NoticeResponse;
import com.photo.backend.service.BoardService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ユーザー向け掲示板API。
 *
 * JwtAuthFilter により JWT 認証が必須。
 * リクエスト属性 "userId" から認証済みユーザーIDを取得して使用する。
 *
 * GET  /api/board/notices          お知らせ一覧取得（取得と同時に既読化）
 * GET  /api/board/notices/unread   未読件数取得（ヘッダーバッジ用）
 * GET  /api/board/inquiries        自分の問い合わせ一覧取得
 * POST /api/board/inquiries        問い合わせ新規送信
 */
@RestController
@RequestMapping("/api/board")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    /**
     * お知らせ一覧を取得し、表示したお知らせを全て既読にする。
     *
     * ユーザーがお知らせタブを開いた際に呼び出す。
     * 返却データには各お知らせの未読フラグ（unread）が含まれ、
     * タブを開いた時点での未読/既読状態をフロント側で表示できる。
     * 取得と同時にサーバー側では全件を既読化する。
     *
     * @param httpRequest JWT認証済みリクエスト（userId 属性を含む）
     * @return 未読フラグ付きのお知らせ一覧
     */
    @GetMapping("/notices")
    public ResponseEntity<ApiResponse<List<NoticeResponse>>> getNotices(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        List<NoticeResponse> notices = boardService.getNoticesForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(notices));
    }

    /**
     * ヘッダーバッジ表示用の未読お知らせ件数を返す。
     *
     * AlbumPage 初期表示時に呼び出し、バッジ件数に使用する。
     * お知らせ一覧の取得（/notices）と異なり、既読化処理は行わない。
     *
     * @param httpRequest JWT認証済みリクエスト
     * @return {"count": N} 形式の未読件数
     */
    @GetMapping("/notices/unread")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        int count = boardService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    /**
     * 自分の問い合わせ一覧を管理者からの返信込みで取得する。
     *
     * ユーザーが「管理者へ連絡」タブを開いた際に呼び出す。
     * 各問い合わせには返信リスト（replies）が含まれ、スレッド形式で表示できる。
     *
     * @param httpRequest JWT認証済みリクエスト
     * @return 問い合わせ一覧（返信含む、新しい順）
     */
    @GetMapping("/inquiries")
    public ResponseEntity<ApiResponse<List<InquiryResponse>>> getMyInquiries(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        List<InquiryResponse> inquiries = boardService.getMyInquiries(userId);
        return ResponseEntity.ok(ApiResponse.success(inquiries));
    }

    /**
     * 問い合わせを新規送信する。
     *
     * バリデーション（件名・本文の空チェック）は BoardService 内で行う。
     * 送信後のステータスは「未対応（0）」。
     *
     * @param httpRequest JWT認証済みリクエスト
     * @param body        件名・本文を含むリクエストボディ
     * @return 成功時は 201 Created
     */
    @PostMapping("/inquiries")
    public ResponseEntity<ApiResponse<Void>> submitInquiry(
            HttpServletRequest httpRequest,
            @RequestBody BoardInquiryRequest body) {
        Long userId = extractUserId(httpRequest);
        boardService.submitInquiry(userId, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(null));
    }

    /**
     * 自分の問い合わせを削除する。
     *
     * 所有者チェックはサービス層で行い、他ユーザーの問い合わせは削除不可（403）。
     * FK の CASCADE DELETE により紐づく inquiry_replies も自動削除される。
     * 管理者が全体お知らせとして返信済みの場合でも notices テーブルは削除しない。
     *
     * @param httpRequest JWT認証済みリクエスト
     * @param inquiryId   削除対象の問い合わせID（PathVariable）
     * @return 成功時は 200 OK
     */
    @DeleteMapping("/inquiries/{inquiryId}")
    public ResponseEntity<ApiResponse<Void>> deleteInquiry(
            HttpServletRequest httpRequest,
            @PathVariable Long inquiryId) {
        Long userId = extractUserId(httpRequest);
        boardService.deleteMyInquiry(inquiryId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── プライベートヘルパー ─────────────────────────────

    /**
     * リクエスト属性から認証済みユーザーIDを取得する。
     *
     * JwtAuthFilter が JWT 検証後に setAttribute("userId", ...) で設定した値を取得する。
     * 属性が存在しない場合は 401 エラー（通常は JwtAuthFilter で弾かれるため発生しない）。
     *
     * @param request HTTPリクエスト
     * @return 認証済みユーザーID
     */
    private Long extractUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("userId");
        if (attr == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "認証が必要です");
        }
        return ((Number) attr).longValue();
    }
}
