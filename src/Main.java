import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;

/**
 * A simple HTTP server that calculates the average of a list of integers sent
 * in a JSON array via POST request.
 */
public class Main {
    public static void main(String[] args) throws Exception {
        // Create HTTP server on port 8199
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", 8199), 0);
        // Health check endpoint
        server.createContext("/health", exchange -> {
            if ("GET".equals(exchange.getRequestMethod())) {
                String response = "OK";
                exchange.getResponseHeaders().add("Content-Type", "text/plain");
                exchange.sendResponseHeaders(200, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
            } else {
                // If not a GET request, respond with 405 Method Not Allowed
                exchange.sendResponseHeaders(405, -1);
            }
        });

        // Main base endpoint to calculate average
        server.createContext("/", exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes());

                // Parse simple JSON manually
                body = body.replaceAll("[^0-9,]", "");
                String[] parts = body.split(",");

                // Calculate sum
                int sum = 0;
                for (String num : parts)
                    sum += Integer.parseInt(num);

                // Calculate average and floor it
                double avg = sum / parts.length;
                int avgFloored = (int) Math.floor(avg);

                // Send response with average as plain text
                exchange.getResponseHeaders().add("Content-Type", "text/plain");
                exchange.sendResponseHeaders(200, String.valueOf(avgFloored).length());
                OutputStream os = exchange.getResponseBody();
                os.write(String.valueOf(avgFloored).getBytes());
                os.close();
            } else {
                // If not a POST request, respond with 405 Method Not Allowed
                exchange.sendResponseHeaders(405, -1);
            }
        });
        server.start();
        System.out.println("Server running on port 8199");
    }
}
