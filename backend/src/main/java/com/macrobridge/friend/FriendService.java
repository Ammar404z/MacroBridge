package com.macrobridge.friend;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.macrobridge.common.ApiException;
import com.macrobridge.friend.FriendRepository.Connection;
import com.macrobridge.friend.FriendRepository.FeedRow;
import com.macrobridge.friend.FriendRepository.Link;
import com.macrobridge.friend.FriendRepository.Person;
import com.macrobridge.meal.MealDtos.DayResponse;
import com.macrobridge.meal.MealDtos.Macros;
import com.macrobridge.meal.MealService;

/**
 * Mutual friends: a request (sent by opening someone's invite link) becomes a friendship
 * once the other person accepts. Friends who share their meals expose their whole day.
 */
@Service
public class FriendService {

    /** totals/targets are null when the friend has turned sharing off. */
    public record Friend(UUID id, String name, Long avatarVersion, boolean sharing, Macros totals, Macros targets) {}

    public record FriendsResponse(String inviteCode, List<Friend> friends, List<Person> incoming,
                                  List<Person> outgoing, List<FeedRow> feed) {}

    /** day is null when the friend has turned sharing off. */
    public record FriendDay(UUID id, String name, Long avatarVersion, boolean sharing, DayResponse day) {}

    /** relation: self, none, requested (I asked them), incoming (they asked me), friends */
    public record InvitePreview(Person person, String relation) {}

    private static final int FEED_LIMIT = 30;

    private final FriendRepository friends;
    private final MealService meals;

    public FriendService(FriendRepository friends, MealService meals) {
        this.friends = friends;
        this.meals = meals;
    }

    public FriendsResponse overview(UUID me) {
        List<Connection> all = friends.connections(me);
        List<Friend> accepted = all.stream()
                .filter(c -> c.status().equals("accepted"))
                .map(c -> {
                    // Each friend's "today" is in their own timezone
                    DayResponse day = c.shareMeals() ? meals.today(c.id()) : null;
                    return new Friend(c.id(), c.name(), c.avatarVersion(), c.shareMeals(),
                            day == null ? null : day.totals(), day == null ? null : day.targets());
                })
                .toList();
        List<Person> incoming = pending(all, false);
        List<Person> outgoing = pending(all, true);
        return new FriendsResponse(friends.inviteCode(me), accepted, incoming, outgoing, friends.feed(me, FEED_LIMIT));
    }

    public FriendDay friendDay(UUID me, UUID friendId) {
        Connection c = friends.connections(me).stream()
                .filter(x -> x.id().equals(friendId) && x.status().equals("accepted"))
                .findFirst()
                .orElseThrow(FriendService::notFriends);
        return new FriendDay(c.id(), c.name(), c.avatarVersion(), c.shareMeals(),
                c.shareMeals() ? meals.today(c.id()) : null);
    }

    public InvitePreview preview(UUID me, String code) {
        Person person = friends.findByInviteCode(code).orElseThrow(FriendService::badInvite);
        return new InvitePreview(person, relation(me, person.id()));
    }

    /**
     * Opening someone's invite link and tapping "Add" sends them a request. If they had
     * already sent me one, this accepts it instead. Returns the new relation.
     */
    public String sendRequest(UUID me, String code) {
        Person person = friends.findByInviteCode(code).orElseThrow(FriendService::badInvite);
        String relation = relation(me, person.id());
        switch (relation) {
            case "self" -> throw new ApiException(HttpStatus.BAD_REQUEST, "That's your own invite link");
            case "incoming" -> {
                friends.accept(person.id(), me);
                return "friends";
            }
            case "none" -> {
                try {
                    friends.request(me, person.id());
                } catch (DuplicateKeyException e) {
                    // Both tapped at the same moment; the other row already exists
                    return relation(me, person.id());
                }
                return "requested";
            }
            default -> {
                return relation;
            }
        }
    }

    public void accept(UUID me, UUID requesterId) {
        if (!friends.accept(requesterId, me)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Friend request not found");
        }
    }

    /** Decline an incoming request, cancel an outgoing one, or unfriend. */
    public void remove(UUID me, UUID otherId) {
        if (!friends.delete(me, otherId)) {
            throw notFriends();
        }
    }

    /** Pictures are visible to yourself and anyone you're linked with (including pending requests). */
    public boolean canSeeAvatar(UUID me, UUID userId) {
        return me.equals(userId) || friends.link(me, userId).isPresent();
    }

    private String relation(UUID me, UUID other) {
        if (me.equals(other)) return "self";
        Optional<Link> link = friends.link(me, other);
        if (link.isEmpty()) return "none";
        if (link.get().status().equals("accepted")) return "friends";
        return link.get().requesterId().equals(me) ? "requested" : "incoming";
    }

    private static List<Person> pending(List<Connection> all, boolean outgoing) {
        return all.stream()
                .filter(c -> c.status().equals("pending") && c.outgoing() == outgoing)
                .map(c -> new Person(c.id(), c.name(), c.avatarVersion()))
                .toList();
    }

    private static ApiException notFriends() {
        return new ApiException(HttpStatus.NOT_FOUND, "Not friends with this person");
    }

    private static ApiException badInvite() {
        return new ApiException(HttpStatus.NOT_FOUND, "This invite link isn't valid");
    }
}
