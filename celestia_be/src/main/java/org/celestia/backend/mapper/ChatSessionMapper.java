package org.celestia.backend.mapper;


import org.celestia.backend.model.ChatSession;
import org.celestia.generated.model.ChatMessage;
import org.celestia.generated.model.ChatSessionListResponse;
import org.celestia.generated.model.ChatSessionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ChatSessionMapper {
    @Mapping(target = "role", source = "role")
    @Mapping(target = "content", source = "content")
    ChatMessage toMessage(ChatSession.Message message);

    @Mapping(target = "messages", source = "messages")
    ChatSessionResponse toResponse(ChatSession session);

    default ChatSessionListResponse toListResponse(List<ChatSession> sessions) {
        ChatSessionListResponse r = new ChatSessionListResponse();
        r.setSessions(sessions.stream().map(this::toResponse).toList());
        return r;
    }

    default OffsetDateTime map(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

}
