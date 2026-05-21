package org.celestia.backend.controller;

import org.celestia.backend.service.ConstellationService;
import org.celestia.backend.service.GeminiService;
import org.celestia.generated.model.ChatRequest;
import org.celestia.generated.model.ChatResponse;
import org.celestia.generated.model.ConstellationListResponse;
import org.celestia.generated.model.ConstellationResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/constellations")
public class ConstellationController {

    private final ConstellationService constellationService;
    private final GeminiService geminiService;

    public ConstellationController(ConstellationService constellationService, GeminiService geminiService) {
        this.constellationService = constellationService;
        this.geminiService = geminiService;
    }

    @GetMapping
    public ConstellationListResponse getAllConstellations() {
        return constellationService.getAllConstellations();
    }

    @GetMapping("/{name}")
    public ConstellationResponse getConstellation(@PathVariable String name) {
        return constellationService.getConstellation(name);
    }

    @PostMapping("/{name}/chat")
    public ChatResponse chat(@PathVariable String name, @RequestBody ChatRequest request) {
        List<Map<String, String>> messages = request.getMessages().stream()
                .map(m -> {
                    Map<String, String> msg = new java.util.HashMap<>();
                    msg.put("role", m.getRole());
                    msg.put("content", m.getContent());
                    return msg;
                })
                .toList();
        String reply = geminiService.chat(name, messages);
        ChatResponse response = new ChatResponse();
        response.setReply(reply);
        return response;
    }
}
