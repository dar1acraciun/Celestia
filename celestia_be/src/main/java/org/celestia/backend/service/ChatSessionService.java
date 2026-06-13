package org.celestia.backend.service;

import org.celestia.backend.mapper.ChatSessionMapper;
import org.celestia.backend.model.ChatSession;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.ChatSessionRepository;
import org.celestia.generated.model.ChatSessionListResponse;
import org.celestia.generated.model.SaveChatRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


@Service
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatSessionMapper chatSessionMapper;

    public ChatSessionService(ChatSessionRepository chatSessionRepository, ChatSessionMapper chatSessionMapper) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatSessionMapper = chatSessionMapper;
    }


    public void save(SaveChatRequest request) {
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

    public ChatSessionListResponse getAll() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userId = user.getId();

        return chatSessionMapper.toListResponse(chatSessionRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }


}
