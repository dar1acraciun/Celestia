package org.celestia.backend.controller;

import org.celestia.backend.service.UserService;
import org.celestia.generated.model.UserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }


    @GetMapping("/me")
    public UserResponse getUser() {
        return userService.getUser();
    }

}
