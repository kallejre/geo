#!/usr/bin/env bash 
# English version of install.sh
cd /home/$USER
#https://unix.stackexchange.com/questions/230673

# FIXME: On the following 2 lines, replace map file download url and filename with something more suitable.
pbf_filename="estonia.pbf"
pbf_download_url="https://download.geofabrik.de/europe/estonia-latest.osm.pbf"


DB_pass="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16 ; echo '')"
if [ "$EUID" -eq 0 ]
  then echo "Running this script as root will cause errors while setting up database. You will be asked to type password few times."
  exit
fi
echo "Script started as user $USER."
echo "During running this script, root password will be asked few times."
echo "Would you like to install Josm and Osmium?"
read -p "Josm is map editor and Osmium is tool for processing map data. (y/N) " -n 1 -r josm
echo  ""  # https://stackoverflow.com/questions/1885525
# Allalaadimise osa.
echo "Sudo password is asked for APT command"
echo "Before you continue, make sure that APT is configured to use best available download server."

sudo apt update
sudo apt upgrade -y || {
 echo "Update failed."
 echo "Error was probably caused by Ubuntu's own automatic update tool."
 exit 1 
 }


sudo apt install git ruby2.7 libruby2.7 ruby2.7-dev \
                     libmagickwand-dev libxml2-dev libxslt1-dev nodejs \
                     apache2 apache2-dev build-essential git-core firefox-geckodriver \
                     postgresql postgresql-contrib libpq-dev libsasl2-dev osmosis\
                     imagemagick libffi-dev libgd-dev libarchive-dev libbz2-dev yarnpkg -y
if [[ $josm =~ ^[Yy]$ ]]
then
    sudo apt install josm osmium-tool -y  # Josm - kaardiredaktor, osmium - analüütiline tööriist
    echo "Josm + Osmium are installed"
fi
sudo apt autoremove -y
sudo gem2.7 install bundler

cd /home/$USER
# Osmosise paigaldamine
# Aptiga tuleb automaatselt kaasa Osmosis 0.47-4, aga vaja on versiooni 0.48
# Samas nõuab osmosis palju (200MB) lisamooduleid, s.h Java RE, 
# mistõttu on mõistlik 0.47 koos sõltuvustega eraldi apt-ga installida 
echo "Installing osmosis"
if [ ! -d ~/osmosis ];then
 cd ~ && wget https://github.com/openstreetmap/osmosis/releases/download/0.48.3/osmosis-0.48.3.tgz
 mkdir osmosis
 mv osmosis-0.48.3.tgz osmosis
 cd osmosis
 tar xvfz osmosis-0.48.3.tgz 
 rm osmosis-0.48.3.tgz 
 chmod a+x bin/osmosis
 cd ~
 echo "Osmosis installed"
else
 echo "Osmosis was already installed"
fi



# Next line finds if up to 1 day old map file already exists
if [[ $(find ~/ -mtime -1 -ls | grep $pbf_filename) ]]; then
 echo "Map was found"
else  # https://unix.stackexchange.com/questions/223503/how-to-use-grep-when-file-does-not-contain-the-string/223504
 echo "Map was not found or it needs to be updated"
 # SviMiki kaart on obf vormingus ning ei ühildu Geofabriku pbf-vorminguga
 # wget http://s2.svimik.com/osm/EE-HAR/Estonia_harjumaa_europe.obf -O ~/estonia.obf 
 wget $pbf_download_url -O ~/$pbf_filename
fi  # https://superuser.com/questions/1169664/bash-if-on-single-line
echo "Install completed."

echo "Downloading OSM website"
echo "soon password will be asked"
git clone --depth=1 https://github.com/openstreetmap/openstreetmap-website.git
cd /home/$USER/openstreetmap-website
bundle install  # Asks sudo password
bundle exec rake yarn:install
touch config/settings.local.yml
# bundle exec rake db:drop

# Database setup
# Following line is useful for rolling back and removing DB.
# bundle exec rake db:drop
cd /home/$USER/openstreetmap-website
cp config/example.storage.yml config/storage.yml
cp config/example.database.yml config/database.yml

# DB kasutajanimi peaks olema sama mis süsteemi kasutajal. [https://gis.stackexchange.com/questions/336151]
sudo -u postgres createuser -s $USER
psql -d openstreetmap -c "ALTER USER \"$USER\" WITH PASSWORD '$DB_pass'"
cd /home/$USER/openstreetmap-website
bundle exec rake db:create
psql -d openstreetmap -c "CREATE EXTENSION btree_gist"
psql -d openstreetmap -f db/functions/functions.sql
bundle exec rake db:migrate
bundle exec rake test:db || {
  echo "DB test failed."
  echo "As of March 2021 issue was caused by license conflict between Mimemagic ja Rails libraries. OSM website is not significantly affected."
  read  -n 1 -p "To abort, press ctrl+C, To continue, press any other key." asd
  echo "" 
 }
echo "DB check passed."

# sudo sh -c "echo 'local   openstreetmap   $USER         trust' >> /etc/postgresql/$(ls /etc/postgresql)/main/pg_hba.conf"
# service postgresql restart


# Peale kasutaja loomist
# Järgnev kirjutatakse konsooli
#Viide https://github.com/openstreetmap/openstreetmap-website/pull/3030/files#diff-c61a903a1201b0c7f076b0270377c20390c26f655ce63689d7d843296fcf63f3R34
cd ~/openstreetmap-website/
# Järgnev rida ei tohiks parooli krüpteerimise nõude tõttu töötada, aga töötab ikka.
bundle exec rails runner 'admin = User.find_or_initialize_by(:email => "testAdmin@osm.dev")
admin.update_attributes(
  :email => "testAdmin@osm.dev",
  :email_valid => true,
  :display_name => "testAdmin",
  :description => "testAdmin konto OSMi skripti tarbeks",
  :home_lat => "59.39550",
  :home_lon => "24.66430",
  :status => "confirmed",
  :terms_seen => true,
  :terms_agreed => Time.now.getutc,
  :data_public => true,
  :pass_crypt => "Passw0rd",
  :pass_crypt_confirmation => "Passw0rd",
)
admin.save!

admin.roles.create(:role => "administrator", :granter_id => admin.id)
admin.roles.create(:role => "moderator", :granter_id => admin.id)
admin.save!' || {
echo ""
echo "User set-up failed. This is usually caused when user already exists."
}

psql -d openstreetmap -c "ALTER USER \"$USER\" WITH PASSWORD '$DB_pass'"
echo ""
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
