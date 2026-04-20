package org.celestia.backend.mapper;

import org.celestia.backend.model.User;
import org.celestia.generated.model.RegisterRequest;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface AuthMapper {
    User toUser(RegisterRequest request);
}