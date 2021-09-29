#!/usr/bin/env bash 
# Dedicated script for loading data into database. Useful in cases when you need to roll server back to clean state, but don't want to reinstall API.
# FIXME: On the following 2 lines, replace map file download url and filename with something more suitable.
DB_pass="123"
pbf_filename="estonia.pbf"
pbf_download_url="https://download.geofabrik.de/europe/estonia-latest.osm.pbf"
cd ~
echo ""
# Next line finds if up to 1 day old map file already exists
if [[ $(find ~/ -mtime -1 -ls | grep $pbf_filename) ]]; then
 echo "Map was found"
else  # https://unix.stackexchange.com/questions/223503/how-to-use-grep-when-file-does-not-contain-the-string/223504
 echo "Map was not found or it needs to be updated"
 # SviMiki kaart on obf vormingus ning ei ühildu Geofabriku pbf-vorminguga
 # wget http://s2.svimik.com/osm/EE-HAR/Estonia_harjumaa_europe.obf -O ~/estonia.obf 
 wget $pbf_download_url -O ~/$pbf_filename
fi  # https://superuser.com/questions/1169664/bash-if-on-single-line

echo "Loading map file to database."
echo "This usually takes 30-45 min."
echo "This is last step of the script. After it completes, you can start the webserver."
~/osmosis/bin/osmosis --read-pbf-fast ~/$pbf_filename --write-apidb host="localhost" database="openstreetmap" user="$USER" password="$DB_pass" validateSchemaVersion="no" || {
 echo 'Starting Osmosis has failed. '
 echo 'Issue is usually fixed by reinstalling Osmosis.'
 cd ~
 rm -r osmosis  # Osmosise reinstalli sundimiseks.

 echo "Osmosis reinstall"
  cd ~ && wget https://github.com/openstreetmap/osmosis/releases/download/0.48.3/osmosis-0.48.3.tgz
  mkdir osmosis
  mv osmosis-0.48.3.tgz osmosis
  cd osmosis
  tar xvfz osmosis-0.48.3.tgz
  rm osmosis-0.48.3.tgz 
  chmod a+x bin/osmosis
  cd ~
  echo "Osmosis is installed"
  echo ""
  echo "2nd attempt to load map into database."
  echo "This takes usually 30-45 min."
  echo "This is last step of the script. After it completes, you can start the webserver."
 ~/osmosis/bin/osmosis --read-pbf-fast ~/$pbf_filename --write-apidb host="localhost" database="openstreetmap" user="$USER" password="$DB_pass" validateSchemaVersion="no" || {
 echo 'Osmosis reinstall didnt help. Please fix error and run manually following comamnd:'
 echo '~/osmosis/bin/osmosis --read-pbf-fast ~/$pbf_filename --write-apidb host="localhost" database="openstreetmap" user="$USER" password="$DB_pass" validateSchemaVersion="no"'
 echo 'After that everything should be fine and you can run script with command "./run.sh"'
 exit 1
} }
# Ajakulu terve Eestiga on 30-45 min.
# Tagasivõtmiseks on käsk bundle exec rake db:drop

# Kontrolli, et oled kaustas ~/openstreetmap-website/
# bundle exec rails server -b 0.0.0.0 # Runs at foreground
# firefox http://localhost:3000/ &

echo "Website has been installed"
echo 'To start web server, use command "./run.sh"'
