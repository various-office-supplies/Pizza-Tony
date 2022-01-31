/**
	- made by Benny 'n Sky
	
	- thanks be to the Muskrat, who so kindly graced humanity with GPT-2, which we used for all data training
	- thanks also to DiscordChatExporter, which saved me a buncha time

	- recommended Node v16.10.0+
	- npm install discord.js@13.6.0
	- use responsibly or whatever
	- waga baga bobo
**/

const fs =require('fs');
const Discord =require('discord.js');
const { Client,Intents } =require('discord.js');

const menu ='';                         // ID of channel bot should send messages in
const discord_key ='';                  // your discord application's secret
const gamemode ='creative';             // adventure / creative / spectator / survival
const balls ='tortured';                // ur mom


	// opens TOPPINGS file and splits into an array by line breaks
let all_messages =(fs.readFileSync('./toppings.txt', 'utf8')).split('\r');
let filtered_messages =[];
let temp_messages =[];


	// loops through ALL_MESSAGES - saves a new message every time there's an empty line
for(let line=0; line< all_messages.length; line++){
	all_messages[line]= all_messages[line].replace('\r','').replace('\n','');
	
	if(all_messages[line] ==''  &&  temp_messages !=[]){
		filtered_messages.push(temp_messages);
		temp_messages= [];
		
	}else temp_messages.push(all_messages[line]);
}


	// declare discord intents (guilds, guild_messages, direct_messages)
const client = new Discord.Client({intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES]});


	// starts interval once Discord api connects
client.on('ready', () => {
    console.log('Pizza Tony is online!');
	intervalID= doTheThing();
});


	// every 15 minutes, there's a 30% chance the bot will send a message
	// each individual line is delayed +350ms for every character to type, with an extra 0-1 seconds of delay
var intervalID ='empty';
var doTheThing =()=>{
	return setInterval(()=>{
		if(Math.floor(Math.random()*100) <30){
			let upcoming_banger =filtered_messages[Math.floor(Math.random()*filtered_messages.length)] ||['uhoh'];
			console.log(upcoming_banger);

			for(let i=0, total_delay=0;  i< upcoming_banger.length; i++){
				total_delay+= upcoming_banger[i].length*350 +Math.floor(Math.random()*1000);
				
				setTimeout(()=>{ channelDM(upcoming_banger[i]); }, total_delay);
			}
		}
		
	},15*60*1000);
};


	// commands (!pizza)
	//   !pizza wakeup  -  starts bot
	//   !pizza die     -  stops bot
client.on('message', message => {
    if(message.content.includes('!pizza wakeup')){
		if(intervalID =='empty'){
			intervalID= doTheThing();
			channelDM('hey Fellas');
		}else{
			message.reply('get out of my head, Man');
		}
		
    }else if(message.content.includes('!pizza die')){
		if(intervalID != 'empty'){
			clearInterval(intervalID);
			intervalID= 'empty';
		}
		message.reply('cya later then');
	}
});


	// yea
const channelDM =async(dm)=>{
    client.channels.cache.get((await client.channels.fetch( menu )).id).send( dm );
}


client.login(discord_key);
