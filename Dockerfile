FROM alpine/java:21-jre

# Install curl inside the container
RUN apk add --no-cache curl

WORKDIR /app
COPY build/ .

EXPOSE 8199

CMD ["sh", "-c", "java -cp . Main"]
