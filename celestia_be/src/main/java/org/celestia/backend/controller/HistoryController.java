package org.celestia.backend.controller;

import org.celestia.backend.service.HistoryService;
import org.celestia.generated.model.HistoryEntryResponse;
import org.celestia.generated.model.HistoryListResponse;
import org.celestia.generated.model.HistoryRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/history")
public class HistoryController {

    private final HistoryService historyService;
    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @PostMapping
    public HistoryEntryResponse addHistory(@RequestBody HistoryRequest historyRequest) {
        return historyService.addHistory(historyRequest);

    }

    @GetMapping
    public HistoryListResponse getHistory(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int limit) {
        return historyService.getHistory(page, limit);
    }


}
