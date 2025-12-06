# Use the official OpenResty image as the base image
FROM openresty/openresty:alpine

# Install system dependencies
RUN apk add --no-cache bash curl git make build-base perl

# Install lua-resty-jwt via OpenResty Package Manager (opm)
RUN opm get SkyLothar/lua-resty-jwt

# Remove default Nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
RUN rm -f /usr/local/openresty/nginx/conf.d/default.conf

# Copy Nginx config and Lua scripts
COPY ./nginx/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY ./nginx/conf.d /etc/nginx/conf.d
COPY ./nginx/lua /etc/nginx/lua

# Start OpenResty in the foreground
CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
