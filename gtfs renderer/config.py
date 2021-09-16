interface='127.0.0.1'
port=8080
# Portrange defines multiple ports to be used for load balancer.
portlist={8080, 8081,8082, 8083}
protocol="http"
URL=f"{protocol}://{interface}:{port}/{{z}}/{{x}}/{{y}}"
