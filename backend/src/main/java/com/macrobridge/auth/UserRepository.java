package com.macrobridge.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    public record UserRow(UUID id, String email, String passwordHash) {}

    private final JdbcClient jdbc;

    public UserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserRow> findByEmail(String email) {
        return jdbc.sql("select id, email, password_hash from users where email = :email")
                .param("email", email)
                .query(UserRow.class)
                .optional();
    }

    public Optional<UserRow> findById(UUID id) {
        return jdbc.sql("select id, email, password_hash from users where id = :id")
                .param("id", id)
                .query(UserRow.class)
                .optional();
    }

    public void updatePassword(UUID id, String passwordHash) {
        jdbc.sql("update users set password_hash = :hash where id = :id")
                .param("hash", passwordHash)
                .param("id", id)
                .update();
    }

    /** Throws DuplicateKeyException if the email is taken. */
    public UUID insert(String email, String passwordHash) {
        return jdbc.sql("insert into users (email, password_hash) values (:email, :hash) returning id")
                .param("email", email)
                .param("hash", passwordHash)
                .query(UUID.class)
                .single();
    }
}
