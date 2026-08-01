package com.example.demo.notification;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service for sending transactional emails via JavaMailSender.
 * 
 * <p>Uses MimeMessage to support setting a custom sender name (e.g., "CohortLink").
 * If SMTP credentials are not configured, this will throw an exception when attempting
 * to send, which is caught by the NotificationDispatchListener so it doesn't block
 * other followers from receiving push notifications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.from.address:noreply@cohortlink.app}")
    private String fromAddress;

    @Value("${mail.from.name:CohortLink}")
    private String fromName;

    /**
     * Sends an email notification to a user about a new event.
     */
    public void sendNewEventEmail(String to, String name, String subject, Long eventId, String eventTitle, String clubName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(buildEmailBody(name, eventTitle, clubName, eventId), false); // plain text for simplicity

            mailSender.send(message);
            log.debug("[EmailService] Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("[EmailService] Failed to send email to {}", to, e);
            throw new RuntimeException("Failed to send email to " + to, e);
        }
    }

    /**
     * Sends a booking confirmation email to an attendee.
     */
    public void sendBookingConfirmedEmail(String to, String name,
                                          Long eventId, String eventTitle,
                                          String clubName, java.time.Instant eventTime) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject("You're in! Booking confirmed for " + eventTitle);
            helper.setText(buildBookingConfirmedBody(name, eventTitle, clubName, eventTime, eventId), false);

            mailSender.send(message);
            log.debug("[EmailService] Booking confirmation email sent to {}", to);
        } catch (Exception e) {
            log.error("[EmailService] Failed to send booking confirmation email to {}", to, e);
            throw new RuntimeException("Failed to send booking confirmation email to " + to, e);
        }
    }

    /**
     * Sends a booking cancellation email to an attendee.
     */
    public void sendBookingCancelledEmail(String to, String name,
                                          Long eventId, String eventTitle,
                                          String clubName, java.time.Instant eventTime) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject("Booking Cancelled — " + eventTitle);
            helper.setText(buildBookingCancelledBody(name, eventTitle, clubName, eventTime), false);

            mailSender.send(message);
            log.debug("[EmailService] Booking cancellation email sent to {}", to);
        } catch (Exception e) {
            log.error("[EmailService] Failed to send booking cancellation email to {}", to, e);
            throw new RuntimeException("Failed to send booking cancellation email to " + to, e);
        }
    }

    private String buildEmailBody(String name, String eventTitle, String clubName, Long eventId) {
        return String.format(
                "Hi %s,\n\n" +
                "Exciting news! %s just posted a new event: %s\n\n" +
                "Open the CohortLink app to secure your spot before it fills up!\n\n" +
                "Best regards,\n" +
                "The %s Team",
                name, clubName, eventTitle, fromName
        );
    }

    private String buildBookingConfirmedBody(String name, String eventTitle,
                                              String clubName, java.time.Instant eventTime,
                                              Long eventId) {
        return String.format(
                "Hi %s,\n\n" +
                "🎉 You're all set! Your booking for \"%s\" hosted by %s is confirmed.\n\n" +
                "📅 Event Date: %s\n\n" +
                "Open the CohortLink app to view your booking details and get directions.\n\n" +
                "See you there!\n" +
                "The %s Team",
                name, eventTitle, clubName,
                eventTime.toString(),
                fromName
        );
    }

    private String buildBookingCancelledBody(String name, String eventTitle,
                                              String clubName, java.time.Instant eventTime) {
        return String.format(
                "Hi %s,\n\n" +
                "Your booking for \"%s\" hosted by %s has been cancelled.\n\n" +
                "📅 Original Event Date: %s\n\n" +
                "Your spot has been released and is now available to other members.\n" +
                "We hope to see you at a future event!\n\n" +
                "Best regards,\n" +
                "The %s Team",
                name, eventTitle, clubName,
                eventTime.toString(),
                fromName
        );
    }
}
