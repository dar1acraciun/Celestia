package org.celestia.backend.service;

import org.celestia.backend.mapper.HistoryMapper;
import org.celestia.backend.model.HistoryObject;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.HistoryRepository;
import org.celestia.generated.model.HistoryEntryResponse;
import org.celestia.generated.model.HistoryListResponse;
import org.celestia.generated.model.HistoryRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HistoryServiceTest {

    @Mock HistoryMapper historyMapper;
    @Mock HistoryRepository historyRepository;

    @InjectMocks HistoryService historyService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId("user-123");
        user.setEmail("test@example.com");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void addHistory_setsUserIdAndSaves() {
        HistoryRequest request = new HistoryRequest();
        HistoryObject mapped = new HistoryObject();
        HistoryObject saved = new HistoryObject();
        HistoryEntryResponse response = new HistoryEntryResponse();

        when(historyMapper.toHistoryObject(request)).thenReturn(mapped);
        when(historyRepository.save(mapped)).thenReturn(saved);
        when(historyMapper.toHistoryEntryResponse(saved)).thenReturn(response);

        HistoryEntryResponse result = historyService.addHistory(request);

        assertThat(mapped.getUserId()).isEqualTo("user-123");
        assertThat(result).isSameAs(response);
        verify(historyRepository).save(mapped);
    }

    @Test
    void addHistory_returnsResponseFromSavedObject() {
        HistoryRequest request = new HistoryRequest();
        HistoryObject mapped = new HistoryObject();
        HistoryObject saved = new HistoryObject();
        saved.setId("entry-1");
        HistoryEntryResponse response = new HistoryEntryResponse();
        response.setId("entry-1");

        when(historyMapper.toHistoryObject(request)).thenReturn(mapped);
        when(historyRepository.save(mapped)).thenReturn(saved);
        when(historyMapper.toHistoryEntryResponse(saved)).thenReturn(response);

        HistoryEntryResponse result = historyService.addHistory(request);

        assertThat(result.getId()).isEqualTo("entry-1");
    }

    @Test
    void getHistory_returnsPagedResults() {
        HistoryObject obj = new HistoryObject();
        PageImpl<HistoryObject> page = new PageImpl<>(List.of(obj), PageRequest.of(0, 10), 1);
        HistoryListResponse expected = new HistoryListResponse();

        when(historyRepository.findByUserId("user-123", PageRequest.of(0, 10))).thenReturn(page);
        when(historyMapper.toHistoryListResponse(List.of(obj), 1L, 0, 10)).thenReturn(expected);

        HistoryListResponse result = historyService.getHistory(0, 10);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void getHistory_passesPageAndLimitToMapper() {
        PageImpl<HistoryObject> page = new PageImpl<>(List.of(), PageRequest.of(2, 5), 0);
        HistoryListResponse expected = new HistoryListResponse();

        when(historyRepository.findByUserId("user-123", PageRequest.of(2, 5))).thenReturn(page);
        when(historyMapper.toHistoryListResponse(List.of(), 0L, 2, 5)).thenReturn(expected);

        historyService.getHistory(2, 5);

        verify(historyMapper).toHistoryListResponse(List.of(), 0L, 2, 5);
    }
}