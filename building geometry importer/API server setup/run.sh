#!/usr/bin/env bash 
# Kontrolli, et oled kaustas ~/openstreetmap-website/
echo "Default OSM user credentials:"
echo "User: testAdmin"
echo "Password:   Passw0rd"
cd ~/openstreetmap-website
firefox http://localhost:4443/user/testAdmin &
bundle exec rails server -b 0.0.0.0 -p 4443 >> /dev/null # Runs at foreground
# Seoses sellega, et serveri käivitumine on palju aeglasem kui Firefoxi avanemine, pole käskude järjekorral olulist mõju.
# /dev/null serveri käsu järel keelab logide salvestamise, muutes kaardirakenduse andmekihi märgatavalt kiiremaks.

