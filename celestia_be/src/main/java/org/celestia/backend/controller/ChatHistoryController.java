package org.celestia.backend.controller;


import org.celestia.backend.service.ChatSessionService;
import org.celestia.generated.model.ChatSessionListResponse;
import org.celestia.generated.model.SaveChatRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/history/chats")
public class ChatHistoryController {

    private final ChatSessionService chatSessionService;

    public ChatHistoryController(ChatSessionService chatSessionService) {
        this.chatSessionService = chatSessionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void save(@RequestBody SaveChatRequest request) {
        chatSessionService.save(request);
    }

    @GetMapping
    public ChatSessionListResponse getAll() {
        return chatSessionService.getAll();
    }


}
