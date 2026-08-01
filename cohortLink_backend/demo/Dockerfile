# Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy the Gradle wrapper and configuration files
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Ensure gradlew is executable and download dependencies (caches them)
RUN chmod +x gradlew

# Copy source code
COPY src src

# Build the application (skipping tests for faster build in this step, but you can enable them)
RUN ./gradlew build -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar from the builder stage
# Spring Boot typically generates a plain jar and an executable jar. We want the executable one.
COPY --from=builder /app/build/libs/*SNAPSHOT.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
