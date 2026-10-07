package com.macrobridge.friend;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class FriendRepository {

    /** Name shown to friends: display name, or the part of the email before the @. */
    private static final String NAME = "coalesce(nullif(trim(p.display_name), ''), split_part(u.email, '@', 1))";
    private static final String AVATAR_VERSION =
            "(select (extract(epoch from a.updated_at) * 1000)::bigint from avatars a where a.user_id = u.id)";

    /** The other person in a friendship row, from the viewer's side. */
    public record Connection(UUID id, String name, Long avatarVersion, String status,
                             boolean outgoing, boolean shareMeals) {}

    public record Person(UUID id, String name, Long avatarVersion) {}

    public record FeedRow(UUID mealId, UUID userId, String name, Long avatarVersion, String mealLabel,
                          String description, int calories, double protein, double carbs, double fat,
                          OffsetDateTime loggedAt) {}

    public record Link(UUID requesterId, UUID addresseeId, String status) {}

    private final JdbcClient jdbc;

    public FriendRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public String inviteCode(UUID userId) {
        return jdbc.sql("select invite_code from profiles where user_id = :userId")
                .param("userId", userId)
                .query(String.class)
                .single();
    }

    public Optional<Person> findByInviteCode(String code) {
        return jdbc.sql("select u.id, " + NAME + " as name, " + AVATAR_VERSION + " as avatar_version"
                        + " from profiles p join users u on u.id = p.user_id where p.invite_code = :code")
                .param("code", code)
                .query(Person.class)
                .optional();
    }

    public Optional<Person> findPerson(UUID userId) {
        return jdbc.sql("select u.id, " + NAME + " as name, " + AVATAR_VERSION + " as avatar_version"
                        + " from profiles p join users u on u.id = p.user_id where u.id = :userId")
                .param("userId", userId)
                .query(Person.class)
                .optional();
    }

    /** Everyone the viewer is linked to: accepted friends and pending requests both ways. */
    public List<Connection> connections(UUID me) {
        return jdbc.sql("""
                select u.id, %s as name, %s as avatar_version, f.status,
                       f.requester_id = :me as outgoing, p.share_meals
                from friendships f
                join users u on u.id = case when f.requester_id = :me then f.addressee_id else f.requester_id end
                join profiles p on p.user_id = u.id
                where f.requester_id = :me or f.addressee_id = :me
                order by lower(%s)
                """.formatted(NAME, AVATAR_VERSION, NAME))
                .param("me", me)
                .query(Connection.class)
                .list();
    }

    /** Pending requests waiting for this user to answer (the Friends tab badge). */
    public int countIncoming(UUID me) {
        return jdbc.sql("select count(*) from friendships where addressee_id = :me and status = 'pending'")
                .param("me", me)
                .query(Integer.class)
                .single();
    }

    /** The row between two users, whichever of them sent the request. */
    public Optional<Link> link(UUID a, UUID b) {
        return jdbc.sql("""
                select requester_id, addressee_id, status from friendships
                where (requester_id = :a and addressee_id = :b) or (requester_id = :b and addressee_id = :a)
                """)
                .param("a", a)
                .param("b", b)
                .query(Link.class)
                .optional();
    }

    /** Throws DuplicateKeyException if the pair already has a row. */
    public void request(UUID requester, UUID addressee) {
        jdbc.sql("insert into friendships (requester_id, addressee_id) values (:requester, :addressee)")
                .param("requester", requester)
                .param("addressee", addressee)
                .update();
    }

    /** Only the addressee can accept, and only a pending request. */
    public boolean accept(UUID requester, UUID addressee) {
        return jdbc.sql("""
                update friendships set status = 'accepted', accepted_at = now()
                where requester_id = :requester and addressee_id = :addressee and status = 'pending'
                """)
                .param("requester", requester)
                .param("addressee", addressee)
                .update() > 0;
    }

    /** Decline, cancel, or unfriend: removes the row in either direction. */
    public boolean delete(UUID a, UUID b) {
        return jdbc.sql("""
                delete from friendships
                where (requester_id = :a and addressee_id = :b) or (requester_id = :b and addressee_id = :a)
                """)
                .param("a", a)
                .param("b", b)
                .update() > 0;
    }

    /** Meals from the last 24 hours of accepted friends who share their meals, newest first. */
    public List<FeedRow> feed(UUID me, int limit) {
        return jdbc.sql("""
                select m.id as meal_id, u.id as user_id, %s as name, %s as avatar_version, m.meal_label,
                       m.description, m.calories, m.protein, m.carbs, m.fat, m.logged_at
                from friendships f
                join users u on u.id = case when f.requester_id = :me then f.addressee_id else f.requester_id end
                join profiles p on p.user_id = u.id and p.share_meals
                join meals m on m.user_id = u.id and m.logged_at > now() - interval '24 hours'
                where (f.requester_id = :me or f.addressee_id = :me) and f.status = 'accepted'
                order by m.logged_at desc
                limit :limit
                """.formatted(NAME, AVATAR_VERSION))
                .param("me", me)
                .param("limit", limit)
                .query(FeedRow.class)
                .list();
    }
}
