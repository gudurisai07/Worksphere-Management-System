package com.project.Employee.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        String cleanUrl = url != null ? url.replaceAll("[\\r\\n]+", "").trim() : "";
        String cleanUser = username != null ? username.replaceAll("[\\r\\n]+", "").trim() : "";
        String cleanPass = password != null ? password.replaceAll("[\\r\\n]+", "").trim() : "";

        // Support full postgres:// or postgresql:// URIs with embedded credentials (e.g. from Render or Supabase)
        String rawUriStr = cleanUrl;
        if (rawUriStr.startsWith("jdbc:postgresql://")) {
            rawUriStr = rawUriStr.substring(5); // strip "jdbc:" to parse as URI
        }

        if (rawUriStr.startsWith("postgres://") || rawUriStr.startsWith("postgresql://")) {
            try {
                String uriToParse = rawUriStr.startsWith("postgres://")
                        ? "http://" + rawUriStr.substring("postgres://".length())
                        : "http://" + rawUriStr.substring("postgresql://".length());

                URI parsedUri = URI.create(uriToParse);
                if (parsedUri.getUserInfo() != null && !parsedUri.getUserInfo().isEmpty()) {
                    String[] userParts = parsedUri.getUserInfo().split(":", 2);
                    if (cleanUser.isEmpty() && userParts.length > 0) {
                        cleanUser = URLDecoder.decode(userParts[0], StandardCharsets.UTF_8);
                    }
                    if (cleanPass.isEmpty() && userParts.length > 1) {
                        cleanPass = URLDecoder.decode(userParts[1], StandardCharsets.UTF_8);
                    }
                }

                String host = parsedUri.getHost();
                int port = parsedUri.getPort();
                String path = parsedUri.getPath();
                String query = parsedUri.getQuery();

                StringBuilder jdbcBuilder = new StringBuilder("jdbc:postgresql://");
                jdbcBuilder.append(host != null ? host : "localhost");
                if (port != -1) {
                    jdbcBuilder.append(":").append(port);
                }
                if (path != null && !path.isEmpty()) {
                    jdbcBuilder.append(path);
                } else {
                    jdbcBuilder.append("/postgres");
                }
                if (query != null && !query.isEmpty()) {
                    jdbcBuilder.append("?").append(query);
                }
                cleanUrl = jdbcBuilder.toString();
            } catch (Exception e) {
                log.warn("Could not parse URI via java.net.URI, falling back: {}", e.getMessage());
                if (cleanUrl.startsWith("postgres://")) {
                    cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgres://".length());
                } else if (cleanUrl.startsWith("postgresql://")) {
                    cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgresql://".length());
                }
            }
        }

        log.info("Connecting to Database: URL={}, User={}", cleanUrl, cleanUser);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cleanUrl);
        if (!cleanUser.isEmpty()) {
            config.setUsername(cleanUser);
        }
        if (!cleanPass.isEmpty()) {
            config.setPassword(cleanPass);
        }

        if (cleanUrl.startsWith("jdbc:postgresql:")) {
            config.setDriverClassName("org.postgresql.Driver");

            boolean isInternalRender = cleanUrl.contains("dpg-") || cleanUrl.contains(".render.internal");
            boolean isLocalhost = cleanUrl.contains("localhost") || cleanUrl.contains("127.0.0.1");

            if (!isInternalRender && !isLocalhost) {
                // External cloud Postgres (Supabase, Neon, AWS RDS, etc.)
                if (!cleanUrl.contains("sslmode=")) {
                    config.addDataSourceProperty("sslmode", "require");
                }
                config.addDataSourceProperty("sslfactory", "org.postgresql.ssl.NonValidatingFactory");
                config.addDataSourceProperty("prepareThreshold", "0");
                config.addDataSourceProperty("preparedStatementCacheQueries", "0");
            }
            config.addDataSourceProperty("tcpKeepAlive", "true");
        } else if (cleanUrl.startsWith("jdbc:mysql:")) {
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        }

        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
