package org.celestia.backend.service;

import org.celestia.backend.mapper.HistoryMapper;
import org.celestia.backend.model.HistoryObject;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.HistoryRepository;
import org.celestia.generated.model.HistoryEntryResponse;
import org.celestia.generated.model.HistoryListResponse;
import org.celestia.generated.model.HistoryRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class HistoryService {

    private final HistoryMapper historyMapper;
    private final HistoryRepository historyRepository;

    public HistoryService(HistoryMapper historyMapper, HistoryRepository historyRepository) {
        this.historyMapper = historyMapper;
        this.historyRepository = historyRepository;
    }

    public HistoryEntryResponse addHistory(HistoryRequest historyRequest){
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userId = user.getId();
        HistoryObject historyObject = historyMapper.toHistoryObject(historyRequest);
        historyObject.setUserId(userId);
        HistoryObject saved=historyRepository.save(historyObject);
        return historyMapper.toHistoryEntryResponse(saved);

    }

    public HistoryListResponse getHistory(int page,int limit){
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Page<HistoryObject> result=historyRepository.findByUserId(user.getId(), PageRequest.of(page, limit));

        return historyMapper.toHistoryListResponse(result.getContent(), result.getTotalElements(), page, limit);

    }


}
