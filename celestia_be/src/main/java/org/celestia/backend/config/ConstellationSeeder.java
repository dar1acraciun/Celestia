package org.celestia.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.celestia.backend.model.Constellation;
import org.celestia.backend.repository.ConstellationRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.List;

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
        if (constellationRepository.count() > 0) {
            return;
        }

        ClassPathResource resource = new ClassPathResource("constellations.json");
        List<Constellation> constellations = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<>() {}
        );
        constellationRepository.saveAll(constellations);
    }
}
