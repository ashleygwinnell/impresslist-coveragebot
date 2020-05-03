# Coverage Bot

# Setup
- Create app on https://discordapp.com/developers/applications/ and copy client ids into config.json
- Create AWS account to use free 'micro' EC2 instance: https://www.youtube.com/watch?v=376V-NB3nf0
	- Save key as private-key.pem
	- `chmod 400 private-key.pem`

## Login to the instance
- `ssh -i private-key.pem user@server.com`

## Install Node (12) on the Instance
- `curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -`
- `sudo apt-get install -y nodejs`
- `exit`

## Upload bot files from your machine:
- `scp {index.js,config.js,package.json} user@server.com:`

## Finish installing
- `ssh -i private-key.pem user@server.com`
- `npm i`
- `sudo npm install forever -g`
- `forever start index.js`

## Install on your server
https://discordapp.com/api/oauth2/authorize?scope=bot&client_id=DISCORD_APP_CLIENT_ID

# Run the bot
`ssh -i private-key.pem user@server.com`
`forever start index.js`

# Stop all
`forever stopall`
