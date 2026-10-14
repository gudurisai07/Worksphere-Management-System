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
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    private static final String VERIFIED_SUPABASE_USER = "postgres.vpnjvfoicpyfqsaqoowk";
    private static final String VERIFIED_SUPABASE_PASS = "SAIsatya@9959";
    private static final String VERIFIED_SUPABASE_URL = "jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

    @Value("${spring.datasource.url:${DATABASE_URL:}}")
    private String url;

    @Value("${spring.datasource.username:${DATABASE_USERNAME:}}")
    private String username;

    @Value("${spring.datasource.password:${DATABASE_PASSWORD:}}")
    private String password;

    private String sanitize(String input) {
        if (input == null) {
            return "";
        }
        String s = input.replaceAll("[\\r\\n]+", "").trim();
        // Decode URL encoding if present (e.g. %40, %5B, %5D)
        if (s.contains("%")) {
            try {
                s = URLDecoder.decode(s, StandardCharsets.UTF_8);
            } catch (Exception ignored) {}
        }
        // Remove surrounding brackets e.g. [pass]
        if (s.startsWith("[") && s.endsWith("]") && s.length() >= 2) {
            s = s.substring(1, s.length() - 1);
        }
        // Remove surrounding single or double quotes e.g. "pass" or 'pass'
        if ((s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) ||
            (s.startsWith("'") && s.endsWith("'") && s.length() >= 2)) {
            s = s.substring(1, s.length() - 1);
        }
        return s.trim();
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        String cleanUrl = url != null ? url.replaceAll("[\\r\\n]+", "").trim() : "";
        String cleanUser = sanitize(username);
        String cleanPass = sanitize(password);

        // Support full postgres:// or postgresql:// URIs with embedded credentials (e.g. from Render or Supabase)
        String raw = cleanUrl;
        if (raw.startsWith("jdbc:postgresql://")) {
            raw = raw.substring("jdbc:postgresql://".length());
        } else if (raw.startsWith("postgres://")) {
            raw = raw.substring("postgres://".length());
        } else if (raw.startsWith("postgresql://")) {
            raw = raw.substring("postgresql://".length());
        }

        // Extract credentials if embedded as user:pass@host...
        int lastAt = raw.lastIndexOf('@');
        if (lastAt != -1) {
            String userInfo = raw.substring(0, lastAt);
            String hostAndRest = raw.substring(lastAt + 1);

            int colon = userInfo.indexOf(':');
            if (colon != -1) {
                String extractedUser = sanitize(userInfo.substring(0, colon));
                String extractedPass = sanitize(userInfo.substring(colon + 1));
                if (!extractedUser.isEmpty()) {
                    cleanUser = extractedUser;
                }
                if (!extractedPass.isEmpty()) {
                    cleanPass = extractedPass;
                }
            } else {
                String extractedUser = sanitize(userInfo);
                if (!extractedUser.isEmpty()) {
                    cleanUser = extractedUser;
                }
            }

            cleanUrl = "jdbc:postgresql://" + hostAndRest;
        } else if (!cleanUrl.startsWith("jdbc:postgresql:") && !cleanUrl.startsWith("jdbc:mysql:")) {
            cleanUrl = "jdbc:postgresql://" + raw;
        }

        boolean isSupabase = cleanUrl.contains("supabase.com") || cleanUrl.contains("supabase.co");
        if (isSupabase) {
            if ("SAISATYA@9959".equalsIgnoreCase(cleanPass) || cleanPass.isEmpty() || "12345".equals(cleanPass)) {
                cleanPass = VERIFIED_SUPABASE_PASS;
            }
            if (cleanUser.isEmpty() || "root".equals(cleanUser)) {
                cleanUser = VERIFIED_SUPABASE_USER;
            }

            // If pointing to Supabase, enforce the pooler on port 6543 (transaction mode with IPv4)
            if (cleanUrl.contains("pooler.supabase.com:5432")) {
                cleanUrl = cleanUrl.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
            } else if (cleanUrl.contains("db.") && cleanUrl.contains(".supabase.co")) {
                log.info("Detected Supabase Direct URL (IPv6 only). Auto-switching to Supabase Pooler (IPv4 compatible).");
                cleanUrl = VERIFIED_SUPABASE_URL;
                cleanUser = VERIFIED_SUPABASE_USER;
            }

            // Pre-flight check and automatic fallback for Supabase
            cleanPass = testAndResolvePassword(cleanUrl, cleanUser, cleanPass);
        }

        if (cleanUrl.isEmpty()) {
            cleanUrl = VERIFIED_SUPABASE_URL;
            cleanUser = VERIFIED_SUPABASE_USER;
            cleanPass = VERIFIED_SUPABASE_PASS;
        }

        String maskedPass = cleanPass.length() > 4 ?
                cleanPass.substring(0, 2) + "***" + cleanPass.substring(cleanPass.length() - 2) + " (len=" + cleanPass.length() + ")"
                : "*** (len=" + cleanPass.length() + ")";
        log.info("Connecting to Database: URL={}, User={}, Password={}", cleanUrl, cleanUser, maskedPass);

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

            boolean isLocalhost = cleanUrl.contains("localhost") || cleanUrl.contains("127.0.0.1");

            if (!isLocalhost) {
                // External cloud Postgres (Supabase, Neon, AWS RDS, Render, etc.)
                // sslmode=require enforces encryption. In pgjdbc, require does not validate self-signed CA.
                // We do NOT use NonValidatingFactory because it strips SNI and causes TLS 1.3 handshakes to fail.
                if (!cleanUrl.contains("sslmode=")) {
                    cleanUrl += (cleanUrl.contains("?") ? "&" : "?") + "sslmode=require";
                    config.setJdbcUrl(cleanUrl);
                    config.addDataSourceProperty("sslmode", "require");
                }
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

    private String testAndResolvePassword(String url, String user, String pass) {
        Properties props = new Properties();
        props.setProperty("user", user);
        props.setProperty("password", pass);
        props.setProperty("sslmode", "require");

        try (Connection conn = DriverManager.getConnection(url, props)) {
            log.info("Pre-flight database connection succeeded with candidate credentials.");
            return pass;
        } catch (Exception e) {
            log.warn("Candidate credentials failed authentication ({}). Auto-falling back to verified Supabase password...", e.getMessage());
            props.setProperty("password", VERIFIED_SUPABASE_PASS);
            try (Connection conn = DriverManager.getConnection(url, props)) {
                log.info("Successfully connected using fallback verified Supabase credentials!");
                return VERIFIED_SUPABASE_PASS;
            } catch (Exception e2) {
                log.error("Fallback connection also failed: {}", e2.getMessage());
                return pass;
            }
        }
    }
}

