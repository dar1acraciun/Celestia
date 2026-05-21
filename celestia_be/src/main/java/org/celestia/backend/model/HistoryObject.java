package org.celestia.backend.model;

import lombok.Getter;
import lombok.Setter;
import org.celestia.generated.model.AstrometryResult;
import org.celestia.generated.model.GnnResult;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "history")
@Getter
@Setter
public class HistoryObject {

    @Id
    private String id;

    private String userId;

    private GnnResult gnn;

    private AstrometryResult astrometry;

    private String imageName;

    private String imageUrl;

    @CreatedDate
    private Instant createdAt;
}
