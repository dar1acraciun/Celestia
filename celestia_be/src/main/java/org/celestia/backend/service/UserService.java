package org.celestia.backend.service;

import org.celestia.backend.mapper.UserMapper;
import org.celestia.backend.model.User;
import org.celestia.generated.model.UserResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public UserResponse getUser() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userMapper.toUserResponse(user);

    }
}
