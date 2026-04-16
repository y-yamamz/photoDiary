package com.photo.backend.service;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.db.entity.Photos;
import com.photo.backend.db.entity.PhotosExample;
import com.photo.backend.db.entity.Users;
import com.photo.backend.db.mapper.PhotosCustomMapper;
import com.photo.backend.db.mapper.PhotosMapper;
import com.photo.backend.db.mapper.UsersCustomMapper;
import com.photo.backend.db.mapper.UsersMapper;
import com.photo.backend.dto.response.RecalculateStorageResponse;
import com.photo.backend.dto.request.PhotoBulkDeleteRequest;
import com.photo.backend.dto.request.PhotoBulkUpdateRequest;
import com.photo.backend.dto.request.PhotoUpdateRequest;
import com.photo.backend.dto.response.PhotoResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 写真の登録・取得・更新・削除・一括操作を担当するサービスクラス。
 *
 * <p>主な責務：
 * <ul>
 *   <li>ファイルのバリデーションとストレージへの保存</li>
 *   <li>写真メタデータ（撮影日時・場所・説明・グループ）のDB登録・更新</li>
 *   <li>単体・一括のアップロード／削除／更新操作</li>
 *   <li>物理ファイルとDBレコードの整合性管理</li>
 * </ul>
 *
 * <p>ファイル保存パス構造：
 * <pre>
 *   {storagePath}/{userId}/{yyyy}/{MM}/{dd}/{fileName}
 * </pre>
 * 日付は撮影日時（takenAt）を使用する。takenAt が未指定の場合のみ登録日時を使用する。
 *
 * <p>クライアントへのURLパス：
 * <pre>
 *   /images/{userId}/{yyyy}/{MM}/{dd}/{fileName}
 * </pre>
 */
@Service
public class PhotoService {

    private static final Logger log = LoggerFactory.getLogger(PhotoService.class);

    /**
     * DB登録・取得時に使用する日時フォーマット。
     * タイムゾーン情報は持たず、秒単位まで保持する。
     * 例: "2026-04-10T13:45:00"
     */
    private static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * datetime-local 形式（分単位）の日時フォーマット。
     * フロントエンドの &lt;input type="datetime-local"&gt; から送られる値に対応する。
     * 例: "2026-04-10T13:45"
     */
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    /** MyBatis 自動生成マッパー（基本CRUD操作）。 */
    private final PhotosMapper photosMapper;

    /** MyBatis カスタムマッパー（複合条件検索・一括操作）。 */
    private final PhotosCustomMapper photosCustomMapper;

    /** ユーザー情報取得マッパー（容量チェックに使用）。 */
    private final UsersMapper usersMapper;

    /** ユーザー容量のアトミック更新マッパー。 */
    private final UsersCustomMapper usersCustomMapper;

    /**
     * ファイル保存先のベースパス。
     * application.properties の {@code storage.base-path} から注入される。
     * 例: "/data/photos"
     */
    private final String storagePath;

    /**
     * コンストラクタインジェクション。
     * Spring がマッパーとストレージパスを自動注入する。
     *
     * @param photosMapper       基本CRUD用マッパー
     * @param photosCustomMapper 複合操作用カスタムマッパー
     * @param usersMapper        ユーザー情報取得マッパー
     * @param usersCustomMapper  容量アトミック更新マッパー
     * @param storagePath        ファイル保存先ベースパス（application.properties から取得）
     */
    public PhotoService(PhotosMapper photosMapper,
                        PhotosCustomMapper photosCustomMapper,
                        UsersMapper usersMapper,
                        UsersCustomMapper usersCustomMapper,
                        @Value("${storage.base-path}") String storagePath) {
        this.photosMapper = photosMapper;
        this.photosCustomMapper = photosCustomMapper;
        this.usersMapper = usersMapper;
        this.usersCustomMapper = usersCustomMapper;
        this.storagePath = storagePath;
    }

    // ── 一覧取得 ────────────────────────────────────────────────

    /**
     * 検索条件に合致する写真一覧をタグ情報付きで取得する。
     *
     * <p>全引数はオプション。null を渡すとその条件は無視される。
     * 年・月・日は組み合わせて絞り込みに使用する（例: year=2026, month=4 で4月の写真全件）。
     *
     * @param userId  対象ユーザーID（必須）
     * @param year    撮影年（nullable: 未指定時は全年対象）
     * @param month   撮影月（nullable: 未指定時は全月対象）
     * @param day     撮影日（nullable: 未指定時は全日対象）
     * @param groupId グループID（nullable: 未指定時は全グループ対象）
     * @param keyword ファイル名・説明・場所のキーワード検索（nullable）
     * @return 条件に合致する {@link PhotoResponse} のリスト（タグ情報含む）
     */
    public List<PhotoResponse> getPhotos(Long userId, Integer year, Integer month,
                                         Integer day, Long groupId, String keyword) {
        return photosCustomMapper.selectPhotosWithTags(userId, year, month, day, groupId, keyword);
    }

    // ── 単体登録 ────────────────────────────────────────────────

    /**
     * 写真を1枚アップロードしてDBに登録する。
     *
     * <p>処理の流れ：
     * <ol>
     *   <li>takenAt（撮影日時）を基準にディレクトリを決定してファイルを保存する</li>
     *   <li>メタデータ（撮影日時・場所・説明・グループ）を含む {@link Photos} エンティティを生成する</li>
     *   <li>DBにINSERTして採番されたphotoIdを使い、登録後のレコードを取得して返す</li>
     * </ol>
     *
     * @param userId      ログインユーザーID
     * @param file        アップロードされたファイル
     * @param groupId     所属グループID（nullable: グループなしの場合はnull）
     * @param takenAt     撮影日時文字列（nullable: "yyyy-MM-dd'T'HH:mm" 形式）
     * @param location    撮影場所（nullable）
     * @param description 写真の説明（nullable）
     * @return 登録後の写真情報（タグなし）
     */
    public PhotoResponse upload(Long userId, MultipartFile file,
                                Long groupId, String takenAt,
                                String location, String description) {
        // 容量上限チェック（保存前に確認する）
        checkStorageCapacity(userId, file.getSize());

        // 撮影日時を基準にディレクトリを決定してファイルを保存する
        String filePath = saveFile(file, userId, takenAt);

        // メタデータと保存パスからエンティティを組み立ててDBに登録する
        Photos photo = buildPhoto(userId, file.getOriginalFilename(), filePath,
                groupId, takenAt, location, description);
        photosMapper.insertSelective(photo);

        // INSERT後に採番されたphotoIdでレコードを再取得して返す（タグなし）
        PhotoResponse result = toSimpleResponse(photosMapper.selectByPrimaryKey(photo.getPhotoId()));

        // ファイル保存・DB登録成功後に使用量を加算する
        usersCustomMapper.addStorageUsed(userId, file.getSize());

        return result;
    }

    // ── 一括登録 ────────────────────────────────────────────────

    /**
     * 複数の写真を一括アップロードしてDBに登録する。
     *
     * <p>ファイルごとに {@link #saveFile} → {@link #buildPhoto} → INSERT を繰り返す逐次処理。
     * 1件でもファイル保存に失敗した場合は {@link AppException} がスローされ、
     * それ以降のファイルは処理されない（部分登録になりうる点に注意）。
     *
     * <p>撮影日時（takenAt）は全ファイルに共通の値を適用する。
     * 各ファイルに個別の日付を登録したい場合は {@link #upload} を繰り返し呼ぶこと。
     *
     * @param userId      ログインユーザーID
     * @param files       アップロードされたファイルのリスト
     * @param groupId     所属グループID（nullable）
     * @param takenAt     撮影日時文字列（nullable: 全ファイルに共通適用）
     * @param location    撮影場所（nullable）
     * @param description 写真の説明（nullable）
     * @return 登録後の写真情報リスト（各エントリはタグなし）
     */
    public List<PhotoResponse> bulkUpload(Long userId, List<MultipartFile> files,
                                          Long groupId, String takenAt,
                                          String location, String description) {
        // 一括アップロード前に合計サイズで上限チェックを行う
        long totalSize = files.stream().mapToLong(MultipartFile::getSize).sum();
        checkStorageCapacity(userId, totalSize);

        List<PhotoResponse> results = new ArrayList<>();
        long savedSize = 0;
        for (MultipartFile file : files) {
            // 撮影日時を基準にディレクトリを決定してファイルを保存する
            String filePath = saveFile(file, userId, takenAt);
            Photos photo = buildPhoto(userId, file.getOriginalFilename(), filePath,
                    groupId, takenAt, location, description);
            photosMapper.insertSelective(photo);
            results.add(toSimpleResponse(photosMapper.selectByPrimaryKey(photo.getPhotoId())));
            savedSize += file.getSize();
        }

        // 全ファイル保存・DB登録成功後にまとめて使用量を加算する
        if (savedSize > 0) {
            usersCustomMapper.addStorageUsed(userId, savedSize);
        }
        return results;
    }

    // ── 単体更新 ────────────────────────────────────────────────

    /**
     * 指定した写真のメタデータを更新する。
     *
     * <p>更新対象フィールド: グループ・場所・説明・撮影日時。
     * ファイル本体（画像データ）は更新しない。
     *
     * <p>撮影日時が変更された場合は、新しい撮影日時の年月日に対応するディレクトリに
     * 物理ファイルを移動し、DBの filePath も更新する。
     * これにより保存先ディレクトリが常に撮影日時と一致した状態を維持する。
     *
     * <p>ログインユーザーが所有していない写真を更新しようとした場合は
     * {@link AppException}（HTTP 404）をスローする。
     *
     * @param userId   ログインユーザーID（所有者確認に使用）
     * @param photoId  更新対象の写真ID
     * @param request  更新内容を格納したリクエストDTO
     * @return 更新後の写真情報（タグなし）
     */
    public PhotoResponse update(Long userId, Long photoId, PhotoUpdateRequest request) {
        // 所有者確認：他ユーザーの写真は操作させない
        Photos photo = getOwnedPhoto(userId, photoId);

        // メタデータを上書きする（ファイル本体は変更しない）
        photo.setGroupId(request.getGroupId());
        photo.setLocation(request.getLocation());
        photo.setDescription(request.getDescription());

        // 撮影日時が指定されている場合のみ更新する（空文字・null は現在値を維持）
        if (request.getTakenAt() != null && !request.getTakenAt().isBlank()) {
            Date newTakenAt = parseDatetime(request.getTakenAt());
            photo.setTakenAt(newTakenAt);

            // 撮影日時の変更に合わせて物理ファイルを新しい日付ディレクトリに移動する
            if (newTakenAt != null) {
                String newFilePath = moveFileToDateDir(photo.getFilePath(), userId, newTakenAt);
                if (newFilePath != null) {
                    photo.setFilePath(newFilePath);
                }
            }
        }

        photosMapper.updateByPrimaryKeyWithBLOBs(photo);

        // 更新後のレコードを取得して返す
        return toSimpleResponse(photosMapper.selectByPrimaryKey(photoId));
    }

    // ── 単体削除 ────────────────────────────────────────────────

    /**
     * 指定した写真をDBと物理ストレージの両方から削除する。
     *
     * <p>まず所有者確認を行い、その後DBレコードを削除してから物理ファイルを削除する。
     * 物理ファイルの削除に失敗してもDB削除は維持される（孤立ファイルが残る可能性がある）。
     *
     * @param userId  ログインユーザーID（所有者確認に使用）
     * @param photoId 削除対象の写真ID
     * @throws AppException 写真が存在しないか、ログインユーザーの所有でない場合（HTTP 404）
     */
    public void delete(Long userId, Long photoId) {
        // 所有者確認と同時に削除対象レコードを取得する（ファイルパスとサイズ取得のため）
        Photos photo = getOwnedPhoto(userId, photoId);

        // DB削除前に物理ファイルサイズを取得する（削除後は取得不可）
        long fileSize = getPhysicalFileSize(photo.getFilePath());

        // DB削除後に物理ファイルを削除する（順序が逆になると参照エラーのリスクがある）
        photosMapper.deleteByPrimaryKey(photoId);
        deletePhysicalFile(photo.getFilePath());

        // 削除完了後に使用量を減算する（負数を渡してアトミックに減らす）
        if (fileSize > 0) {
            usersCustomMapper.addStorageUsed(userId, -fileSize);
        }
    }

    // ── 一括削除 ────────────────────────────────────────────────

    /**
     * 指定した複数の写真をDBと物理ストレージの両方から一括削除する。
     *
     * <p>処理の流れ：
     * <ol>
     *   <li>リクエストに含まれるIDのうち、ログインユーザーが所有する写真のファイルパスを収集する</li>
     *   <li>カスタムマッパーでDB一括削除を実行する（他ユーザーのIDは自動的に無視される）</li>
     *   <li>事前に収集したファイルパスの物理ファイルを1件ずつ削除する</li>
     * </ol>
     *
     * <p>IDリストが空の場合は {@link AppException}（HTTP 400）をスローする。
     *
     * @param userId  ログインユーザーID（所有者フィルタリングに使用）
     * @param request 削除対象の写真IDリストを格納したリクエストDTO
     * @return 実際に削除されたDB件数
     * @throws AppException IDリストが空の場合（HTTP 400）
     */
    public int bulkDelete(Long userId, PhotoBulkDeleteRequest request) {
        if (request.getPhotoIds() == null || request.getPhotoIds().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "削除対象のIDが指定されていません");
        }

        // DB削除前に対象写真を収集する（DB削除後はファイルパス・サイズが取得できなくなるため先に収集する）
        // 自分の写真のみを対象とし、他ユーザーのIDは除外する
        List<Photos> ownedPhotos = request.getPhotoIds().stream()
                .map(photosMapper::selectByPrimaryKey)
                .filter(p -> p != null && userId.equals(p.getUserId()))
                .collect(java.util.stream.Collectors.toList());

        List<String> filePaths = ownedPhotos.stream()
                .map(Photos::getFilePath)
                .collect(java.util.stream.Collectors.toList());

        // DB削除前に合計ファイルサイズを取得する
        long totalSize = filePaths.stream()
                .mapToLong(this::getPhysicalFileSize)
                .sum();

        // DB一括削除（SQL WHERE userId = ? AND photoId IN (...)）
        int count = photosCustomMapper.bulkDeleteByIds(userId, request.getPhotoIds());

        // DB削除完了後に物理ファイルを削除する
        filePaths.forEach(this::deletePhysicalFile);

        // 削除完了後に使用量をまとめて減算する
        if (totalSize > 0) {
            usersCustomMapper.addStorageUsed(userId, -totalSize);
        }
        return count;
    }

    // ── 一括更新 ────────────────────────────────────────────────

    /**
     * 指定した複数の写真のメタデータを一括更新する。
     *
     * <p>更新対象フィールド: 場所・説明・グループ・撮影日時。
     * いずれか1つ以上のフィールドを指定する必要がある（全てnullはエラー）。
     * ログインユーザーが所有しない写真IDはカスタムマッパー側で無視される。
     *
     * <p>注意: 一括更新では撮影日時を変更してもファイルの移動は行わない。
     * ファイル移動が必要な場合は単体更新（{@link #update}）を使用すること。
     *
     * @param userId  ログインユーザーID（更新条件に含める）
     * @param request 更新対象IDリストと更新内容を格納したリクエストDTO
     * @return 実際に更新されたDB件数
     * @throws AppException IDリストが空の場合、または更新フィールドが全てnullの場合（HTTP 400）
     */
    public int bulkUpdate(Long userId, PhotoBulkUpdateRequest request) {
        if (request.getPhotoIds() == null || request.getPhotoIds().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "更新対象のIDが指定されていません");
        }
        // 少なくとも1フィールドが指定されているかチェックする
        if (request.getLocation() == null && request.getDescription() == null
                && request.getGroupId() == null && request.getTakenAt() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "更新するフィールドを指定してください");
        }

        // 撮影日時が指定されている場合は Date 型に変換する（null の場合は変換しない）
        Date takenAtDate = request.getTakenAt() != null ? parseDatetime(request.getTakenAt()) : null;

        return photosCustomMapper.bulkUpdateByIds(
                userId, request.getPhotoIds(),
                request.getLocation(), request.getDescription(),
                request.getGroupId(), takenAtDate);
    }

    // ── private ─────────────────────────────────────────────────

    /**
     * アップロードされたファイルをストレージに保存し、DBに記録するパスを返す。
     *
     * <p>保存先ディレクトリ構造：
     * <pre>
     *   {storagePath}/{userId}/{yyyy}/{MM}/{dd}/
     * </pre>
     * ディレクトリが存在しない場合は自動的に作成する。
     *
     * <p>日付の決定ルール：
     * <ul>
     *   <li>takenAt が指定されている場合 → その年月日をディレクトリに使用する</li>
     *   <li>takenAt が null または空文字の場合 → 登録日時（現在時刻）を使用する</li>
     * </ul>
     *
     * <p>ファイル名のルール：
     * <ul>
     *   <li>拡張子は元ファイルの拡張子を維持する</li>
     *   <li>ベース名は元ファイルのベース名を維持する</li>
     *   <li>同名ファイルが既に存在する場合は "_1", "_2", ... を付けて回避する</li>
     * </ul>
     *
     * @param file    保存対象のアップロードファイル
     * @param userId  ファイルの所有ユーザーID（ディレクトリ分離に使用）
     * @param takenAt 撮影日時文字列（"yyyy-MM-dd'T'HH:mm" 形式）。null の場合は現在時刻を使用
     * @return クライアントがアクセスするためのURLパス（例: "/images/1/2026/04/10/photo.jpg"）
     * @throws AppException ファイルの保存に失敗した場合（HTTP 500）
     */
    private String saveFile(MultipartFile file, Long userId, String takenAt) {
        try {
            // takenAt が指定されていればその日付を使用し、なければ現在日時をフォールバックとして使用する
            LocalDateTime baseDate;
            if (takenAt != null && !takenAt.isBlank()) {
                try {
                    baseDate = LocalDateTime.parse(takenAt, DTF);
                } catch (Exception e) {
                    // パース失敗時は現在日時を使用する
                    baseDate = LocalDateTime.now();
                }
            } else {
                baseDate = LocalDateTime.now();
            }

            String year     = String.format("%04d", baseDate.getYear());
            String month    = String.format("%02d", baseDate.getMonthValue());
            String day      = String.format("%02d", baseDate.getDayOfMonth());
            String ext      = getExtension(file.getOriginalFilename());
            String baseName = getBaseName(file.getOriginalFilename());

            // 保存先ディレクトリ: {storagePath}/{userId}/{yyyy}/{MM}/{dd}/
            // Files.createDirectories は既存ディレクトリに対しても例外を投げないため安全に呼び出せる
            Path dir = Paths.get(storagePath, userId.toString(), year, month, day);
            Files.createDirectories(dir);

            // ファイル名重複を回避する: 同名が存在する場合は _1, _2, ... を付与する
            Path dest = dir.resolve(baseName + ext);
            if (Files.exists(dest)) {
                int count = 1;
                while (Files.exists(dir.resolve(baseName + "_" + count + ext))) {
                    count++;
                }
                dest = dir.resolve(baseName + "_" + count + ext);
            }

            // MultipartFile をディスクに書き出す
            file.transferTo(dest);

            // クライアントからアクセス可能な URL パスを組み立てて返す
            String savedName = dest.getFileName().toString();
            return "/images/" + userId + "/" + year + "/" + month + "/" + day + "/" + savedName;

        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "ファイルの保存に失敗しました");
        }
    }

    /**
     * 物理ファイルを新しい撮影日時に対応するディレクトリへ移動し、新しいURLパスを返す。
     *
     * <p>撮影日時が更新された場合に呼ばれ、保存先ディレクトリを撮影日時と一致させる。
     * 既に同じディレクトリにある場合（日付が変わっていない場合）は移動せず現在のパスをそのまま返す。
     *
     * <p>移動先に同名ファイルが存在する場合は "_1", "_2", ... を付けて回避する。
     *
     * @param currentFilePath 現在のURLパス（"/images/..." 形式）
     * @param userId          ファイルの所有ユーザーID
     * @param newTakenAt      新しい撮影日時（ディレクトリの年月日算出に使用）
     * @return 移動後の新しいURLパス。移動不要または失敗した場合は null
     */
    private String moveFileToDateDir(String currentFilePath, Long userId, Date newTakenAt) {
        if (currentFilePath == null || newTakenAt == null) return null;

        // 新しい撮影日時から年月日を算出する
        LocalDateTime newDate = newTakenAt.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        String year  = String.format("%04d", newDate.getYear());
        String month = String.format("%02d", newDate.getMonthValue());
        String day   = String.format("%02d", newDate.getDayOfMonth());

        // 現在の物理ファイルパスを算出する
        String relative = currentFilePath.replaceFirst("^/images/", "");
        Path currentPhysical = Paths.get(storagePath).resolve(relative);

        if (!Files.exists(currentPhysical)) {
            // 物理ファイルが存在しない場合は移動できないためスキップする
            return null;
        }

        String fileName = currentPhysical.getFileName().toString();
        String baseName = getBaseName(fileName);
        String ext      = getExtension(fileName);

        try {
            // 移動先ディレクトリを作成する
            Path newDir = Paths.get(storagePath, userId.toString(), year, month, day);
            Files.createDirectories(newDir);

            // 移動先の候補パスを決定する
            Path dest = newDir.resolve(baseName + ext);

            // 移動元と移動先が同じパスの場合は移動不要（日付が変わっていない）
            if (dest.toAbsolutePath().equals(currentPhysical.toAbsolutePath())) {
                return currentFilePath;
            }

            // 移動先に同名ファイルが存在する場合は _1, _2, ... を付けて回避する
            if (Files.exists(dest)) {
                int count = 1;
                while (Files.exists(newDir.resolve(baseName + "_" + count + ext))) {
                    count++;
                }
                dest = newDir.resolve(baseName + "_" + count + ext);
            }

            // 物理ファイルを新しいディレクトリへ移動する
            Files.move(currentPhysical, dest, StandardCopyOption.ATOMIC_MOVE);

            // 新しい URL パスを返す
            String savedName = dest.getFileName().toString();
            return "/images/" + userId + "/" + year + "/" + month + "/" + day + "/" + savedName;

        } catch (IOException e) {
            // ファイル移動失敗はログ出力のみとし、DB更新は元のパスのまま継続する
            System.err.println("ファイルの移動に失敗しました: " + currentPhysical + " / " + e.getMessage());
            return null;
        }
    }

    /**
     * DBの filePath（例: "/images/1/2026/04/10/photo.jpg"）に対応する物理ファイルを削除する。
     *
     * <p>パス変換ルール：
     * <pre>
     *   /images/{userId}/... → {storagePath}/{userId}/...
     * </pre>
     *
     * <p>削除失敗（ファイルが既に存在しない場合を含む）はエラーログを出力するのみで、
     * 呼び出し元の処理（DB削除）には影響しない。
     *
     * @param filePath DBに保存されたURLパス（"/images/..." 形式）
     */
    private void deletePhysicalFile(String filePath) {
        if (filePath == null) return;

        // URLパスの "/images/" プレフィックスを除去してストレージの相対パスに変換する
        String relative = filePath.replaceFirst("^/images/", "");
        Path physical = Paths.get(storagePath).resolve(relative);
        try {
            // ファイルが存在しない場合も例外を投げない deleteIfExists を使用する
            Files.deleteIfExists(physical);
        } catch (IOException e) {
            // 物理ファイルの削除失敗はログ出力のみとし、DB削除の結果には影響させない
            System.err.println("物理ファイルの削除に失敗しました: " + physical + " / " + e.getMessage());
        }
    }

    /**
     * 物理ファイルのサイズ（bytes）を返す。
     * ファイルが存在しない場合・取得失敗時は 0 を返す。
     *
     * @param filePath DBに保存されたURLパス（"/images/..." 形式）
     * @return ファイルサイズ（bytes）。取得不可の場合は 0
     */
    private long getPhysicalFileSize(String filePath) {
        if (filePath == null) return 0;
        String relative = filePath.replaceFirst("^/images/", "");
        Path physical = Paths.get(storagePath).resolve(relative);
        try {
            if (!Files.exists(physical)) {
                log.warn("[getPhysicalFileSize] file not found: {}", physical.toAbsolutePath());
                return 0;
            }
            return Files.size(physical);
        } catch (IOException e) {
            log.error("[getPhysicalFileSize] failed to get size: {} / {}", physical.toAbsolutePath(), e.getMessage());
            return 0;
        }
    }

    /**
     * ユーザーの実際のファイルサイズを再集計し、storage_used_bytes を上書き更新する。
     *
     * <p>DB上のファイルパスをもとに物理ファイルサイズを合算する。
     * ファイルが存在しないパスはサイズ 0 として扱う。
     *
     * @param userId   対象ユーザーID
     * @param username 対象ユーザー名（レスポンス表示用）
     * @return 再計算前後の使用量を含むレスポンスDTO
     */
    public RecalculateStorageResponse recalculateUserStorage(Long userId, String username) {
        // 再計算前の使用量を取得する
        Users user = usersMapper.selectByPrimaryKey(userId);
        long oldBytes = user.getStorageUsedBytes() != null ? user.getStorageUsedBytes() : 0;

        // DBに登録された全写真のファイルパスを取得する
        PhotosExample example = new PhotosExample();
        example.createCriteria().andUserIdEqualTo(userId);
        List<Photos> photos = photosMapper.selectByExample(example);

        log.info("[recalculate] user={} userId={} photoCount={} storagePath={}",
                username, userId, photos.size(), storagePath);

        // 物理ファイルの合計サイズを算出する（存在しないファイルは 0 バイトとして扱う）
        long newBytes = 0;
        for (Photos p : photos) {
            long size = getPhysicalFileSize(p.getFilePath());
            log.debug("[recalculate] filePath={} size={}", p.getFilePath(), size);
            newBytes += size;
        }

        log.info("[recalculate] user={} oldBytes={} newBytes={} diff={}",
                username, oldBytes, newBytes, newBytes - oldBytes);

        // storage_used_bytes を直接上書きする
        usersCustomMapper.setStorageUsed(userId, newBytes);

        return RecalculateStorageResponse.builder()
                .username(username)
                .photoCount(photos.size())
                .oldUsedBytes(oldBytes)
                .newUsedBytes(newBytes)
                .diffBytes(newBytes - oldBytes)
                .build();
    }

    /**
     * ユーザーの容量上限を確認し、超過する場合は例外をスローする。
     *
     * @param userId       対象ユーザーID
     * @param uploadBytes  アップロードしようとしているファイルの合計サイズ（bytes）
     * @throws AppException 上限を超える場合（HTTP 413）
     */
    private void checkStorageCapacity(Long userId, long uploadBytes) {
        Users user = usersMapper.selectByPrimaryKey(userId);
        if (user == null) {
            throw new AppException(org.springframework.http.HttpStatus.UNAUTHORIZED, "ユーザーが見つかりません");
        }

        int limitMb = user.getStorageLimitMb() != null ? user.getStorageLimitMb() : 500;
        long limitBytes = (long) limitMb * 1024 * 1024;
        long usedBytes = user.getStorageUsedBytes() != null ? user.getStorageUsedBytes() : 0;

        if (usedBytes + uploadBytes > limitBytes) {
            long remainingBytes = limitBytes - usedBytes;
            long remainingMb = remainingBytes / (1024 * 1024);
            throw new AppException(
                    org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE,
                    String.format("容量が不足しています。残り容量: %d MB、上限: %d MB", remainingMb, limitMb)
            );
        }
    }

    /**
     * ファイル名から拡張子（ドットを含む）を抽出して返す。
     *
     * <p>例: "photo.jpg" → ".jpg"、"photo.HEIC" → ".HEIC"
     * ドットが含まれない場合やファイル名が null の場合は ".jpg" を返す。
     *
     * @param fileName 元のファイル名
     * @return 拡張子（ドット含む）。取得できない場合は ".jpg"
     */
    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return ".jpg";
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    /**
     * ファイル名から拡張子を除いたベース名を抽出して返す。
     *
     * <p>例: "photo.jpg" → "photo"、"my photo.png" → "my photo"
     * ファイル名が null または空の場合は "photo" を返す。
     *
     * @param fileName 元のファイル名
     * @return 拡張子なしのベース名。取得できない場合は "photo"
     */
    private String getBaseName(String fileName) {
        if (fileName == null || fileName.isEmpty()) return "photo";
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    }

    /**
     * 写真エンティティ（{@link Photos}）を組み立てて返す。
     *
     * <p>photoId は DBのAUTO_INCREMENTで採番するため設定しない。
     * createdAt はこのメソッド内で現在時刻をセットする。
     * takenAt は null または空文字の場合はセットしない（DBのデフォルト値に委ねる）。
     *
     * @param userId       写真の所有ユーザーID
     * @param originalName 元のファイル名（DBの fileName カラムに保存）
     * @param filePath     ストレージ保存後のURLパス（DBの filePath カラムに保存）
     * @param groupId      所属グループID（nullable）
     * @param takenAt      撮影日時文字列（nullable: "yyyy-MM-dd'T'HH:mm" 形式）
     * @param location     撮影場所（nullable）
     * @param description  写真の説明（nullable）
     * @return 組み立て済みの {@link Photos} エンティティ
     */
    private Photos buildPhoto(Long userId, String originalName, String filePath,
                              Long groupId, String takenAt, String location, String description) {
        Photos photo = new Photos();
        photo.setUserId(userId);
        photo.setFilePath(filePath);
        photo.setFileName(originalName);
        photo.setGroupId(groupId);
        photo.setLocation(location);
        photo.setDescription(description);
        photo.setCreatedAt(new Date());

        // 撮影日時が指定されている場合のみパースしてセットする
        if (takenAt != null && !takenAt.isBlank()) {
            photo.setTakenAt(parseDatetime(takenAt));
        }
        return photo;
    }

    /**
     * 日時文字列を {@link Date} 型に変換する。
     *
     * <p>フロントエンドの {@code <input type="datetime-local">} から送られる
     * "yyyy-MM-dd'T'HH:mm" 形式の文字列を受け付ける。
     * パースに失敗した場合（不正なフォーマット等）は null を返す。
     *
     * @param takenAt 日時文字列（例: "2026-04-10T13:45"）
     * @return パース済みの {@link Date}。パース失敗時は null
     */
    private Date parseDatetime(String takenAt) {
        try {
            // datetime-local 形式: "yyyy-MM-dd'T'HH:mm"
            return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").parse(takenAt);
        } catch (ParseException e) {
            // 不正なフォーマットの場合は null を返す（呼び出し元で null チェック済み）
            return null;
        }
    }

    /**
     * 指定した写真がログインユーザーの所有物であることを確認して返す。
     *
     * <p>写真が存在しない場合、または所有者が異なる場合は
     * {@link AppException}（HTTP 404）をスローする。
     * 他ユーザーの存在を推測されないよう、どちらの場合も同じ 404 を返す。
     *
     * @param userId  ログインユーザーID
     * @param photoId 確認対象の写真ID
     * @return 所有確認済みの {@link Photos} エンティティ
     * @throws AppException 写真が存在しないか、所有者が異なる場合（HTTP 404）
     */
    private Photos getOwnedPhoto(Long userId, Long photoId) {
        Photos photo = photosMapper.selectByPrimaryKey(photoId);
        // 写真が存在しない場合と他ユーザーの写真の場合は同じ 404 を返す（情報漏洩防止）
        if (photo == null || !photo.getUserId().equals(userId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "写真が見つかりません");
        }
        return photo;
    }

    /**
     * {@link Photos} エンティティをレスポンスDTO（{@link PhotoResponse}）に変換する。
     *
     * <p>タグ情報は含まない（空リストをセット）。
     * タグ情報が必要な場合は {@link PhotosCustomMapper#selectPhotosWithTags} を使用すること。
     *
     * <p>日時フィールド（takenAt・createdAt）は {@link #SDF} フォーマット（秒単位）で文字列化する。
     * null の場合は null のまま返す。
     *
     * @param p 変換元の {@link Photos} エンティティ
     * @return タグなしの {@link PhotoResponse}
     */
    private PhotoResponse toSimpleResponse(Photos p) {
        return PhotoResponse.builder()
                .photoId(p.getPhotoId())
                .userId(p.getUserId())
                .groupId(p.getGroupId())
                .filePath(p.getFilePath())
                .fileName(p.getFileName())
                .takenAt(p.getTakenAt() != null ? SDF.format(p.getTakenAt()) : null)
                .location(p.getLocation())
                .description(p.getDescription())
                .sortOrder(p.getSortOrder())
                .createdAt(p.getCreatedAt() != null ? SDF.format(p.getCreatedAt()) : null)
                .tags(List.of())
                .build();
    }
}
