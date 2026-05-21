package org.celestia.backend.service;

import org.celestia.backend.mapper.ConstellationMapper;
import org.celestia.backend.model.Constellation;
import org.celestia.backend.repository.ConstellationRepository;
import org.celestia.generated.model.ConstellationListResponse;
import org.celestia.generated.model.ConstellationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConstellationService {

    private static final Logger log = LoggerFactory.getLogger(ConstellationService.class);

    private final ConstellationRepository constellationRepository;
    private final ConstellationMapper constellationMapper;
    private final GeminiService geminiService;

    public ConstellationService(ConstellationRepository constellationRepository,
                                ConstellationMapper constellationMapper,
                                GeminiService geminiService) {
        this.constellationRepository = constellationRepository;
        this.constellationMapper = constellationMapper;
        this.geminiService = geminiService;
    }

    public ConstellationResponse getConstellation(String name) {
        Constellation constellation = constellationRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RuntimeException("Constellation not found: " + name));

        if (constellation.getDescription() == null || constellation.getBrightestStar() == null) {
            enrichFromGemini(constellation);
        }

        return constellationMapper.toConstellationResponse(constellation);
    }

    public ConstellationListResponse getAllConstellations() {
        List<Constellation> all = constellationRepository.findAll();
        return constellationMapper.toConstellationListResponse(all);
    }

    private void enrichFromGemini(Constellation constellation) {
        log.info("Enriching {} via Groq", constellation.getName());
        GeminiService.ConstellationInfo info = geminiService.generateConstellationInfo(constellation.getName());
        if (info.description()           != null) constellation.setDescription(info.description());
        if (info.mythology()             != null) constellation.setMythology(info.mythology());
        if (info.brightestStar()         != null) constellation.setBrightestStar(info.brightestStar());
        if (info.visibleLatitudes()      != null) constellation.setVisibleLatitudes(info.visibleLatitudes());
        if (info.quadrant()              != null) constellation.setQuadrant(info.quadrant());
        if (info.nearestConstellations() != null) constellation.setNearestConstellations(info.nearestConstellations());
        if (info.notableObjects()        != null) constellation.setNotableObjects(info.notableObjects());
        if (info.meteorShowers()         != null) constellation.setMeteorShowers(info.meteorShowers());
        constellationRepository.save(constellation);
    }
}
