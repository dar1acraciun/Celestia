package org.celestia.backend.controller;

import org.celestia.backend.service.CloudinaryService;
import org.celestia.generated.model.ImageUploadResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final CloudinaryService cloudinaryService;

    public ImageController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/upload")
    public ImageUploadResponse upload(@RequestParam("file") MultipartFile file) throws IOException {
        String url = cloudinaryService.upload(file);
        ImageUploadResponse response = new ImageUploadResponse();
        response.setUrl(url);
        return response;
    }
}