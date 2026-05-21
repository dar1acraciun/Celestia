package org.celestia.backend.mapper;

import org.celestia.backend.model.User;
import org.celestia.generated.model.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface UserMapper {

    UserResponse toUserResponse(User user);

    default OffsetDateTime map(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }
}
