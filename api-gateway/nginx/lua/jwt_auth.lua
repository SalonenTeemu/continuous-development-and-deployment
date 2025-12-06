local jwt = require "resty.jwt"

local function verify_jwt()
    local auth_header = ngx.var.http_authorization
    if not auth_header then
        ngx.status = 401
        ngx.say("Missing Authorization header")
        ngx.exit(401)
    end

    local _, _, token = string.find(auth_header, "Bearer%s+(.+)")
    if not token then
        ngx.status = 401
        ngx.say("Malformed Authorization header")
        ngx.exit(401)
    end

    local jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret then
        ngx.status = 500
        ngx.say("JWT_SECRET environment variable not set")
        ngx.exit(500)
    end

    local verified = jwt:verify(jwt_secret, token)
    if not verified.verified then
        ngx.status = 401
        ngx.say("Invalid or expired token")
        ngx.exit(401)
    end
end

verify_jwt()
