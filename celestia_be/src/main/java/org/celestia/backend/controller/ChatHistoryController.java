package org.celestia.backend.controller;

import org.celestia.backend.model.ChatSession;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.ChatSessionRepository;
import org.celestia.generated.model.ChatMessage;
import org.celestia.generated.model.ChatSessionListResponse;
import org.celestia.generated.model.ChatSessionResponse;
import org.celestia.generated.model.SaveChatRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/history/chats")
public class ChatHistoryController {

    private final ChatSessionRepository chatSessionRepository;

    public ChatHistoryController(ChatSessionRepository chatSessionRepository) {
        this.chatSessionRepository = chatSessionRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void save(@RequestBody SaveChatRequest request) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userId = user.getId();

        ChatSession session = new ChatSession();
        session.setUserId(userId);
        session.setConstellationName(request.getConstellationName());
        session.setMessages(request.getMessages().stream()
                .map(m -> {
                    ChatSession.Message msg = new ChatSession.Message();
                    msg.setRole(m.getRole());
                    msg.setContent(m.getContent());
                    return msg;
                })
                .toList());
        chatSessionRepository.save(session);
    }

    @GetMapping
    public ChatSessionListResponse getAll() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userId = user.getId();

        List<ChatSessionResponse> sessions = chatSessionRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();

        ChatSessionListResponse response = new ChatSessionListResponse();
        response.setSessions(sessions);
        return response;
    }

    private ChatSessionResponse toResponse(ChatSession s) {
        ChatSessionResponse r = new ChatSessionResponse();
        r.setId(s.getId());
        r.setConstellationName(s.getConstellationName());
        r.setCreatedAt(s.getCreatedAt() != null
                ? java.time.OffsetDateTime.ofInstant(s.getCreatedAt(), java.time.ZoneOffset.UTC)
                : null);
        r.setMessages(s.getMessages() == null ? List.of() :
                s.getMessages().stream().map(m -> {
                    ChatMessage cm = new ChatMessage();
                    cm.setRole(m.getRole());
                    cm.setContent(m.getContent());
                    return cm;
                }).toList());
        return r;
    }
}
