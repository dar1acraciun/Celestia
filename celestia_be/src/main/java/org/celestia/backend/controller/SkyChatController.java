package org.celestia.backend.controller;

import org.celestia.backend.service.SkyChatService;
import org.celestia.generated.model.SkyChatRequest;
import org.celestia.generated.model.SkyChatResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/skymap")
public class SkyChatController {

    private final SkyChatService skyChatService;

    public SkyChatController(SkyChatService skyChatService) {
        this.skyChatService = skyChatService;
    }

    @PostMapping("/chat")
    public SkyChatResponse chatWithSky(@RequestBody SkyChatRequest request) {
        return skyChatService.chatWithSky(request);
    }
}
