package com.example.demo.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Configures the AWS SDK v2 {@link S3Presigner} bean used for generating
 * presigned PUT URLs for direct-to-S3 uploads.
 *
 * <p>Credentials and region are injected from environment variables so they
 * are never hardcoded in source control.
 */
@Slf4j
@Configuration
public class AwsS3Config {

    @Value("${aws.region:ap-south-1}")
    private String region;

    @Value("${aws.access-key:}")
    private String accessKey;

    @Value("${aws.secret-key:}")
    private String secretKey;

    @Bean
    public S3Presigner s3Presigner() {
        if (accessKey != null && !accessKey.isBlank()
                && secretKey != null && !secretKey.isBlank()) {
            log.info("Initialising S3Presigner with explicit credentials for region={}", region);
            return S3Presigner.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
        }

        // Fallback: use the AWS default credential chain (IAM role, environment, etc.)
        log.info("AWS_ACCESS_KEY_ID not set — using default credential chain for S3Presigner");
        return S3Presigner.builder()
                .region(Region.of(region))
                .build();
    }
}
