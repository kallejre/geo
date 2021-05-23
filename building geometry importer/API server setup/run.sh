#!/usr/bin/env bash 
port="4443"
echo "Default OSM user credentials:"
echo "User: testAdmin"
echo "Password:   Passw0rd"
echo "Server address: $(ip a | grep global | awk '{print substr($2, 1, length($2)-3)}'):$port"
cd ~/openstreetmap-website
# Since server starts much slower than firefox, then order of these two commands have little effect.
firefox http://localhost:$port/user/testAdmin &
bundle exec rails server -b 0.0.0.0 -p $port >> /dev/null # Runs at foreground
# /dev/null at the end of running server makes it much faster as less text is sent to console


