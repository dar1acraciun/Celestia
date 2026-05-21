package org.celestia.backend.repository;

import org.celestia.backend.model.Constellation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ConstellationRepository extends MongoRepository<Constellation, String> {

    Optional<Constellation> findByNameIgnoreCase(String name);
}
