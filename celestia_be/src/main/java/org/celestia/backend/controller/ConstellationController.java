package org.celestia.backend.controller;

import org.celestia.backend.service.ConstellationService;
import org.celestia.generated.model.ChatRequest;
import org.celestia.generated.model.ChatResponse;
import org.celestia.generated.model.ConstellationListResponse;
import org.celestia.generated.model.ConstellationResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/constellations")
public class ConstellationController {

    private final ConstellationService constellationService;

    public ConstellationController(ConstellationService constellationService) {
        this.constellationService = constellationService;
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
        return constellationService.chat(name, request);
    }

}
