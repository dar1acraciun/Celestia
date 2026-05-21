package org.celestia.backend.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "constellations")
@Getter
@Setter
public class Constellation {

    @Id
    private String id;

    private String name;
    private String abbreviation;
    private String description;
    private String mythology;
    private List<String> mainStars;
    private String hemisphere;
    private String bestVisibilityMonth;
    private Double area;
    private String imageUrl;

    // Enriched by Groq
    private String brightestStar;
    private String visibleLatitudes;
    private String quadrant;
    private List<String> nearestConstellations;
    private List<String> notableObjects;
    private List<String> meteorShowers;
}
