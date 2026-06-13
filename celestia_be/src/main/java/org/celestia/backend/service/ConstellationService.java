package org.celestia.backend.service;

import org.celestia.backend.exception.ConstellationNotFound;
import org.celestia.backend.mapper.ConstellationMapper;
import org.celestia.backend.model.Constellation;
import org.celestia.backend.model.ConstellationInfo;
import org.celestia.backend.repository.ConstellationRepository;
import org.celestia.generated.model.ChatRequest;
import org.celestia.generated.model.ChatResponse;
import org.celestia.generated.model.ConstellationListResponse;
import org.celestia.generated.model.ConstellationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ConstellationService {

    private static final Logger log = LoggerFactory.getLogger(ConstellationService.class);

    private final ConstellationRepository constellationRepository;
    private final ConstellationMapper constellationMapper;
    private final GroqService groqService;
    private final NasaService nasaService;

    public ConstellationService(ConstellationRepository constellationRepository,
                                ConstellationMapper constellationMapper,
                                GroqService groqService,
                                NasaService nasaService) {
        this.constellationRepository = constellationRepository;
        this.constellationMapper = constellationMapper;
        this.groqService = groqService;
        this.nasaService = nasaService;
    }

    public ConstellationResponse getConstellation(String name) {
        Constellation constellation = constellationRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ConstellationNotFound("Constellation not found: " + name));

        if (constellation.getDescription() == null || constellation.getBrightestStar() == null) {
            enrichFromGroq(constellation);
        }

        return constellationMapper.toConstellationResponse(constellation);
    }

    public ChatResponse chat(String constellationName, ChatRequest request) {
        List<Map<String, String>> messages = request.getMessages().stream()
                .map(m -> {
                    Map<String, String> msg = new HashMap<>();
                    msg.put("role", m.getRole());
                    msg.put("content", m.getContent());
                    return msg;
                })
                .toList();
        ChatResponse response = new ChatResponse();
        response.setReply(groqService.chat(constellationName, messages));
        return response;
    }

    public ConstellationListResponse getAllConstellations() {
        List<Constellation> all = constellationRepository.findAll();
        return constellationMapper.toConstellationListResponse(all);
    }



    private void enrichFromGroq(Constellation constellation) {
        log.info("Enriching {} — fetching NASA data", constellation.getName());
        NasaService.NasaResult nasa = nasaService.fetchConstellationData(constellation.getName());

        if (!nasa.images().isEmpty()) {
            constellation.setNasaImages(
                    nasa.images().stream().map(NasaService.NasaImage::url).toList()
            );
        }

        log.info("Enriching {} — calling Groq with NASA context", constellation.getName());
        ConstellationInfo info = groqService.generateConstellationInfo(
                constellation.getName(), nasa.context()
        );
        if (info.description() != null) constellation.setDescription(info.description());
        if (info.mythology() != null) constellation.setMythology(info.mythology());
        if (info.brightestStar() != null) constellation.setBrightestStar(info.brightestStar());
        if (info.visibleLatitudes() != null) constellation.setVisibleLatitudes(info.visibleLatitudes());
        if (info.quadrant() != null) constellation.setQuadrant(info.quadrant());
        if (info.nearestConstellations() != null) constellation.setNearestConstellations(info.nearestConstellations());
        if (info.notableObjects() != null) constellation.setNotableObjects(info.notableObjects());
        if (info.meteorShowers() != null) constellation.setMeteorShowers(info.meteorShowers());
        constellationRepository.save(constellation);
    }
}
