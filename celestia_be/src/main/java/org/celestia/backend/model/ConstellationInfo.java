package org.celestia.backend.model;

import java.util.List;

public record ConstellationInfo(
        String description,
        String mythology,
        String brightestStar,
        String visibleLatitudes,
        String quadrant,
        List<String> nearestConstellations,
        List<String> notableObjects,
        List<String> meteorShowers
) {}