package org.celestia.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NasaService {

    private static final Logger log = LoggerFactory.getLogger(NasaService.class);

    private static final String HIPS2FITS_API = "https://alasky.u-strasbg.fr/hips-image-services/hips2fits";
    private static final int FIELD_OF_VIEW = 20;
    private static final int IMAGE_SIZE    = 600;

    private static final List<String[]> SURVEYS = List.of(
            new String[]{"CDS/P/DSS2/red",  "Optical (DSS2 Red)"},
            new String[]{"CDS/P/DSS2/blue", "Optical (DSS2 Blue)"},
            new String[]{"CDS/P/2MASS/J",   "Near-Infrared (2MASS)"}
    );

    private final CloudinaryService cloudinaryService;

    public NasaService(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    public record NasaImage(String url, String title, String description) {}
    public record NasaResult(List<NasaImage> images, String context) {}

    public NasaResult fetchConstellationData(String constellationName) {
        List<NasaImage> images = new ArrayList<>();

        for (String[] survey : SURVEYS) {
            if (images.size() >= 3) break;
            try {
                String hipsUrl  = buildHipsUrl(constellationName, survey[0]);
                String publicId = "celestia/constellations/"
                        + constellationName.toLowerCase().replace(" ", "_")
                        + "_" + survey[1].toLowerCase().replace(" ", "_").replace("(", "").replace(")", "");

                String cloudinaryUrl = cloudinaryService.uploadFromUrl(hipsUrl, publicId);
                images.add(new NasaImage(cloudinaryUrl, constellationName + " — " + survey[1], ""));
                log.info("HiPS2FITS uploaded {} / {} → {}", constellationName, survey[1], cloudinaryUrl);
            } catch (Exception e) {
                log.warn("HiPS2FITS failed for {} / {}: {}", constellationName, survey[1], e.getMessage());
            }
        }

        log.info("HiPS2FITS: {} images for {}", images.size(), constellationName);
        return new NasaResult(images, "");
    }

    private String buildHipsUrl(String object, String hips) {
        return HIPS2FITS_API
                + "?hips="       + hips.replace("/", "%2F")
                + "&object="     + object.replace(" ", "+")
                + "&width="      + IMAGE_SIZE
                + "&height="     + IMAGE_SIZE
                + "&fov="        + FIELD_OF_VIEW
                + "&projection=" + "TAN"
                + "&coordsys="   + "icrs"
                + "&format=jpg";
    }
}
