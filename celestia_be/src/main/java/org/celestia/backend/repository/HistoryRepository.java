package org.celestia.backend.repository;

import org.celestia.backend.model.HistoryObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HistoryRepository extends MongoRepository<HistoryObject, String> {
    Page<HistoryObject> findByUserId(String userId, Pageable pageable);

}
