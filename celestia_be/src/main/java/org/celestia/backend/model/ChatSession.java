package org.celestia.backend.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "chat_sessions")
@Getter
@Setter
public class ChatSession {

    @Id
    private String id;

    private String userId;
    private String constellationName;
    private List<Message> messages;

    @CreatedDate
    private Instant createdAt;

    @Getter
    @Setter
    public static class Message {
        private String role;
        private String content;
    }
}
