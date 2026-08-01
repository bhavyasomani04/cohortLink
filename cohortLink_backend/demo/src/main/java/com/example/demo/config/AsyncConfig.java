package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Dedicated thread pool for all {@code @Async} notification event listeners.
 *
 * <p>Isolates notification fan-out work from the HTTP request threads.
 * If the notification queue fills up (e.g. email provider is slow),
 * {@link ThreadPoolExecutor.CallerRunsPolicy} ensures we never silently
 * drop an event — it degrades to synchronous execution in the caller thread
 * as a last resort, rather than rejecting the task.
 *
 * <p>All {@code @Async("notificationExecutor")} annotated listeners will
 * use this pool. Threads are named {@code notif-N} for easy identification
 * in thread dumps and APM tools.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);       // Always-alive threads for steady load
        executor.setMaxPoolSize(16);       // Burst capacity for large fan-outs
        executor.setQueueCapacity(500);    // Buffer — absorbs spikes without blocking
        executor.setThreadNamePrefix("notif-");
        // On queue overflow: run in calling thread — never drop an audit event
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
