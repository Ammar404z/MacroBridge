package com.macrobridge.profile;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AvatarRepository {

    private final JdbcClient jdbc;

    public AvatarRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<byte[]> find(UUID userId) {
        return jdbc.sql("select image from avatars where user_id = :userId")
                .param("userId", userId)
                .query(byte[].class)
                .optional();
    }

    public void save(UUID userId, byte[] image) {
        jdbc.sql("""
                insert into avatars (user_id, image) values (:userId, :image)
                on conflict (user_id) do update set image = excluded.image, updated_at = now()
                """)
                .param("userId", userId)
                .param("image", image)
                .update();
    }

    public void delete(UUID userId) {
        jdbc.sql("delete from avatars where user_id = :userId")
                .param("userId", userId)
                .update();
    }
}
