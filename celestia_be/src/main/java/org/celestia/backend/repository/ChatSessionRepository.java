package org.celestia.backend.repository;

import org.celestia.backend.model.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {
    List<ChatSession> findByUserIdOrderByCreatedAtDesc(String userId);
}
