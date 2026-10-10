package org.celestia.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.celestia.backend.service.SkyChatService;
import org.celestia.generated.model.ChatMessage;
import org.celestia.generated.model.SkyChatRequest;
import org.celestia.generated.model.SkyChatResponse;
import org.celestia.generated.model.VisibilityFacts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        value = SkyChatController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class SkyChatIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean SkyChatService skyChatService;
    @MockBean org.celestia.backend.service.JwtService jwtService;
    @MockBean org.celestia.backend.repository.UserRepository userRepository;

    private SkyChatRequest validRequest() {
        ChatMessage m = new ChatMessage();
        m.setRole("user");
        m.setContent("where is orion");
        SkyChatRequest r = new SkyChatRequest();
        r.setMessages(List.of(m));
        r.setLatitude(44.4);
        r.setLongitude(26.1);
        return r;
    }

    @Test
    void chat_returns200AndVisibility() throws Exception {
        VisibilityFacts facts = new VisibilityFacts();
        facts.setConstellation("Orion");
        facts.setAbbreviation("Ori");
        facts.setState("VISIBLE");
        facts.setCompass("SE");
        SkyChatResponse response = new SkyChatResponse();
        response.setReply("Orion is high in the southeast.");
        response.setVisibility(facts);
        when(skyChatService.chatWithSky(any())).thenReturn(response);

        mockMvc.perform(post("/skymap/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Orion is high in the southeast."))
                .andExpect(jsonPath("$.visibility.abbreviation").value("Ori"))
                .andExpect(jsonPath("$.visibility.compass").value("SE"));
    }

    @Test
    void missingLatitude_returns400() throws Exception {
        when(skyChatService.chatWithSky(any()))
                .thenThrow(new org.celestia.backend.exception.InvalidSkyChatRequestException(
                        "latitude must be in [-90, 90]"));

        SkyChatRequest r = validRequest();
        r.setLatitude(null);

        mockMvc.perform(post("/skymap/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("latitude must be in [-90, 90]"));
    }

    @Test
    void emptyMessages_returns400() throws Exception {
        when(skyChatService.chatWithSky(any()))
                .thenThrow(new org.celestia.backend.exception.InvalidSkyChatRequestException(
                        "messages must not be empty"));

        SkyChatRequest r = validRequest();
        r.setMessages(List.of());

        mockMvc.perform(post("/skymap/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("messages must not be empty"));
    }
}
