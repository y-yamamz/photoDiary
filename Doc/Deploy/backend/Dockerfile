# =============================================================
# Backend Dockerfile
# Spring Boot WAR を Tomcat コンテナにデプロイする
# NASマウントは Docker Desktop のドライブ共有（Y:）で行う
# =============================================================

# =====================
# Stage 1: WARファイルビルド
# =====================
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

COPY backend/gradlew ./
COPY backend/gradle ./gradle
COPY backend/build.gradle backend/settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon 2>/dev/null || true

COPY backend/src ./src
RUN chmod +x gradlew && ./gradlew bootWar --no-daemon -x test

# =====================
# Stage 2: Tomcatで実行
# =====================
FROM tomcat:10.1-jdk17-temurin

RUN apt-get update && apt-get install -y cifs-utils && rm -rf /usr/local/tomcat/webapps/*

RUN mkdir -p /var/photodiary/images

COPY --from=builder /app/build/libs/backend.war /usr/local/tomcat/webapps/ROOT.war

EXPOSE 8080

CMD ["catalina.sh", "run"]
