/**
	- made by Benny 'n Sky
	
	- thanks be to the Muskrat, who so kindly graced humanity with GPT-2, which we used for all data training
	- thanks also to DiscordChatExporter, which saved me a buncha time

	- recommended Node v16.10.0+
	- npm install eris v0.17.2+
	- use responsibly or whatever
	- waga baga bobo
**/


const discord_key = '';            // your discord application's secret
const gamemode    = 'creative';    // adventure / creative / spectator / survival
const ping        = 'Pong!';       // :)


const fs = require('fs');
const Eris = require('eris');
const { Buffer } = require('node:buffer');

const _j =(z)=> JSON.parse(JSON.stringify(z));
function giveMePrettyDate(xDate, include_year, include_seconds){
	let xTime =xDate ||new Date(),
		allOfTheMonths= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	return ((include_year ?`(${xTime.getYear() +1900}) ` :'') +allOfTheMonths[xTime.getMonth()]+' '+xTime.getDate()+'  '+xTime.getHours()+':'+((xTime.getMinutes().toString().length==1?'0':'')+ xTime.getMinutes()) +(include_seconds ?`:${xTime.getSeconds().toString().length==1 ?0 :''}${xTime.getSeconds()}` :''));
}



	// opens TOPPINGS file and splits into an array by line breaks
let all_messages  = (fs.readFileSync('./toppings.txt', 'utf8')).split('\r'),
	temp_messages = [],
	filtered_messages = [],    // full list
	outgoing_messages = [],    // dynamic list
	Guilds = {};               // every server to send shit to
	
let template = {
	id: null,
	name: null,
	napkin_id: null,
	enable_messages: true,
	list_of_folks: {
		enabled: false,
		first:   null,
		second:  null,
		third:   null
	},
	keypair_secrets: {
	/*	'USER ID': {
			enabled: true/false,
			id: USER ID
			name: USER NAME
		}
	*/
	},
};


let list_of_guilds = fs.readdirSync('kitchen');
for(let guild of list_of_guilds)
{
	if( guild.includes('.json') )
		guild = guild.replace('.json','');
	else
		continue;
	
	
	try{
		Guilds[guild] = JSON.parse( fs.readFileSync(`kitchen/${guild}.json`) );
		
	}catch(err)
	{
		console.log(`couldn't open "kitchen/${guild}.json" because:`);
		console.log(err);
	}
}
console.log(Guilds);



	// loops through ALL_MESSAGES - saves a new message every time there's an empty line
for(let line in all_messages)
{
	all_messages[line]= all_messages[line].replace('\r','').replace('\n','');
	
	if( all_messages[line] == ''  &&  temp_messages != [] )
	{
		filtered_messages.push(temp_messages);
		temp_messages= [];
		
	}else
	if( all_messages[line]  &&  all_messages[line].length )
		temp_messages.push(all_messages[line]);
}
filtered_messages = filtered_messages.filter( (a)=>a.length );    // sometimes still included blank messages... :(



	// every 15 minutes, there's a 50% chance the bot will send a message
	// each individual line is delayed +99ms for every character to type, with an extra 0-1 seconds of delay
var generate_messages_ID = 'empty';
var send_out_messages_ID = 'empty';
let EIGHT_HOURS = 8*60*60*1000;
var doTheThing =()=>{
	return setInterval(()=>{
		
		for(let i in Guilds)
		{
			let guild = Guilds[i];
			if(!guild)continue;		// because Guilds are occasionally forgotten (ex. if bot is kicked)
			
			let upcoming_banger =filtered_messages[Math.floor(Math.random()*filtered_messages.length)] ||['uhoh'];
			
			console.log(`${'\n'}sending to ${guild.name}/${guild.napkin_id}:`);
			console.log(upcoming_banger);
			
			let total_delay = Math.floor(Math.random() * EIGHT_HOURS);
			let current_time = new Date()*1;
			for(let line of upcoming_banger)
			{
				total_delay+= line.length*99 +Math.floor(Math.random()*1000);
				
				outgoing_messages.push(
					{
						guild_id: guild.id,
						napkin_id: guild.napkin_id,
						message: line,
						when: (current_time + total_delay)
					}
				);
			}
			
			outgoing_messages = outgoing_messages.filter((a)=>a);
			outgoing_messages = outgoing_messages.sort( (a,b)=>{a.when -b.when} );
		}
		
	}, EIGHT_HOURS);
};



// send outgoing messages...    out.
function send_out_the_messages(){
	return setInterval(async()=>{
		
		if( !outgoing_messages[0] )
			return;
		
		let guild_id = outgoing_messages[0].guild_id,
			napkin_id = outgoing_messages[0].napkin_id,
			message = outgoing_messages[0].message,
			wait_until = outgoing_messages[0].when,
			right_now = new Date()*1;
		
		if( right_now < wait_until )
			return;
		
		
		
		// replace @'s in $message:
		if( Guilds[guild_id].list_of_folks.enabled )
		{
			let folks    = Guilds[guild_id].list_of_folks,
				first    = folks.first,
				second   = folks.second,
				third    = folks.third,
				everyone = [];
				
			if(first)  everyone.push(` \<\@${first}\> `);
			if(second) everyone.push(` \<\@${second}\> `);
			if(third)  everyone.push(` \<\@${third}\> `);
			
				everyone = everyone.sort((a,b)=> 0.5 - Math.random());
			
			
			if( everyone.length )
			{
				if(!everyone[1]) everyone.push(everyone[0]);
				if(!everyone[2]) everyone.push(everyone[1]);
				
				message = message
						.replace(/@([A-Za-z_]+)/gmi, everyone[2])           // every @AnyWordz
						.replace(/@?paulie/gmi, everyone[0])                // every paulie
						.replace(/@?knaxel/gmi, everyone[1])                // every knaxel
						.replace(/(^|(?<=[ ,.!;:"']))@?ren(?=[ ,.!;:"'])/gmi, everyone[2])     // every Ren (not inside of a word)
						.replace(/@?hey retard/gmi,`hey${everyone[2]}`);    // every "hey retard"
						
				console.log(message);
			}
		}
		
		
		
		try{
			await client.createMessage(napkin_id, message);
			
		}catch(err)
		{	
			let ERR_PRETTY = err.toString().toLowerCase();
			// if bot was kicked, lost permissions, etc.  we should forget guild
			if( ERR_PRETTY.includes('missing access')  ||  ERR_PRETTY.includes('missing permissions') )
			{
				fs.unlinkSync(`kitchen/${guild_id}.json`);
				delete Guilds[guild_id];
				
				for( let i=outgoing_messages.length-1; i>=0; i-- )
				{
					if( outgoing_messages[i].guild_id == guild_id )
						delete outgoing_messages[i];
				}
				outgoing_messages = outgoing_messages.filter( (a)=>a );
			
			}else
			{
				console.log(err);
			}
		}
		
		
		outgoing_messages.shift();
	//	console.log(outgoing_messages);
		
	}, 1000);
}

	

const client = new Eris( discord_key,
{
    intents:[
	'guildMessages',
	'guilds',
	'directMessages',
    ]
});


client.on('ready', async()=>
{
    console.log('hey fellas\n');
	
	generate_messages_ID= doTheThing();
	send_out_messages_ID= send_out_the_messages();
	
	//	let DM_Sky = (await client.getDMChannel('########')).id;
	//	await client.createMessage(DM_Sky, 'yo');
	//	let DM_Benny = (await client.getDMChannel('#######')).id;
	//	await client.createMessage(DM_Benny, 'yo');
});


client.on('error', (err)=>{
	let err_msg = err.toString().toLowerCase();
	
	let err_list =[
		'connection reset by peer',
		'socket hang up',
		'request timed out',
		'504 gateway timeout',
		'getaddrinfo enotfound ',
		'connection timeout',
		'websocket was closed',
		'heartbeat',
		'500 internal server error',
		'internal server',
		'eai_again'
	];
	
	for(let i of err_list)
		if(err_msg.includes(i))
		{
			console.log(`@${giveMePrettyDate()}  DISCORD ERR:   ${i}`);
			err_msg = false;
			break;
		}
	
	if( err_msg )
	{
		console.log(`--->  CRASHING FROM MSG:  ${err_msg}`);
		console.error(err);
		
	}else
	{
		(async()=>{ await wait(30); })		// need to fix this :P
	}
	
});



client.on('interactionCreate', async(Interaction)=>{		// yea, interaction
	let guild_name  = Interaction.channel.guild.name,
		guild_id    = Interaction.channel.guild.id,
		channel_id  = Interaction.channel.id,
		user_name   = Interaction.member.user.username,
		user_id     = Interaction.member.id,
		napkin_name = '',
		napkin_id   = '';
	
/*	try{
		napkin_id   = Interaction.data.resolved.channels;
		napkin_id   = napkin_id[Object.keys(napkin_id)[0]];
		napkin_name = napkin_id.name;
		napkin_id   = napkin_id.id;
	}catch(err){}
*/
	
	if( !Guilds[guild_id] )
	{
		Guilds[guild_id] = _j(template);
		Guilds[guild_id].id = guild_id;
	}
	
	Guilds[guild_id].name = guild_name;
	
	
	if(Interaction instanceof Eris.CommandInteraction)
	{
			//  /oven  -  lol
		if(Interaction.data.name == 'oven')
		{
			let message = 'STILL COOKIN';
			
			if( Math.random() > 0.995 )
			{
				let lucky_winners = 'list of idiots:\n---------------------------------------------------';
				try{
					lucky_winners = fs.readFileSync('lucky winners.txt');
				}catch(err){}
					lucky_winners+= `${'\n'}${giveMePrettyDate(null, true, true)}  ->  ${user_id}, aka "${user_name}"`;
				
				fs.writeFileSync('lucky winners.txt', lucky_winners);
				
				console.log(`SOMEONE GOT LUCKY:  ${user_name} (${user_id})`);
				message = 'ITS DONE!!';
			}
			
			await Interaction.createMessage(message);
		
		
			//  /wakeup  -  turn bot on in this server
		}else
		if(Interaction.data.name == 'wakeup')
		{
			console.log(`pizza woke up for:      ${guild_name} (${guild_id})`);
			
			await Interaction.createMessage('get out of my head, Man');
			
			Guilds[guild_id].enable_messages = true;
		
		
			//  /sleep  -  turn bot off in this server
		}else
		if(Interaction.data.name == 'sleep')
		{
			console.log(`pizza fell asleep for:  ${guild_name} (${guild_id})`);
			
			await Interaction.createMessage('cya later then');
			
			Guilds[guild_id].enable_messages = false;
		
		
			//  /move CHANNEL_NAME  -  choose napkin
		}else
		if(Interaction.data.name == 'move')
		{
			napkin_id = Interaction.data.options[0].value;
			
			console.log(`pizza was moved to new channel (${napkin_id}) in guild:  ${guild_name} (${guild_id})`);
			
			
			// validate is actually a channel?
			try{
				Guilds[guild_id].napkin_id = napkin_id;
				await client.createMessage(napkin_id, 'hey Fellas');
				await Interaction.createMessage('ok');
				
			}catch(err)
			{
				console.log(`---->  ERROR TRYING TO MOVE PIZZA TO CHANNEL "${napkin_id}"!`);
				console.log(err);
				await Interaction.createMessage('are you stupid or something? where even is that');
			}
			
		
			//  /secret ON/OFF  -  hehehe
		}else
		if(Interaction.data.name == 'secret')
		{
			console.log(`dumb fucking moron (${user_name}) just goofed himself!!`);
			
			Guilds[guild_id].keypair_secrets[user_id] = {
				enabled: Interaction.data.options[0].value,
				id: user_id,
				name: user_name
			}
			
			await Interaction.createMessage('what');
		
		
			//  /targets ON/OFF NAME1 NAME2 NAME3  -  toggle + decide targets of random @'s
		}else
		if(Interaction.data.name == 'targets')
		{
			let results = Interaction.data.options;
			console.log(`user (${user_name}) just decided:`);
			console.log(results);
			
			Guilds[guild_id].list_of_folks ={
				enabled: (results[0].value),
				first:   ((results[1]??[]).value) ??false,
				second:  ((results[2]??[]).value) ??false,
				third:   ((results[3]??[]).value) ??false,
			};
			
			await Interaction.createMessage('nice');
		}
	}
	
	
	// keep 'er up-to-date
	fs.writeFileSync(`kitchen/${guild_id}.json`, JSON.stringify( Guilds[guild_id] ));
	
	
/*	
	console.log(`${'\n'}Guild:         ${guild_name} (${guild_id})`);
	console.log(`Channel Seen:  ${channel_id}`);
	console.log(`User:          ${user_name} (${user_id})`);
	console.log(`Dump channel:  ${napkin_name} (${napkin_id})`);
	
	Interaction.acknowledge();
*/

});



client.connect();


/*
	- guild ID
	- guild NAME      (can change)	(update every Interaction)
	- napkin ID       (can change)	(update w/ Command)
	- on/off napkin   (can change)	(update w/ Command)
	- list of folks   (can change)	(updatw w/ Command)
	- keypair secrets (can change)  (update w/ Command)
	
	- commands:
	x	- CHANNEL:  change napkin ID
	x	- wakeup:  more napkin messages
	x	- sleep:  stop napkin messages
	x	- BOOL:  secret mode ;)
	x	- LIST:  @ folks
*/
