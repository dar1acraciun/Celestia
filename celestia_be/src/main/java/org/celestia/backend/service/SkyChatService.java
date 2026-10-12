package org.celestia.backend.service;

import org.celestia.backend.exception.InvalidSkyChatRequestException;
import org.celestia.backend.model.Constellation;
import org.celestia.backend.repository.ConstellationRepository;
import org.celestia.backend.service.AstronomyService.VisibilityFacts;
import org.celestia.generated.model.ChatMessage;
import org.celestia.generated.model.SkyChatRequest;
import org.celestia.generated.model.SkyChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SkyChatService {

    private static final Logger log = LoggerFactory.getLogger(SkyChatService.class);

    /** Max Levenshtein edit distance for the fuzzy name fallback. */
    private static final int FUZZY_MAX_DISTANCE = 2;
    /** Minimum matched-token length for a fuzzy hit, to avoid 3-letter false positives. */
    private static final int FUZZY_MIN_TOKEN_LENGTH = 4;

    /** Common/colloquial aliases -> IAU abbreviation. */
    private static final Map<String, String> ALIASES = Map.of(
            "big dipper", "UMa",
            "plough", "UMa",
            "little dipper", "UMi",
            "scorpius", "Sco",
            "scorpio", "Sco",
            "the hunter", "Ori"
    );

    private final ConstellationRepository constellationRepository;
    private final AstronomyService astronomyService;
    private final GroqService groqService;

    public SkyChatService(ConstellationRepository constellationRepository,
                          AstronomyService astronomyService,
                          GroqService groqService) {
        this.constellationRepository = constellationRepository;
        this.astronomyService = astronomyService;
        this.groqService = groqService;
    }

    public SkyChatResponse chatWithSky(SkyChatRequest request) {
        validate(request);

        Instant now = resolveTime(request);
        List<Constellation> all = constellationRepository.findAll();

        String latestUser = latestUserMessage(request.getMessages());
        Constellation resolved = resolveConstellation(latestUser, all);

        VisibilityFacts facts = null;
        String systemPrompt;
        org.celestia.generated.model.VisibilityFacts dto = null;

        if (resolved != null && resolved.getCenterRa() != null && resolved.getCenterDec() != null) {
            facts = astronomyService.computeVisibility(
                    resolved.getCenterRa(), resolved.getCenterDec(),
                    request.getLatitude(), request.getLongitude(), now);
            dto = toDto(resolved, facts);
            systemPrompt = buildFactsPrompt(resolved, facts);
        } else {
            if (resolved != null) {
                log.warn("Resolved constellation {} has null centers; falling back to general phrasing",
                        resolved.getAbbreviation());
            }
            systemPrompt = buildGeneralPrompt();
        }

        List<Map<String, String>> history = request.getMessages().stream()
                .map(m -> {
                    Map<String, String> msg = new HashMap<>();
                    msg.put("role", m.getRole());
                    msg.put("content", m.getContent());
                    return msg;
                })
                .toList();

        SkyChatResponse response = new SkyChatResponse();
        response.setReply(groqService.chatRaw(history, systemPrompt));
        response.setVisibility(dto);
        return response;
    }

    // --- validation ---

    private void validate(SkyChatRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            throw new InvalidSkyChatRequestException("messages must not be empty");
        }
        Double lat = request.getLatitude();
        Double lon = request.getLongitude();
        if (lat == null || lat < -90 || lat > 90) {
            throw new InvalidSkyChatRequestException("latitude must be in [-90, 90]");
        }
        if (lon == null || lon < -180 || lon > 180) {
            throw new InvalidSkyChatRequestException("longitude must be in [-180, 180]");
        }
    }

    private Instant resolveTime(SkyChatRequest request) {
        OffsetDateTime time = request.getTime();
        return time != null ? time.toInstant() : Instant.now();
    }

    private String latestUserMessage(List<ChatMessage> messages) {
        for (int i = messages.size() - 1; i >= 0; i--) {
            ChatMessage m = messages.get(i);
            if (m.getRole() != null && "user".equalsIgnoreCase(m.getRole()) && m.getContent() != null) {
                return m.getContent();
            }
        }
        ChatMessage last = messages.get(messages.size() - 1);
        return last.getContent() != null ? last.getContent() : "";
    }

    // --- name resolution ---

    private Constellation resolveConstellation(String text, List<Constellation> all) {
        String normalized = normalize(text);
        if (normalized.isEmpty()) {
            return null;
        }

        Map<String, Constellation> byName = new HashMap<>();
        Map<String, Constellation> byAbbr = new HashMap<>();
        for (Constellation c : all) {
            if (c.getName() != null) byName.put(normalize(c.getName()), c);
            if (c.getAbbreviation() != null) byAbbr.put(normalize(c.getAbbreviation()), c);
        }
        Map<String, Constellation> byAlias = new HashMap<>();
        ALIASES.forEach((alias, abbr) -> {
            Constellation c = byAbbr.get(normalize(abbr));
            if (c != null) byAlias.put(normalize(alias), c);
        });

        // 1. Direct lookups on the whole normalized string.
        Constellation direct = firstNonNull(
                byName.get(normalized), byAbbr.get(normalized), byAlias.get(normalized));
        if (direct != null) {
            return direct;
        }

        // 2. Whole-phrase alias / name substring scan (multi-word aliases/names).
        for (Map.Entry<String, Constellation> e : byAlias.entrySet()) {
            if (containsWord(normalized, e.getKey())) return e.getValue();
        }
        for (Map.Entry<String, Constellation> e : byName.entrySet()) {
            if (containsWord(normalized, e.getKey())) return e.getValue();
        }

        // 3. Token scan: exact name/abbreviation hit on any whole word.
        String[] tokens = normalized.split("\\s+");
        for (String token : tokens) {
            Constellation hit = firstNonNull(byName.get(token), byAbbr.get(token), byAlias.get(token));
            if (hit != null) return hit;
        }

        // 4. Fuzzy fallback: best Levenshtein match within threshold on names (abbr too short).
        Constellation best = null;
        int bestDist = Integer.MAX_VALUE;
        for (String token : tokens) {
            if (token.length() < FUZZY_MIN_TOKEN_LENGTH) continue;
            for (Map.Entry<String, Constellation> e : byName.entrySet()) {
                int d = levenshtein(token, e.getKey());
                if (d <= FUZZY_MAX_DISTANCE && d < bestDist) {
                    bestDist = d;
                    best = e.getValue();
                }
            }
        }
        return best;
    }

    private static String normalize(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
        n = n.replaceAll("[^a-z0-9\\s]", " ");
        return n.replaceAll("\\s+", " ").trim();
    }

    private static boolean containsWord(String haystack, String needle) {
        if (needle.isEmpty()) return false;
        return (" " + haystack + " ").contains(" " + needle + " ");
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T v : values) {
            if (v != null) return v;
        }
        return null;
    }

    private static int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = cur;
            cur = tmp;
        }
        return prev[b.length()];
    }

    // --- DTO mapping + prompts ---

    private org.celestia.generated.model.VisibilityFacts toDto(Constellation c, VisibilityFacts f) {
        org.celestia.generated.model.VisibilityFacts dto = new org.celestia.generated.model.VisibilityFacts();
        dto.setConstellation(c.getName());
        dto.setAbbreviation(c.getAbbreviation());
        dto.setState(f.state().name());
        dto.setAltitudeDeg(round(f.altitudeDeg()));
        dto.setAzimuthDeg(round(f.azimuthDeg()));
        dto.setCompass(f.compass());
        if (f.state() == AstronomyService.State.BELOW_RISES) {
            if (f.nextRiseUtc() != null) {
                dto.setNextRiseUtc(f.nextRiseUtc().atOffset(java.time.ZoneOffset.UTC));
            }
            dto.setNextRiseInHours(f.nextRiseInHours());
            dto.setRiseCompass(f.riseCompass());
        }
        return dto;
    }

    private String buildFactsPrompt(Constellation c, VisibilityFacts f) {
        StringBuilder facts = new StringBuilder();
        facts.append("  constellation: ").append(c.getName())
                .append(" (").append(c.getAbbreviation()).append(")\n");
        facts.append("  state: ").append(f.state().name()).append("\n");

        switch (f.state()) {
            case NEVER_VISIBLE -> facts.append(
                    "  note: never rises above the horizon from the user's latitude; give no direction\n");
            case BELOW_RISES -> {
                facts.append("  altitude_deg: ").append(Math.round(f.altitudeDeg())).append("\n");
                if (f.nextRiseInHours() != null) {
                    facts.append("  next_rise_in_hours: ").append(f.nextRiseInHours()).append("\n");
                }
                if (f.riseCompass() != null) {
                    facts.append("  rise_compass: ").append(f.riseCompass()).append("\n");
                }
                if (f.nextRiseUtc() != null) {
                    facts.append("  next_rise_utc: ").append(f.nextRiseUtc()).append("\n");
                }
            }
            default -> {
                facts.append("  altitude_deg: ").append(Math.round(f.altitudeDeg())).append("\n");
                facts.append("  azimuth_deg: ").append(round(f.azimuthDeg())).append("\n");
                facts.append("  compass: ").append(f.compass()).append("\n");
            }
        }

        return """
                You are Celestia's astronomy guide inside the sky-map view. Be a warm, knowledgeable companion for any
                astronomy or space question (stars, planets, galaxies, nebulae, mythology, observing tips, missions).
                Answer in 2-4 concise sentences; a little longer is fine for a genuinely educational question.

                You are ALSO given computed, location-specific facts about one constellation (below). Follow these rules:
                - For the LIVE position of that constellation (its direction, altitude, whether it is visible right now,
                  or when it next rises) use ONLY the facts; never invent or guess those values.
                - For NEVER_VISIBLE, say it never rises from here and give no direction. For BELOW_RISES, phrase
                  next_rise_in_hours as "in about N hours", not a wall-clock time.
                - General knowledge is NOT restricted by these facts: you may freely explain what the constellation,
                  its stars, or related objects ARE, their mythology, history, and typical observing season, even if
                  that detail is not in the facts. Only live here-and-now positions are gated.
                FACTS:
                %sPhrase everything naturally; do not output JSON or the field names.
                """.formatted(facts.toString());
    }

    private String buildGeneralPrompt() {
        return """
                You are Celestia's astronomy guide inside the sky-map view. Be a warm, knowledgeable companion for any
                astronomy or space-science question: constellations, stars, planets, moons, galaxies, nebulae,
                telescopes, missions, the mythology behind constellations, and how or when to observe the sky. Answer in
                2-4 concise sentences; a little longer is fine for a genuinely educational question. If a question is
                clearly unrelated to astronomy or space, gently steer back.

                One rule: do NOT state the LIVE, here-and-now position of an object (its current direction, altitude,
                whether it is visible right now, or when it next rises) unless such computed facts are explicitly
                provided to you. For a live-position question with no facts given, say you don't have the live position
                from here and suggest asking about a specific constellation so the sky map can compute it. General,
                non-time-specific facts (what an object is, its mythology, which season it is best seen) are fine.
                """;
    }

    private static Double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
