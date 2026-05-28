package org.celestia.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class NasaService {

    private static final Logger log = LoggerFactory.getLogger(NasaService.class);
    private static final String NASA_API = "https://images-api.nasa.gov/search";
    private static final int MAX_IMAGES = 3;

    // Keywords that indicate non-astronomical content
    private static final List<String> EXCLUDE_KEYWORDS = List.of(
            "patch", "crew", "mission", "sts-", "sts ", "astronaut", "portrait",
            "insignia", "emblem", "launch", "landing", "shuttle", "rocket", "nasa insignia"
    );

    // Keywords that indicate good astronomical content
    private static final List<String> ASTRONOMY_KEYWORDS = List.of(
            "nebula", "galaxy", "cluster", "star", "telescope", "hubble", "observation",
            "constellation", "astronomical", "deep sky", "infrared", "optical", "image",
            "chandra", "spitzer", "james webb", "jwst", "messier", "ngc"
    );

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public NasaService(ObjectMapper objectMapper) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    public record NasaImage(String url, String title, String description) {}

    public record NasaResult(List<NasaImage> images, String context) {}

    public NasaResult fetchConstellationData(String constellationName) {
        try {
            String query = constellationName.replace(" ", "+") + "+constellation";
            String url = NASA_API + "?q=" + query + "&media_type=image&page_size=50";

            String response = restClient.get()
                    .uri(url)
                    .header("User-Agent", "CelestiaApp/1.0")
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.at("/collection/items");

            List<NasaImage> images = new ArrayList<>();
            StringBuilder context = new StringBuilder();

            for (JsonNode item : items) {
                if (images.size() >= MAX_IMAGES && context.length() > 3000) break;

                JsonNode data = item.at("/data/0");
                String title = data.has("title") ? data.get("title").asText("") : "";
                String description = data.has("description") ? data.get("description").asText("") : "";
                String combined = (title + " " + description).toLowerCase();

                // Skip obvious non-astronomical content (mission patches, crew photos)
                if (EXCLUDE_KEYWORDS.stream().anyMatch(combined::contains)) continue;

                if (context.length() < 4000 && !title.isEmpty()) {
                    context.append("Title: ").append(title).append("\n");
                    if (!description.isEmpty()) {
                        String shortDesc = description.length() > 400 ? description.substring(0, 400) + "..." : description;
                        context.append("Description: ").append(shortDesc).append("\n\n");
                    }
                }

                if (images.size() < MAX_IMAGES && item.has("links")) {
                    JsonNode links = item.get("links");
                    if (links.isArray() && links.size() > 0) {
                        String imageUrl = links.get(0).at("/href").asText();
                        if (!imageUrl.isEmpty()) {
                            images.add(new NasaImage(imageUrl, title,
                                    description.length() > 200 ? description.substring(0, 200) + "..." : description));
                        }
                    }
                }
            }

            log.info("NASA: {} images, {} chars context for {}", images.size(), context.length(), constellationName);
            return new NasaResult(images, context.toString());

        } catch (Exception e) {
            log.warn("NASA fetch failed for {}: {}", constellationName, e.getMessage());
            return new NasaResult(List.of(), "");
        }
    }
}
