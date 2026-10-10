package org.celestia.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.celestia.backend.model.Constellation;
import org.celestia.backend.repository.ConstellationRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ConstellationSeeder implements ApplicationRunner {

    private final ConstellationRepository constellationRepository;
    private final ObjectMapper objectMapper;

    public ConstellationSeeder(ConstellationRepository constellationRepository, ObjectMapper objectMapper) {
        this.constellationRepository = constellationRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Load the center table first, independent of any guard, so the back-fill below is
        // never short-circuited by the already-seeded early return. ConstellationSeeder is the
        // single writer of centerRa/centerDec; both paths below are idempotent.
        Map<String, double[]> centers = loadCenters();

        if (constellationRepository.count() == 0) {
            ClassPathResource resource = new ClassPathResource("constellations.json");
            List<Constellation> constellations = objectMapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<>() {}
            );
            for (Constellation c : constellations) {
                applyCenter(c, centers);
            }
            constellationRepository.saveAll(constellations);
            return;
        }

        // Already seeded: back-fill centers onto any document that is still missing them.
        List<Constellation> changed = new ArrayList<>();
        for (Constellation c : constellationRepository.findAll()) {
            if (c.getCenterRa() == null && applyCenter(c, centers)) {
                changed.add(c);
            }
        }
        if (!changed.isEmpty()) {
            constellationRepository.saveAll(changed);
        }
    }

    private Map<String, double[]> loadCenters() throws Exception {
        ClassPathResource resource = new ClassPathResource("constellation-centers.json");
        Map<String, Map<String, Double>> raw = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<>() {}
        );
        Map<String, double[]> centers = new java.util.HashMap<>();
        raw.forEach((abbr, rd) -> centers.put(abbr, new double[]{rd.get("ra"), rd.get("dec")}));
        return centers;
    }

    private boolean applyCenter(Constellation c, Map<String, double[]> centers) {
        double[] rd = c.getAbbreviation() != null ? centers.get(c.getAbbreviation()) : null;
        if (rd == null) {
            return false;
        }
        c.setCenterRa(rd[0]);
        c.setCenterDec(rd[1]);
        return true;
    }
}
