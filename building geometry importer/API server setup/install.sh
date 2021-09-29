#!/usr/bin/env bash 
#Estonian version of install.sh
cd /home/$USER
#https://unix.stackexchange.com/questions/230673
DB_pass="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16 ; echo '')"
echo "$DB_pass"
if [ "$EUID" -eq 0 ]
  then echo "Skripti käivitamisel juurkasutajana tekib probleeme OSM serveri DB seadistamisel. Samas, sudo õigustes tegevuste jaoks (apt update; bundle install) küsitakse paar korda parooli."
  exit
fi
echo "Käivitamine kasutajana $USER. Skripti testiti kasutajanime user alt."
echo "Käesoleva skripti töö jooksul küsitakse paar korda sudo parooli"
echo "Kas installida ka Josm ja Osmium?"
read -p "Josm on kaardiredaktor ning Osmium tööriist OSM andmete töötlemiseks. (y/N) " -n 1 -r josm
echo  ""  # https://stackoverflow.com/questions/1885525
# Allalaadimise osa.
echo "Sudo parool apt-get installi jaoks"
echo "Enne jätkamist palun veendu, et apt on seatud kasutama parimat saadaolevat uuenduste serverit."

sudo apt update
sudo apt upgrade -y || {
 echo "Uuendamine ebaõnnestus."
 echo "Skripti testimisel põhjustas tõrget Ubuntu enda automaatsete uuenduste tööriista samaaegne töötamine."
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
    echo "Josm + Osmium on installitud"
fi
sudo apt autoremove -y
sudo gem2.7 install bundler

cd /home/$USER
# Osmosise paigaldamine
# Aptiga tuleb automaatselt kaasa Osmosis 0.47-4, aga vaja on versiooni 0.48
# Samas nõuab osmosis palju (200MB) lisamooduleid, s.h Java RE, 
# mistõttu on mõistlik 0.47 koos sõltuvustega eraldi apt-ga installida 
echo "Osmosise installimine"
if [ ! -d ~/osmosis ];then
 cd ~ && wget https://github.com/openstreetmap/osmosis/releases/download/0.48.3/osmosis-0.48.3.tgz
 mkdir osmosis
 mv osmosis-0.48.3.tgz osmosis
 cd osmosis
 tar xvfz osmosis-0.48.3.tgz 
 rm osmosis-0.48.3.tgz 
 chmod a+x bin/osmosis
 cd ~
 echo "Osmosis installitud"
else
 echo "Osmosis on olemas"
fi



# Järgmisel real kontrollitakse, kas grep leiab kuni 1 päeva vanuse Eesti kaardi faili
if [[ $(find ~/ -mtime -1 -ls | grep estonia.pbf) ]]; then
 echo "Eesti kaart leiti"
else  # https://unix.stackexchange.com/questions/223503/how-to-use-grep-when-file-does-not-contain-the-string/223504
 echo "Eesti kaarti ei leitud või võiks seda uuendada"
 # SviMiki kaart on obf vormingus ning ei ühildu Geofabriku pbf-vorminguga
 # wget http://s2.svimik.com/osm/EE-HAR/Estonia_harjumaa_europe.obf -O ~/estonia.obf 
 wget https://download.geofabrik.de/europe/estonia-latest.osm.pbf -O ~/estonia.pbf
fi  # https://superuser.com/questions/1169664/bash-if-on-single-line
echo "Installid tehtud."

echo "OSM veebilehe allalaadimine"
echo "Varsti küsitakse parooli"
git clone --depth=1 https://github.com/openstreetmap/openstreetmap-website.git
cd /home/$USER/openstreetmap-website
bundle install  # Küsib sudo jaoks luba
bundle exec rake yarn:install
touch config/settings.local.yml
# bundle exec rake db:drop

# Andmebaasi seadistamine
# Esiteks käsk juhuks, kui on vaja baasi koostamine tagasi võtta.
# bundle exec rake db:drop
cd /home/$USER/openstreetmap-website
cp config/example.storage.yml config/storage.yml
cp config/example.database.yml config/database.yml

#read  -n 1 -p "Vajuta ctrl+C." asd

# DB kasutajanimi peaks olema sama mis süsteemi kasutajal. [https://gis.stackexchange.com/questions/336151]
sudo -u postgres createuser -s $USER
psql -d openstreetmap -c "ALTER USER \"$USER\" WITH PASSWORD '$DB_pass'"
cd /home/$USER/openstreetmap-website
bundle exec rake db:create
psql -d openstreetmap -c "CREATE EXTENSION btree_gist"
psql -d openstreetmap -f db/functions/functions.sql
bundle exec rake db:migrate
bundle exec rails test:all || {
  echo "DB test ebaõnnestus."
  echo "2021 märtsi seisuga põhjustab teadaolevat viga litsentsiprobleem teekide Mimemagic ja Rails vahel. OSM veebilehe põhifunktsionaalsus ei ole häiritud."
  read  -n 1 -p "Katkestamiseks vajuta ctrl+C, jätkamiseks mõnda muud klahvi." asd
  echo "" 
 }
echo "DB kontrollitud."

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
echo "Kasutaja seadistamisel tekkis tõrge. Nii võib juhtuda, kui kasutaja on varem juba seadistatud."
}

psql -d openstreetmap -c "ALTER USER \"$USER\" WITH PASSWORD '$DB_pass'"
echo ""
echo "Algab kaardifaili andmebaasi laadimine."
echo "Tegevuse ajakulu on 30-45 min."
echo "See on skripti viimane samm, peale seda võib serveri käivitada."
~/osmosis/bin/osmosis --read-pbf-fast ~/estonia.pbf --write-apidb host="localhost" database="openstreetmap" user="$USER" password="$DB_pass" validateSchemaVersion="no" || {
 echo 'Osmosise käivitamine ebaõnnestus. '
 echo 'Vea parandamiseks aitab tavaliselt Osmosise kustutamine ja uuesti paigaldamine.'
 cd ~
 rm -r osmosis  # Osmosise reinstalli sundimiseks.

 echo "Osmosise uuesti installimine"
  cd ~ && wget https://github.com/openstreetmap/osmosis/releases/download/0.48.3/osmosis-0.48.3.tgz
  mkdir osmosis
  mv osmosis-0.48.3.tgz osmosis
  cd osmosis
  tar xvfz osmosis-0.48.3.tgz
  rm osmosis-0.48.3.tgz 
  chmod a+x bin/osmosis
  cd ~
  echo "Osmosis installitud"
  echo ""
  echo "Algab kaardifaili andmebaasi laadimise 2. katse."
  echo "Tegevuse ajakulu on 30-45 min."
  echo "See on skripti viimane samm, peale seda võib serveri käivitada."
 ~/osmosis/bin/osmosis --read-pbf-fast ~/estonia.pbf --write-apidb host="localhost" database="openstreetmap" user="$USER" password="$DB_pass" validateSchemaVersion="no" || {
 echo 'Osmosise reinstall ei aidanud. Paranda tõrge ja käivita käsitsi järgnev käsk:'
 echo '~/osmosis/bin/osmosis --read-pbf-fast ~/estonia.pbf --write-apidb host="localhost" database="openstreetmap" user="$USER" password="$DB_pass" validateSchemaVersion="no"'
 echo 'Peale seda on kõik korras ning serveri käivitamiseks tuleks sisestada "./run.sh"'
 exit 1
} }
# Ajakulu terve Eestiga on 30-45 min.
# Tagasivõtmiseks on käsk bundle exec rake db:drop

# Kontrolli, et oled kaustas ~/openstreetmap-website/
# bundle exec rails server -b 0.0.0.0 # Runs at foreground
# firefox http://localhost:3000/ &

echo "Veebisait on installitud"
echo 'Serveri käivitamiseks sisesta "./run.sh"'
