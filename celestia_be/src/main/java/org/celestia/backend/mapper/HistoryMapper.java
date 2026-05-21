package org.celestia.backend.mapper;

import org.celestia.backend.model.HistoryObject;
import org.celestia.generated.model.HistoryEntryResponse;
import org.celestia.generated.model.HistoryListResponse;
import org.celestia.generated.model.HistoryRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface HistoryMapper {
    HistoryObject toHistoryObject(HistoryRequest historyRequest);

    HistoryEntryResponse toHistoryEntryResponse(HistoryObject historyObject);

    default OffsetDateTime map(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    @Mapping(target = "entries", source = "historyObjects")
    HistoryListResponse toHistoryListResponse(List<HistoryObject> historyObjects, long total, int page, int limit);

}
