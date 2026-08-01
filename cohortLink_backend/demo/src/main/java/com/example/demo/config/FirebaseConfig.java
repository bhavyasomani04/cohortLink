package com.example.demo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Initialises the Firebase Admin SDK as a Spring-managed singleton.
 *
 * <p>The service-account JSON file path is read from the
 * {@code FIREBASE_SERVICE_ACCOUNT_PATH} environment variable (mapped to the
 * {@code firebase.service-account-path} property). If not supplied the app will
 * start but all requests that reach the Firebase filter will be rejected with
 * an appropriate error log rather than a silent NPE.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    /**
     * Initialises {@link FirebaseApp} exactly once and exposes
     * {@link FirebaseAuth} as a bean so it can be injected anywhere.
     */
    @Bean
    public FirebaseAuth firebaseAuth() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseOptions options;

            if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                log.info("Initialising Firebase with service account: {}", serviceAccountPath);
                try (InputStream serviceAccount = new FileInputStream(serviceAccountPath)) {
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .build();
                }
            } else {
                // Fallback: use Application Default Credentials (works on GCP, Cloud Run, etc.)
                log.warn("FIREBASE_SERVICE_ACCOUNT_PATH not set — falling back to Application Default Credentials");
                options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();
            }

            FirebaseApp.initializeApp(options);
        }

        return FirebaseAuth.getInstance();
    }
}
