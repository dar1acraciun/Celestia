package org.celestia.backend.mapper;

import org.celestia.backend.model.Constellation;
import org.celestia.generated.model.ConstellationListResponse;
import org.celestia.generated.model.ConstellationResponse;
import org.celestia.generated.model.ConstellationSummary;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface ConstellationMapper {

    ConstellationResponse toConstellationResponse(Constellation constellation);

    ConstellationSummary toConstellationSummary(Constellation constellation);

    default ConstellationListResponse toConstellationListResponse(List<Constellation> constellations) {
        ConstellationListResponse response = new ConstellationListResponse();
        response.setConstellations(constellations.stream()
                .map(this::toConstellationSummary)
                .collect(Collectors.toList()));
        return response;
    }
}
