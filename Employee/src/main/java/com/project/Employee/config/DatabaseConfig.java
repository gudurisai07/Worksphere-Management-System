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

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Automatically trim whitespace, newlines, carriage returns from credentials
        String cleanUrl = url != null ? url.replaceAll("[\\r\\n]+", "").trim() : "";
        String cleanUser = username != null ? username.replaceAll("[\\r\\n]+", "").trim() : "";
        String cleanPass = password != null ? password.replaceAll("[\\r\\n]+", "").trim() : "";

        // If user pasted a postgres:// or postgresql:// URL without jdbc: prefix, add jdbc:
        if (cleanUrl.startsWith("postgres://")) {
            cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgres://".length());
        } else if (cleanUrl.startsWith("postgresql://")) {
            cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgresql://".length());
        }

        log.info("Connecting to Database: URL={}", cleanUrl);

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
            // Only enforce sslmode require for external cloud databases, not Render internal
            if (!cleanUrl.contains(".render.com") && !cleanUrl.contains("dpg-") && !cleanUrl.contains("localhost")) {
                config.addDataSourceProperty("sslmode", "require");
                config.addDataSourceProperty("prepareThreshold", "0");
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
