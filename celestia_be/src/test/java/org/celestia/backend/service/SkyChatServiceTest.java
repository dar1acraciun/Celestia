package org.celestia.backend.service;

import org.celestia.backend.model.Constellation;
import org.celestia.backend.repository.ConstellationRepository;
import org.celestia.generated.model.ChatMessage;
import org.celestia.generated.model.SkyChatRequest;
import org.celestia.generated.model.SkyChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SkyChatServiceTest {

    private ConstellationRepository repository;
    private GroqService groqService;
    private SkyChatService service;

    @BeforeEach
    void setUp() {
        repository = mock(ConstellationRepository.class);
        groqService = mock(GroqService.class);
        when(groqService.chatRaw(any(), any())).thenReturn("ok");

        when(repository.findAll()).thenReturn(List.of(
                constellation("Ursa Major", "UMa", 165.0, 55.0),
                constellation("Orion", "Ori", 81.92, 4.36),
                constellation("Scorpius", "Sco", 254.19, -33.84)
        ));

        service = new SkyChatService(repository, new AstronomyService(), groqService);
    }

    private Constellation constellation(String name, String abbr, double ra, double dec) {
        Constellation c = new Constellation();
        c.setName(name);
        c.setAbbreviation(abbr);
        c.setCenterRa(ra);
        c.setCenterDec(dec);
        return c;
    }

    private SkyChatRequest request(String userText) {
        ChatMessage m = new ChatMessage();
        m.setRole("user");
        m.setContent(userText);
        SkyChatRequest r = new SkyChatRequest();
        r.setMessages(List.of(m));
        r.setLatitude(44.4);
        r.setLongitude(26.1);
        return r;
    }

    @Test
    void bigDipperAlias_resolvesToUMa() {
        SkyChatResponse resp = service.chatWithSky(request("where is the big dipper right now?"));
        assertNotNull(resp.getVisibility());
        assertEquals("UMa", resp.getVisibility().getAbbreviation());
    }

    @Test
    void typo_resolvesViaFuzzy() {
        SkyChatResponse resp = service.chatWithSky(request("can you find orioon tonight"));
        assertNotNull(resp.getVisibility());
        assertEquals("Ori", resp.getVisibility().getAbbreviation());
    }

    @Test
    void abbreviation_resolves() {
        SkyChatResponse resp = service.chatWithSky(request("ori"));
        assertNotNull(resp.getVisibility());
        assertEquals("Ori", resp.getVisibility().getAbbreviation());
    }

    @Test
    void gibberish_noMatch_nullVisibility() {
        SkyChatResponse resp = service.chatWithSky(request("what is the weather zxqwv"));
        assertNull(resp.getVisibility());
        assertEquals("ok", resp.getReply());
    }
}
