package com.example.demo;

// DataInitializer is intentionally disabled — annotated with @Profile("disabled")
// so it will never activate under any normal Spring profile.
// Remove @Profile("disabled") temporarily if you need to re-seed the database.

import com.example.demo.entity.Booking;
import com.example.demo.entity.Club;
import com.example.demo.entity.Event;
import com.example.demo.entity.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.ClubRepository;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Seeds the database with sample data for Users, Clubs, Events, and Bookings.
 * Checks each table individually before seeding.
 */
@Component
@Profile("disabled")   // Never activates — remove this line to re-enable seeding
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository    userRepository;
    private final ClubRepository    clubRepository;
    private final EventRepository   eventRepository;
    private final BookingRepository bookingRepository;

    @Override
    public void run(String... args) {
        log.info("DataInitializer: Checking database ...");

        // --------------------------------------------------
        // 1. USERS
        // --------------------------------------------------
        if (userRepository.count() == 0) {
            log.info("DataInitializer: Seeding Users...");
            userRepository.save(User.builder().firebaseUid("firebase-uid-alice-001").email("alice@cohortlink.dev").name("Alice Smith").build());
            userRepository.save(User.builder().firebaseUid("firebase-uid-bob-002").email("bob@cohortlink.dev").name("Bob Jones").build());
            userRepository.save(User.builder().firebaseUid("firebase-uid-carol-003").email("carol@cohortlink.dev").name("Carol Williams").build());
            userRepository.save(User.builder().firebaseUid("firebase-uid-dave-004").email("dave@cohortlink.dev").name("Dave Brown").build());
            userRepository.save(User.builder().firebaseUid("firebase-uid-eve-005").email("eve@cohortlink.dev").name("Eve Davis").build());
            log.info("DataInitializer: {} Users saved.", userRepository.count());
        }

        // Fetch users to use in subsequent seeding
        User alice = userRepository.findByFirebaseUid("firebase-uid-alice-001").orElse(null);
        User bob   = userRepository.findByFirebaseUid("firebase-uid-bob-002").orElse(null);
        User carol = userRepository.findByFirebaseUid("firebase-uid-carol-003").orElse(null);
        User dave  = userRepository.findByFirebaseUid("firebase-uid-dave-004").orElse(null);
        User eve   = userRepository.findByFirebaseUid("firebase-uid-eve-005").orElse(null);

        // --------------------------------------------------
        // 2. CLUBS
        // --------------------------------------------------
        if (clubRepository.count() == 0) {
            log.info("DataInitializer: Seeding Clubs...");
            if (alice != null) clubRepository.save(Club.builder().manager(alice).name("Tech Innovators Club").bio("A community for passionate technologists, hackers, and builders.").profileImageUrl("https://picsum.photos/seed/techclub/400/400").category("Technology").city("Bengaluru").latitude(12.9716).longitude(77.5945).build());
            if (bob != null) clubRepository.save(Club.builder().manager(bob).name("Creative Design Society").bio("Where art meets code - UI/UX, graphic design, and creative thinking.").profileImageUrl("https://picsum.photos/seed/designclub/400/400").category("Arts & Design").city("Mumbai").latitude(19.0760).longitude(72.8777).build());
            if (carol != null) clubRepository.save(Club.builder().manager(carol).name("Data Science Guild").bio("Exploring AI, ML, data pipelines, and analytics together.").profileImageUrl("https://picsum.photos/seed/dataclub/400/400").category("Science").city("Hyderabad").latitude(17.3850).longitude(78.4867).build());
            log.info("DataInitializer: {} Clubs saved.", clubRepository.count());
        }

        // Fetch clubs to use in subsequent seeding
        List<Club> allClubs = clubRepository.findAll();
        Club techClub = allClubs.stream().filter(c -> "Tech Innovators Club".equals(c.getName())).findFirst().orElse(null);
        Club designClub = allClubs.stream().filter(c -> "Creative Design Society".equals(c.getName())).findFirst().orElse(null);
        Club dataClub = allClubs.stream().filter(c -> "Data Science Guild".equals(c.getName())).findFirst().orElse(null);

        // --------------------------------------------------
        // 3. EVENTS
        // --------------------------------------------------
        if (eventRepository.count() == 0) {
            log.info("DataInitializer: Seeding Events...");
            if (techClub == null) {
                eventRepository.save(Event.builder().club(techClub).title("Annual Hackathon 2026").description("24-hour hackathon to build innovative solutions. Prizes worth $5000!").imageUrl("https://picsum.photos/seed/hackathon/800/600").locationName("Main Auditorium, Block A").latitude(12.9716).longitude(77.5945).eventTime(Instant.parse("2026-07-15T09:00:00Z")).maxCapacity(100).remainingSlots(100).build());
                eventRepository.save(Event.builder().club(techClub).title("Spring Boot Masterclass").description("Deep-dive into Spring Boot 3 with hands-on REST API development.").imageUrl("https://picsum.photos/seed/springboot/800/600").locationName("Lab 204, Tech Building").latitude(12.9716).longitude(77.5945).eventTime(Instant.parse("2026-07-22T14:00:00Z")).maxCapacity(40).remainingSlots(40).build());
            }
            if (designClub != null) {
                eventRepository.save(Event.builder().club(designClub).title("UI/UX Bootcamp").description("Hands-on Figma workshop covering design systems and prototyping.").imageUrl("https://picsum.photos/seed/uiux/800/600").locationName("Design Studio, Floor 3").latitude(12.9716).longitude(77.5945).eventTime(Instant.parse("2026-07-18T10:00:00Z")).maxCapacity(30).remainingSlots(30).build());
                eventRepository.save(Event.builder().club(designClub).title("Branding & Identity Talk").description("Guest lecture on building powerful brand identities from scratch.").imageUrl("https://picsum.photos/seed/branding/800/600").locationName("Seminar Hall B").latitude(12.9716).longitude(77.5945).eventTime(Instant.parse("2026-08-05T16:00:00Z")).maxCapacity(60).remainingSlots(60).build());
            }
            if (dataClub != null) {
                eventRepository.save(Event.builder().club(dataClub).title("Intro to Machine Learning").description("Beginner-friendly ML workshop using Python and scikit-learn.").imageUrl("https://picsum.photos/seed/ml/800/600").locationName("Computer Lab 1, Block B").latitude(12.9716).longitude(77.5945).eventTime(Instant.parse("2026-07-25T11:00:00Z")).maxCapacity(50).remainingSlots(50).build());
                eventRepository.save(Event.builder().club(dataClub).title("Data Engineering with Apache Spark").description("A practical session on processing big data with Spark.").imageUrl("https://picsum.photos/seed/spark/800/600").locationName("Online (Zoom)").eventTime(Instant.parse("2026-08-10T15:00:00Z")).maxCapacity(200).remainingSlots(200).build());
            }
            log.info("DataInitializer: {} Events saved.", eventRepository.count());
        }

        // Fetch events to use in subsequent seeding
        List<Event> allEvents = eventRepository.findAll();
        Event hackathon = allEvents.stream().filter(e -> "Annual Hackathon 2026".equals(e.getTitle())).findFirst().orElse(null);
        Event webWorkshop = allEvents.stream().filter(e -> "Spring Boot Masterclass".equals(e.getTitle())).findFirst().orElse(null);
        Event uiBootcamp = allEvents.stream().filter(e -> "UI/UX Bootcamp".equals(e.getTitle())).findFirst().orElse(null);
        Event brandingTalk = allEvents.stream().filter(e -> "Branding & Identity Talk".equals(e.getTitle())).findFirst().orElse(null);
        Event mlWorkshop = allEvents.stream().filter(e -> "Intro to Machine Learning".equals(e.getTitle())).findFirst().orElse(null);
        Event dataTalk = allEvents.stream().filter(e -> "Data Engineering with Apache Spark".equals(e.getTitle())).findFirst().orElse(null);

        // --------------------------------------------------
        // 4. BOOKINGS
        // --------------------------------------------------
        if (bookingRepository.count() == 0) {
            log.info("DataInitializer: Seeding Bookings...");
            if (alice != null && hackathon != null) bookingRepository.save(Booking.builder().user(alice).event(hackathon).status("CONFIRMED").build());
            if (alice != null && webWorkshop != null) bookingRepository.save(Booking.builder().user(alice).event(webWorkshop).status("CONFIRMED").build());
            if (bob != null && hackathon != null) bookingRepository.save(Booking.builder().user(bob).event(hackathon).status("CONFIRMED").build());
            if (bob != null && uiBootcamp != null) bookingRepository.save(Booking.builder().user(bob).event(uiBootcamp).status("CONFIRMED").build());
            if (carol != null && mlWorkshop != null) bookingRepository.save(Booking.builder().user(carol).event(mlWorkshop).status("CONFIRMED").build());
            if (carol != null && dataTalk != null) bookingRepository.save(Booking.builder().user(carol).event(dataTalk).status("CONFIRMED").build());
            if (dave != null && brandingTalk != null) bookingRepository.save(Booking.builder().user(dave).event(brandingTalk).status("CONFIRMED").build());
            if (dave != null && dataTalk != null) bookingRepository.save(Booking.builder().user(dave).event(dataTalk).status("WAITLISTED").build());
            if (eve != null && webWorkshop != null) bookingRepository.save(Booking.builder().user(eve).event(webWorkshop).status("CONFIRMED").build());
            if (eve != null && mlWorkshop != null) bookingRepository.save(Booking.builder().user(eve).event(mlWorkshop).status("CONFIRMED").build());
            log.info("DataInitializer: {} Bookings saved.", bookingRepository.count());
        }

        log.info("DataInitializer: Initialization checks complete!");
    }
}
