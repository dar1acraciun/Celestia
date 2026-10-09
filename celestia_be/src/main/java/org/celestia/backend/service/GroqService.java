package org.celestia.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.celestia.backend.model.ConstellationInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);
    private static final String BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

    // Model is configurable so it can be changed without a recompile when Groq
    // deprecates a model. Default is a current GroqCloud production model
    // (llama-3.3-70b-versatile was retired on 2026-08-16).
    @Value("${groq.model:openai/gpt-oss-120b}")
    private String model;

    @Value("${groq.api-key}")
    private String apiKey;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GroqService(ObjectMapper objectMapper) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    public ConstellationInfo generateConstellationInfo(String constellationName, String nasaContext) {
        String contextSection = nasaContext != null && !nasaContext.isBlank()
                ? "\n\nHere is real NASA data about this constellation to base your response on:\n" + nasaContext
                : "";

        String prompt = """
                You are an expert astronomer and mythologist. Generate comprehensive information about the %s constellation.%s
                Respond with ONLY a raw JSON object, no markdown, no code blocks, no extra text. Use exactly these fields:
                {
                  "description": "4-6 sentences: location in sky, brightest/notable stars with spectral type and distance, notable deep-sky objects, best observation conditions",
                  "mythology": "4-6 sentences: mythological origin across cultures (Greek, Roman, others), legend behind it, historical use for navigation or timekeeping",
                  "brightestStar": "Star name (mag X.XX) — one brightest star with its apparent magnitude",
                  "visibleLatitudes": "Between +XX° and -XX° — exact latitude range where the constellation is visible",
                  "quadrant": "NQ1/NQ2/NQ3/NQ4 or SQ1/SQ2/SQ3/SQ4 — the celestial quadrant",
                  "nearestConstellations": ["Name1", "Name2", "Name3"],
                  "notableObjects": ["Object name — brief description"],
                  "meteorShowers": ["Shower name"]
                }
                Be scientifically accurate. Use the NASA data where provided.
                """.formatted(constellationName, contextSection);

        try {
            String content = chat(List.of(
                    Map.of("role", "user", "content", prompt)
            ), null);
            content = content.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            JsonNode info = objectMapper.readTree(content);
            return new ConstellationInfo(
                    info.has("description")          ? info.get("description").asText() : null,
                    info.has("mythology")            ? info.get("mythology").asText()   : null,
                    info.has("brightestStar")        ? info.get("brightestStar").asText() : null,
                    info.has("visibleLatitudes")     ? info.get("visibleLatitudes").asText() : null,
                    info.has("quadrant")             ? info.get("quadrant").asText() : null,
                    info.has("nearestConstellations") ? parseStringList(info.get("nearestConstellations")) : null,
                    info.has("notableObjects")       ? parseStringList(info.get("notableObjects")) : null,
                    info.has("meteorShowers")        ? parseStringList(info.get("meteorShowers")) : null
            );
        } catch (Exception e) {
            log.warn("Groq info generation failed for {}: {}", constellationName, e.getMessage());
            return new ConstellationInfo(null, null, null, null, null, null, null, null);
        }
    }

    public String chat(String constellationName, List<Map<String, String>> history) {
        String systemPrompt = """
                You are an enthusiastic astronomy guide. The user is viewing the %s constellation page in the Celestia app.
                Answer questions about this constellation, its stars, mythology, and related astronomy topics.
                Keep responses concise (2-4 sentences), engaging, and accurate.
                """.formatted(constellationName);

        try {
            return chat(history, systemPrompt);
        } catch (Exception e) {
            log.warn("Groq chat failed for {}: {}", constellationName, e.getMessage());
            return "Sorry, something went wrong. Please try again.";
        }
    }

    private List<String> parseStringList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(el -> result.add(el.asText()));
        }
        return result;
    }

    private String chat(List<Map<String, String>> messages, String systemPrompt) throws Exception {
        List<Map<String, String>> fullMessages = new ArrayList<>();
        if (systemPrompt != null) {
            fullMessages.add(Map.of("role", "system", "content", systemPrompt));
        }
        fullMessages.addAll(messages);

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", fullMessages,
                "temperature", 0.7
        );

        String response = restClient.post()
                .uri(BASE_URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(response);
        return root.at("/choices/0/message/content").asText();
    }
}
