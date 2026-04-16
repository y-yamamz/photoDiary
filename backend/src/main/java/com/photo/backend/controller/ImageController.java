package com.photo.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * ストレージ上の画像ファイルを直接配信するコントローラー。
 * Spring の静的リソースハンドラーは UNC パスで問題が起きるため、
 * Java NIO で直接読み込んで返す。
 */
@RestController
@RequestMapping("/images")
public class ImageController {

    private final Path storageRoot;

    public ImageController(@Value("${storage.base-path}") String storagePath) {
        this.storageRoot = Paths.get(storagePath).toAbsolutePath().normalize();
    }

    @GetMapping("/**")
    public ResponseEntity<byte[]> serveImage(HttpServletRequest request) throws IOException {
        // /images/ 以降の相対パスを取得し、URLデコード（日本語ファイル名対応）
        String uri = request.getRequestURI();
        String relative = URLDecoder.decode(
                uri.replaceFirst("^/images/", ""), StandardCharsets.UTF_8);

        // パストラバーサル防止（デコード後に検査することで %2F や %2E%2E も防ぐ）
        if (relative.contains("..")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Path filePath = storageRoot.resolve(relative).normalize();

        // storageRoot 配下であることを確認
        if (!filePath.startsWith(storageRoot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        byte[] data = Files.readAllBytes(filePath);

        // Content-Type を拡張子から判定
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            String name = filePath.getFileName().toString().toLowerCase();
            if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (name.endsWith(".png"))  contentType = "image/png";
            else if (name.endsWith(".webp")) contentType = "image/webp";
            else if (name.endsWith(".heic")) contentType = "image/heic";
            else contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header("Cache-Control", "max-age=31536000, immutable")
                .body(data);
    }
}
