# Antigravity Workspace Context
SEARCH FOR SKILLS IN .AGENTS DIRECTORY/ IN CURRENT WORKSPACE
## 🎯 Project Overview
This repository contains **cohortLink**, a modern Spring Boot RESTful API backend for a social networking and community platform. Based on its data model, the application allows users to create and manage clubs, host and book events with capacity limits, and engage through a social feed by creating posts with images, leaving comments, and liking content.

## 🛠 Tech Stack
- **Language:** Java 21 (Strictly enforced via Gradle Toolchain)
- **Framework:** Spring Boot 3.x
- **Build Tool:** Gradle (Using Groovy DSL, strictly run via `./gradlew`)
- **Database:** PostgreSQL (via Docker `docker-compose.yml`) / H2 (for local testing) file location @ E:\cohortLink\docker-compose.yml
- **ORM:** Spring Data JPA / Hibernate
- **Boilerplate Reduction:** Lombok

## 🏗 Architecture & Structure
The project follows a standard layered architecture:
1. **Controllers** (`src/main/java/.../controller/`): Handle HTTP requests, input validation, and route to services.
2. **Services** (`src/main/java/.../service/`): Contain core business logic.
3. **Repositories** (`src/main/java/.../repository/`): Interfaces extending `ListCrudRepository` or `JpaRepository` for data access.
4. **Entities** (`src/main/java/.../entity/`): JPA annotated data models.

## 🛑 Strict AI Coding Directives
When interacting with this workspace or generating code, AI agents MUST follow these rules:
1. **Java Version:** Always write syntax compatible with Java 21 (e.g., Records, Pattern Matching, Text Blocks). Never downgrade syntax to Java 17 or Java 8.
2. **Dependency Injection:** Strictly use Constructor Injection via Lombok's `@RequiredArgsConstructor`. Do NOT use `@Autowired` on fields.
3. **Gradle Over Maven:** Never suggest Maven commands (`mvn`). Always use `./gradlew` commands.
4. **Lombok Usage:** Always use `@Data`, `@Builder`, `@NoArgsConstructor`, and `@AllArgsConstructor` on entities and DTOs to reduce boilerplate.
5. **Spring Boot 3 Standards:** Use `jakarta.*` imports instead of `javax.*`. Use `ListCrudRepository` instead of the older `CrudRepository` where applicable.
6. **Properties:** Database configurations live in `src/main/resources/application.properties`.
