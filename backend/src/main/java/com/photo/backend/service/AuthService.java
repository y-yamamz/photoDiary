package com.photo.backend.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.photo.backend.common.exception.AppException;
import com.photo.backend.db.entity.Users;
import com.photo.backend.db.entity.UsersExample;
import com.photo.backend.db.mapper.UsersMapper;
import com.photo.backend.dto.request.AdminResetPasswordRequest;
import com.photo.backend.dto.request.ChangePasswordRequest;
import com.photo.backend.dto.request.LoginRequest;
import com.photo.backend.dto.request.RegisterRequest;
import com.photo.backend.dto.response.LoginResponse;
import com.photo.backend.dto.response.UserResponse;
import com.photo.backend.security.JwtProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

/**
 * 認証サービス。
 * ユーザー名・パスワードを検証してJWTを発行する。
 */
@Service
public class AuthService {

    private final UsersMapper usersMapper;
    private final JwtProvider jwtProvider;

    @Value("${admin.secret}")
    private String adminSecret;

    public AuthService(UsersMapper usersMapper, JwtProvider jwtProvider) {
        this.usersMapper = usersMapper;
        this.jwtProvider = jwtProvider;
    }

    /**
     * 新規ユーザーを登録してJWTを返す。
     * バリデーション：ユーザー名（3〜100文字）、パスワード（6文字以上）、ユーザー名重複チェック。
     */
    public LoginResponse register(RegisterRequest request) {
        // バリデーション
        if (request.getUsername() == null || request.getUsername().trim().length() < 3) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ユーザー名は3文字以上で入力してください");
        }
        if (request.getUsername().trim().length() > 100) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ユーザー名は100文字以内で入力してください");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new AppException(HttpStatus.BAD_REQUEST, "パスワードは6文字以上で入力してください");
        }

        String username = request.getUsername().trim();

        // ユーザー名の重複チェック
        UsersExample dupCheck = new UsersExample();
        dupCheck.createCriteria().andUsernameEqualTo(username);
        if (!usersMapper.selectByExample(dupCheck).isEmpty()) {
            throw new AppException(HttpStatus.CONFLICT, "このユーザー名はすでに使用されています");
        }

        // パスワードをbcryptでハッシュ化して保存
        String hashed = BCrypt.withDefaults().hashToString(12, request.getPassword().toCharArray());

        Users user = new Users();
        user.setUsername(username);
        user.setPassword(hashed);
        user.setCreatedAt(new Date());
        usersMapper.insertSelective(user);

        // 採番されたIDで取得し直す
        UsersExample fetch = new UsersExample();
        fetch.createCriteria().andUsernameEqualTo(username);
        Users saved = usersMapper.selectByExample(fetch).get(0);

        String token = jwtProvider.generateToken(saved.getUserId());

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        UserResponse userResponse = UserResponse.builder()
                .userId(saved.getUserId())
                .username(saved.getUsername())
                .createdAt(saved.getCreatedAt() != null ? sdf.format(saved.getCreatedAt()) : null)
                .build();

        return LoginResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }

    public void changePassword(ChangePasswordRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ユーザー名を入力してください");
        }
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "現在のパスワードを入力してください");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new AppException(HttpStatus.BAD_REQUEST, "新しいパスワードは6文字以上で入力してください");
        }

        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(request.getUsername().trim());
        List<Users> users = usersMapper.selectByExample(example);

        if (users.isEmpty()) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
        }

        Users user = users.get(0);

        BCrypt.Result result = BCrypt.verifyer().verify(
                request.getCurrentPassword().toCharArray(),
                user.getPassword());

        if (!result.verified) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
        }

        String hashed = BCrypt.withDefaults().hashToString(12, request.getNewPassword().toCharArray());
        Users updateRow = new Users();
        updateRow.setPassword(hashed);
        UsersExample updateExample = new UsersExample();
        updateExample.createCriteria().andUsernameEqualTo(user.getUsername());
        usersMapper.updateByExampleSelective(updateRow, updateExample);
    }

    public void adminResetPassword(AdminResetPasswordRequest request) {
        if (!adminSecret.equals(request.getAdminSecret())) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ユーザー名を入力してください");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new AppException(HttpStatus.BAD_REQUEST, "新しいパスワードは6文字以上で入力してください");
        }

        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(request.getUsername().trim());
        List<Users> users = usersMapper.selectByExample(example);

        if (users.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }

        String hashed = BCrypt.withDefaults().hashToString(12, request.getNewPassword().toCharArray());
        Users updateRow = new Users();
        updateRow.setPassword(hashed);
        UsersExample updateExample = new UsersExample();
        updateExample.createCriteria().andUsernameEqualTo(request.getUsername().trim());
        usersMapper.updateByExampleSelective(updateRow, updateExample);
    }

    public LoginResponse login(LoginRequest request) {
        // ユーザー名でユーザーを検索
        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(request.getUsername());
        List<Users> users = usersMapper.selectByExample(example);

        if (users.isEmpty()) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
        }

        Users user = users.get(0);

        // パスワードをbcryptで検証
        BCrypt.Result result = BCrypt.verifyer().verify(
                request.getPassword().toCharArray(),
                user.getPassword());

        if (!result.verified) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
        }

        String token = jwtProvider.generateToken(user.getUserId());

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        UserResponse userResponse = UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .createdAt(user.getCreatedAt() != null ? sdf.format(user.getCreatedAt()) : null)
                .build();

        return LoginResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }
}
