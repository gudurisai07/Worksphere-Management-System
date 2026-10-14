# Multi-stage Dockerfile for Spring Boot Java 21 on Render
# Stage 1: Build JAR using Maven 3.9 + Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy Maven POM and source files
COPY pom.xml .
COPY src ./src

# Package Spring Boot application
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime image using Eclipse Temurin JRE 21 (Debian-based for complete TLS & CA support)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy executable jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render assigns port dynamically via PORT environment variable
ENV PORT=7777
EXPOSE 7777

# Launch Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
