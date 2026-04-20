package org.celestia.backend.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
@Getter
@Setter
public class User {

    @Id
    private String id;
    private String username;
    private String password;
    private String email;
    @CreatedDate
    private Instant createdAt;



}
