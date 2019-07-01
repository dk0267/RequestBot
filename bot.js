//------------IMPORTS-----------------
const Discord = require('discord.js');
const winston = require('winston');
const auth = require('./auth.json');
const help = require('./help.js');
const bot = new Discord.Client();
const restClient = require('node-rest-client').Client;

//-----------LOCAL CONFIGS-----TODO SETTINGS.JS
//Configure rest-client to do requests to my server
const client = new restClient();
const url = "http://travca.si/discord/";

//TODO ROLES.JS
//Configure mod roles
const acceptedRoles = ["Mod", "Moderator", "Staff", "Mod Staff"];
const acceptedSongRoles = ["SongAdder","NoMod"];


var commandChar = "?";


//Configure logger settings
var logger = winston.createLogger({
    name: 'consoleLog',
    //colorize: true,
    //showLevel: true,
    //formatter: winston.consoleFormatter,
	transports: [
		new winston.transports.Console({
			name: 'console.info',
			colorize: true,
			showLevel: true,
			formatter: winston.consoleFormatter,
			silent: false//set logger to not silent
		})
	]
});


//login bot
bot.login(auth.token);


//User functions

//-------------JSON HANDLING-------------------
/* Function to return recieved add request list data
PARAMETER    TYPE        DESCRIPTION
data		 Array       Array of parsed data from JSON response 
message		 Message	Discord.js Message dont need this....
*/
function handleJSONAddRequestList(data){
	//console.log(data.message);
	var reqListData = "";
	if (data.message[0] == "NO ERROR"){
		reqListData = reqListData + data.message[1] +"\n";
		return(reqListData);
	}
	
	else{
		//GOT ERROR INSTEAD
		return handleJSONError(data);
	
	}
}

/* Function to return recieved error data
PARAMETER    TYPE        DESCRIPTION
data		 Array       Array of parsed data from JSON response 
message		 Message	Discord.js Message dont need this....
RETURN
stringData   String      Parsed request data to string
*/
function handleJSONError(data){
	var err = "";
		//data.errors.forEach(function (error){
		//	err = err + error.value + "\n";
		//});
		var i;
		for (i = 1; i <= data.errors.length; i++){
			err = err +String(i)+". " + data.errors[i-1] + "\n";
		}
		//message.channel.send("RECIEVED errors: \n" + err);
		return String(err);	
}

/* Function to return recieved request list data  
PARAMETER    TYPE        DESCRIPTION
data		 Array       Array of parsed data from JSON response 
message		 Message	Discord.js Message dont need this....
RETURN
stringData   String      Parsed request data to string
*/
function handleJSONRequestList(data){
	//console.log(data.message);
	if (data.message[0] == "NO ERROR"){
		var i;
		for (i=0;i < data.message.length;i++){
			//decode
			data.message[i] = unescape(data.message[i]);
		}
		var reqListData = "REQUEST LIST INFORMATION:\n";
	
		reqListData = reqListData + "Name of request list: " + data[0].name +"\n";
		reqListData = reqListData + "Date of request list: " + data[0].date_start +"\n";
		reqListData = reqListData + "Date when request list ended: " + data[0].date_end +"\n";	
		reqListData = reqListData + "Song limit of request list: " + data[0].song_limit +"\n";
		reqListData = reqListData + "Songs list of request list: \n";
		var i;
		for (i=0; i < data[0].song_list.length; i++){
			if (reqListData.length > 1800){//to fix chat overload
				message.channel.send(reqListData);
				reqListData = "	";
			}
			else
				reqListData = reqListData + "	"+data[0].song_list[i].number +": " + data[0].song_list[i].artist + " - " + data[0].song_list[i].title + " added by " + data[0].song_list[i].user+"\n";
		}
		//message.channel.send("list is long:"+reqListData.length);
		
		//return string to send
		return String(reqListData);
			
	}
	
	else{
		//GOT ERROR INSTEAD
		return String(handleJSONError(data));
	}
	
}


/* Function to return recieved request add song
PARAMETER    TYPE        DESCRIPTION
data		 Array       Array of parsed data from JSON response 
message		 Message	Discord.js Message dont need this....
*/
function handleJSONAddSong(data){
	//console.log(data.message);
	if (data.message[0] == "NO ERROR"){
		//decode message
		var i;
		for (i=0;i < data.message.length;i++){
			//decode
			data.message[i] = unescape(data.message[i]);
		}
		if (data.message.length == 4)
		{//exactly 4 elements no error, artist, title, user //print it out
			return String("Successfully added song: "+data.message[1]+
			" - "+data.message[2]+" by "+data.message[3]
			);
			
			
		}
		else {
			return "INCORRECTLY RETURNED JSON";
		}
		//PRINT OUT shit
		//message.channel.send("Successfully added song:");
		//return true;	
	}
	
	else{
		//GOT ERROR INSTEAD
		return handleJSONError(data);
		
		//return false;
	}
	
}







/* event on message handle recieved message 
Need to improve to handle message and again perform only on strings
to return everything to first function
*/
bot.on('message', message => {
	// Our bot needs to know if it will execute a command
    // It will listen for messages that will start with commandChar variable

	//first get role 
	//will use it in future to pass it as argument
	//so bot will be able to differiate between discord servers (guilds)
	const guildID = message.guild.id;

	const hasModRole = message.member.roles.some(role => acceptedRoles.includes(role.name));
	const hasSongRole = message.member.roles.some(role => acceptedSongRoles.includes(role.name));	
	const userName = message.member.user.username;	
	//var reqData = 
	//console.log(message.member.user.username);
	//console.log(hasModRole);   
	if (message.content.substring(0, 1) == commandChar) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
		
		
        args = args.splice(1);//trow first one out (basicly the prefix)
		var i;
		//trim those nasty abusive spaces
		for (i=0;i < args.length; i++) {
			//replace horrible strings like &?/
			//make new js magic for this horrendous shit
			args[i] = args[i].replace("&", "and");
			args[i] = args[i].replace("?", " ");
			args[i] = args[i].replace("/", " ");			
			args[i] = escape(args[i].trim());
			//console.log("PARA"+args[i]);
		}
		//console.log('message: '+message.content.substring(1));
		
		//TODO command.js needed
//------------command to get request list
		if (cmd == 'getList' || cmd == 'list' || cmd == 'requests' || cmd == 'getRequests' || cmd == 'l' ){
				//get request list with specific id if not provided return
				//most recent, header will be json

			if (hasModRole){
			//check for second args
				if (args.length == 0){
					//return most recent request list
					logger.info("LINK: "+url+"getList.php?id=");				
					client.get(url+"getList.php?id=",function(data,response){
						message.channel.send(handleJSONRequestList(data));
					});
				}
				
				else if (args.length == 1)
				{//generate specific req list by id
					//TODO FIND BY NAME
					//console.log("1 args");
					logger.info("LINK: "+url+"getList.php?id="+args[0]);
					client.get(url+"getList.php?id="+args[0],function(data,response){
						message.channel.send(handleJSONRequestList(data));
					});						
				}
				
				else{
					message.channel.send("Too many parameters provided, the command needs only 1!");
				}
			}
			else{
				message.channel.send("You need a moderator role to do that!");
			}
		}
		
//-------------command add list 
		else if (cmd == 'addList' || cmd == 'la'){
			//to add lists you need following params:
			//?la name date_start song_limit
			//where date_start is optional parameters
			if (hasModRole){
				//check for second args
				if (args.length == 3){//we got option where all is super nice
					//add new list as most recent request list
					if (isNaN(args[2])){
						message.channel.send("Incorrect parameter, use:\n"+
						"?la name_without_spaces date_year_month_day number_of_songs_limit"
						);
					}
					else {
						logger.info("LINK: "+url+"insertList.php?name="+args[0]+"&date="+args[1]+"&limit="+args[2]+"&user="+userName);
						//logger.log("LINK: "+url+"getList.php?id=");					
						reqData = client.get(url+"insertList.php?name="+args[0]+"&date="+args[1]+"&limit="+args[2]+"&user="+userName,function(data,response){
							message.channel.send(handleJSONAddRequestList(data, message));
							//return Object.assign({}, data);
						});
					}
				}
				
				
				else if (args.length == 2)
				{//generate specific
					//console.log("1 args");
					if (isNaN(args[1])){
						message.channel.send("Incorrect parameter, use:\n"+
						"?la <name_without_spaces> <date_year_month_day> <number_of_songs_limit>"
						);
					}
					else {
						logger.info("LINK: "+url+"insertList.php?name="+args[0]+"&limit="+args[1]+"&user="+userName);
						reqData = client.get(url+"insertList.php?name="+args[0]+"&limit="+args[1]+"&user="+userName,function(data,response){
							message.channel.send(handleJSONAddRequestList(data, message));
							//return Object.assign({}, data);
						});	
					}
				}
				
				else{
					message.channel.send("Too many/little parameters provided, use:\n"+
					"?la <name_without_spaces> <date_year_month_day> <number_of_songs_limit>"
					);
				}
			}
			else{
				message.channel.send("You need a moderator role to do that!");
			}
			
		}	
		
		
		//TODO command to delete song will be hard cuz of fixing column number
//----------------command to add song
		else if(cmd == 'addSong' || cmd == 'r'){
			//member needs to have song rights
			//regexd magic time
			
			var reg = RegExp('\b-\b');
			console.log(args.length);

			if (hasSongRole){
				if (args.length == 1){
					//console.log("LINK DETECTED: "+args[0].substring(0, 3));
					if (args[0].substring(0, 4) == "http"){
						logger.info("LINK: "+url+"insertSong.php?link="+args[0]+"&user="+userName);
						reqData = client.get(url+"insertSong.php?link="+args[0]+"&user="+userName,function(data,response){
							message.channel.send(handleJSONAddSong(data, message));
							//return Object.assign({}, data);
						});
					}
					else{
					//user could forgot spaces? silly user
						if (args[0].length <= 4) {
							//error 2 low title/artist
							message.channel.send("The title/artist name is too short!");
						}
						
						else{
							var i;
							var artistArray = [];
							var titleArray = [];
							var foundLine = false;
							//build artist and shiz
							for (i=0; i < args[0].length; i++){
								if (args[0][i] == '-')	foundLine = true;
								else if (foundLine && args[0][i].trim() != '') {titleArray.push(args[0][i].trim());}
								else if (args[0][i].trim() != ''){artistArray.push(args[0][i].trim())}
							}				
							var artistString = "";
							var titleString = "";
							for (i=0; i < artistArray.length; i++) {artistString += artistArray[i]+"";	}
							for (i=0; i < titleArray.length; i++) titleString += titleArray[i]+"";					
							//console.log(artistString);
							//console.log(titleString);
							logger.info("LINK: "+url+"insertSong.php?artist="+artistString+"&title="+titleString+"&user="+userName);
							reqData = client.get(url+"insertSong.php?artist="+artistString+"&title="+titleString+"&user="+userName,function(data,response){
								message.channel.send(handleJSONAddSong(data, message));
							});
						}
						
					}
					//if (reqData){
					//	message.channel.send("Successfully added song");
					//}
					//else console.log("HORRIBLE FUCKUP");					
				}
				
				else if (args.length > 2){
					//expecting a - in the requested shit
					//so i loop and find the fkin - and 
					//whats on the left of it is artist and right is ttle
					var foundManyLine = false;
					var i;
					var artistArray = [];
					var titleArray = [];
					var foundLine = false;
					//build artist and shiz
					for (i=0; i < args.length; i++){
						if (args[i] == '-' ){foundLine = true;}
						//else if (args[i] == '-' && foundLine == true){//fix problem with multiple -}
						else if (foundLine && args[i].trim() != '') {titleArray.push(args[i].trim());}
						else if (args[i].trim() != ''){artistArray.push(args[i].trim());}
					}
					
					//now build artist string and title string
					var artistString = "";
					var titleString = "";
					for (i=0; i < artistArray.length; i++) {artistString += artistArray[i]+" ";	}
					for (i=0; i < titleArray.length; i++) titleString += titleArray[i]+" ";					
					artistString = artistString.trim();
					titleString = titleString.trim();
					
					//check if again 2slow
					if (artistString.length < 2 || titleString.length <= 1){
						message.channel.send("The title/artist name is too short!");
					}
					
					else{
						//ok time to send that shit to the internets
						logger.info("LINK: "+url+"insertSong.php?artist="+artistString+"&title="+titleString+"&user="+userName);					
						reqData = client.get(url+"insertSong.php?artist="+artistString+"&title="+titleString+"&user="+userName,function(data,response){
							message.channel.send(handleJSONAddSong(data, message));
						});
						//if (reqData){
						//	message.channel.send("Successfully added song:\n"+artistString+" - "+titleString+" added by user: "+userName);
						//}
						//else console.log("HORRIBLE FUCKUP");
					}
				}
				
				else{//this probably never happns because of those IFs above
					message.channel.send("The provided parameters are incorrect.\n Use the following format: Artist - Title or links");
				}
			}
				
				
		}


//------TODO ADD MORE SETTINGS TO CHANGE BOT GLOBALS
		else if (cmd == 'settings'){
				if (args.length == 0){
					//SOMEONE WANTS TO CHANGE COMMAND BUT DIDNT PROVIDE CHAR LOL
					message.channel.send('Error: no command character provided, provide 1 unique character!');
				}
				else if (args.length >= 1){
					//exactly 2
					console.log(args[0]);
					if (args[0] == "prefix"){

							//changes prefix for recognizing commands
							var newCommandChar = args[1];
							commandChar = newCommandChar;
							message.channel.send('Changed command character to: '+commandChar);

					}
					
					
					else if (args[0] == "debug"){
						//check if it is off or on	
						if (args[1] == "off"){
							logger.transports[0].silent = true;  // turns off	
							message.channel.send('Console logging is turned off.');

						}
						else if (args[1] == "on"){
							logger.transports[0].silent = false;  // turns on							
							message.channel.send('Console logging is turned on.');

						}
						
						else {
							message.channel.send('To turn off/on console logging use '+commandChar+
							'settings debug <on/off>');	
						}
					}

					else if (args[0] == "activity"){
						if (isNaN(args[1])){
							message.channel.send('To change bot activity use command '+commandChar+
							'settings activity <number 1=PLAYING|2=STREAMING|3=LISTENING|4=WATCHING> <text_to_decribe_activity>'
							);	
						}
						else if (args.length == 2){
							message.channel.send('To change bot activity use command '+commandChar+
							'settings activity <number 1=PLAYING|2=STREAMING|3=LISTENING|4=WATCHING> <text_to_decribe_activity>'
							);	
						}
						else{
							var activityString = ""
							var i;
							for (i=2;i < args.length;i++){
								activityString += unescape(args[i]) +" ";

							}
							switch (parseInt(args[1])){
								case (1):
									bot.user.setActivity(activityString.trim(),{type:"PLAYING"});
								break;

								case (2):
									bot.user.setActivity(activityString.trim(),{type:"STREAMING"});
								break;

								case (3):
									bot.user.setActivity(activityString.trim(),{type:"LISTENING"});
								break;

								case (4):
									bot.user.setActivity(activityString.trim(),{type:"WATCHING"});
								break;

								default:
									message.channel.send('To change bot activity use command '+commandChar+
									'settings activity <number 1=PLAYING|2=STREAMING|3=LISTENING|4=WATCHING> <text_to_decribe_activity>'
									);	
								break;																							
							}

							message.channel.send('Bot activity changed!');
													

						}
					
						

					}

				}
		}
			
//------TODO HELP------------------------
		else if (cmd == 'help'){
				//handle only strings
				message.channel.send(help.getHelp(args,bot,commandChar));
		}
		else{
				message.channel.send('UNKNOWN COMMAND, TYPE '+commandChar+'help to get commands.');				
        }
            // Just add any case commands if you want to..
        
     }
});





//event on bot boot
// ready
/* Emitted when the bot becomes ready to start working.    */
bot.on("ready", function(){
    logger.info(`the bot becomes ready to start`);
	logger.info(`I am ready! Logged in as ${bot.user.tag}!`);
	logger.info(`Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`); 

  	bot.user.setActivity("some DNB");
	//nooo link generating sir
	//bot.generateInvite(['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'])
	//.then(link => {
	//	logger.info(`Generated bot invite link: ${link}`);
	//	inviteLink = link;
	//});
});

//-----BELOW ARE ALL BOT EVENTS THAT LOG SHIT




/* Emitted whenever a channel is created.
PARAMETER    TYPE        DESCRIPTION
channel      Channel     The channel that was created    */
bot.on("channelCreate", function(channel){
    logger.info(`channelCreate: ${channel}`);
});

// channelDelete
/* Emitted whenever a channel is deleted.
PARAMETER   TYPE      DESCRIPTION
channel     Channel   The channel that was deleted    */
bot.on("channelDelete", function(channel){
    logger.info(`channelDelete: ${channel}`);
});

// channelPinsUpdate
/* Emitted whenever the pins of a channel are updated. Due to the nature of the WebSocket event, not much information can be provided easily here - you need to manually check the pins yourself.
PARAMETER    TYPE         DESCRIPTION
channel      Channel      The channel that the pins update occurred in
time         Date         The time of the pins update    */
bot.on("channelPinsUpdate", function(channel, time){
    logger.info(`channelPinsUpdate: ${channel}:${time}`);
});
    
// channelUpdate
/* Emitted whenever a channel is updated - e.g. name change, topic change.
PARAMETER        TYPE        DESCRIPTION
oldChannel       Channel     The channel before the update
newChannel       Channel     The channel after the update    */
bot.on("channelUpdate", function(oldChannel, newChannel){
    logger.info(`channelUpdate -> a channel is updated - e.g. name change, topic change`);
});

// botUserGuildSettingsUpdate
/* Emitted whenever the bot user's settings update.
PARAMETER                  TYPE                       DESCRIPTION
botUserGuildSettings    botUserGuildSettings    The new bot user guild settings    */
bot.on("botUserGuildSettingsUpdate", function(botUserGuildSettings){
    logger.info(`botUserGuildSettingsUpdate -> bot user's settings update`);
});

// botUserSettingsUpdate
/* Emitted when the bot user's settings update.
PARAMETER             TYPE                  DESCRIPTION
botUserSettings    botUserSettings    The new bot user settings    */
bot.on("botUserSettingsUpdate", function(botUserSettings){
    logger.info(`botUserSettingsUpdate -> bot user's settings update`);
});

// debug
/* Emitted for general debugging information.
PARAMETER    TYPE         DESCRIPTION
info         string       The debug information    */
bot.on("debug", function(info){
    logger.info(`debug -> ${info}`);
});

// disconnect
/* Emitted when the bot's WebSocket disconnects and will no longer attempt to reconnect.
PARAMETER    TYPE              DESCRIPTION
Event        CloseEvent        The WebSocket close event    */
bot.on("disconnect", function(event){
    logger.info(`The WebSocket has closed and will no longer attempt to reconnect`);
});

// emojiCreate
/* Emitted whenever a custom emoji is created in a guild.
PARAMETER    TYPE          DESCRIPTION
emoji        Emoji         The emoji that was created    */
//bot.on("emojiCreate", function(emoji){
//    logger.info(`a custom emoji is created in a guild`);
//});

// emojiDelete
/* Emitted whenever a custom guild emoji is deleted.
PARAMETER    TYPE         DESCRIPTION
emoji        Emoji        The emoji that was deleted    */
//bot.on("emojiDelete", function(emoji){
//    logger.info(`a custom guild emoji is deleted`);
//});

// emojiUpdate
/* Emitted whenever a custom guild emoji is updated.
PARAMETER    TYPE       DESCRIPTION
oldEmoji     Emoji      The old emoji
newEmoji     Emoji      The new emoji    */
//bot.on("emojiUpdate", function(oldEmoji, newEmoji){
//    logger.info(`a custom guild emoji is updated`);
//});

// error
/* Emitted whenever the bot's WebSocket encounters a connection error.
PARAMETER    TYPE     DESCRIPTION
error        Error    The encountered error    */
bot.on("error", function(error){
    console.error(`bot's WebSocket encountered a connection error: ${error}`);
});

// guildBanAdd
/* Emitted whenever a member is banned from a guild.
PARAMETER    TYPE          DESCRIPTION
guild        Guild         The guild that the ban occurred in
user         User          The user that was banned    */
bot.on("guildBanAdd", function(guild, user){
    logger.info(`a member is banned from a guild`);
});

// guildBanRemove
/* Emitted whenever a member is unbanned from a guild.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The guild that the unban occurred in
user         User         The user that was unbanned    */
bot.on("guildBanRemove", function(guild, user){
    logger.info(`a member is unbanned from a guild`);
});

// guildCreate
/* Emitted whenever the bot joins a guild.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The created guild    */
bot.on("guildCreate", function(guild){
    logger.info(`the bot joins a guild`);
});

// guildDelete
/* Emitted whenever a guild is deleted/left.
PARAMETER    TYPE         DESCRIPTION
guild        Guild        The guild that was deleted    */
bot.on("guildDelete", function(guild){
    logger.info(`the bot deleted/left a guild`);
});

// guildMemberAdd
/* Emitted whenever a user joins a guild.
PARAMETER     TYPE               DESCRIPTION
member        GuildMember        The member that has joined a guild    */
bot.on("guildMemberAdd", function(member){
    logger.info(`a user joins a guild: ${member.tag}`);
});

// guildMemberAvailable
/* Emitted whenever a member becomes available in a large guild.
PARAMETER     TYPE               DESCRIPTION
member        GuildMember        The member that became available    */
bot.on("guildMemberAvailable", function(member){
    logger.info(`member becomes available in a large guild: ${member.tag}`);
});

// guildMemberRemove
/* Emitted whenever a member leaves a guild, or is kicked.
PARAMETER     TYPE               DESCRIPTION
member        GuildMember        The member that has left/been kicked from the guild    */
bot.on("guildMemberRemove", function(member){
    logger.info(`a member leaves a guild, or is kicked: ${member.tag}`);
});

// guildMembersChunk
/* Emitted whenever a chunk of guild members is received (all members come from the same guild).
PARAMETER      TYPE                      DESCRIPTION
members        Array<GuildMember>        The members in the chunk
guild          Guild                     The guild related to the member chunk    */
bot.on("guildMembersChunk", function(members, guild){
    console.error(`a chunk of guild members is received`);
});

// guildMemberSpeaking
/* Emitted once a guild member starts/stops speaking.
PARAMETER     TYPE                DESCRIPTION
member        GuildMember         The member that started/stopped speaking
speaking      boolean             Whether or not the member is speaking    */
bot.on("guildMemberSpeaking", function(member, speaking){
    logger.info(`a guild member starts/stops speaking: ${member.tag}`);
});
// guildMemberUpdate
/* Emitted whenever a guild member changes - i.e. new role, removed role, nickname.
PARAMETER    TYPE               DESCRIPTION
oldMember    GuildMember        The member before the update
newMember    GuildMember        The member after the update    */
bot.on("guildMemberUpdate", function(oldMember, newMember){
    console.error(`a guild member changes - i.e. new role, removed role, nickname.`);
});

// guildUnavailable
/* Emitted whenever a guild becomes unavailable, likely due to a server outage.
PARAMETER    TYPE          DESCRIPTION
guild        Guild         The guild that has become unavailable    */
bot.on("guildUnavailable", function(guild){
    console.error(`a guild becomes unavailable, likely due to a server outage: ${guild}`);
});

// guildUpdate
/* Emitted whenever a guild is updated - e.g. name change.
PARAMETER     TYPE      DESCRIPTION
oldGuild      Guild     The guild before the update
newGuild      Guild     The guild after the update    */
bot.on("guildUpdate", function(oldGuild, newGuild){
    console.error(`a guild is updated`);
});

// message
/* Emitted whenever a message is created.
PARAMETER      TYPE           DESCRIPTION
message        Message        The created message    */
bot.on("message", function(message){
    logger.info(`message is created -> ${message}`);
});

// messageDelete
/* Emitted whenever a message is deleted.
PARAMETER      TYPE           DESCRIPTION
message        Message        The deleted message    */
//bot.on("messageDelete", function(message){
//    logger.info(`message is deleted -> ${message}`);
//});

// messageDeleteBulk
/* Emitted whenever messages are deleted in bulk.
PARAMETER    TYPE                              DESCRIPTION
messages     Collection<Snowflake, Message>    The deleted messages, mapped by their ID    */
//bot.on("messageDeleteBulk", function(messages){
//    logger.info(`messages are deleted -> ${messages}`);
//});

// messageReactionAdd
/* Emitted whenever a reaction is added to a message.
PARAMETER              TYPE                   DESCRIPTION
messageReaction        MessageReaction        The reaction object
user                   User                   The user that applied the emoji or reaction emoji     */
//bot.on("messageReactionAdd", function(messageReaction, user){
//    logger.info(`a reaction is added to a message`);
//});

// messageReactionRemove
/* Emitted whenever a reaction is removed from a message.
PARAMETER              TYPE                   DESCRIPTION
messageReaction        MessageReaction        The reaction object
user                   User                   The user that removed the emoji or reaction emoji     */
//bot.on("messageReactionRemove", function(messageReaction, user){
//    logger.info(`a reaction is removed from a message`);
//});

// messageReactionRemoveAll
/* Emitted whenever all reactions are removed from a message.
PARAMETER          TYPE           DESCRIPTION
message            Message        The message the reactions were removed from    */
//bot.on("messageReactionRemoveAll", function(message){
//    console.error(`all reactions are removed from a message`);
//});

// messageUpdate
/* Emitted whenever a message is updated - e.g. embed or content change.
PARAMETER     TYPE           DESCRIPTION
oldMessage    Message        The message before the update
newMessage    Message        The message after the update    */
//bot.on("messageUpdate", function(oldMessage, newMessage){
//    logger.info(`a message is updated`);
//});

// presenceUpdate
/* Emitted whenever a guild member's presence changes, or they change one of their details.
PARAMETER    TYPE               DESCRIPTION
oldMember    GuildMember        The member before the presence update
newMember    GuildMember        The member after the presence update    */
//bot.on("presenceUpdate", function(oldMember, newMember){
//    logger.info(`a guild member's presence changes`);
//});



// reconnecting
/* Emitted whenever the bot tries to reconnect to the WebSocket.    */
bot.on("reconnecting", function(){
    logger.info(`bot tries to reconnect to the WebSocket`);
});

// resume
/* Emitted whenever a WebSocket resumes.
PARAMETER    TYPE          DESCRIPTION
replayed     number        The number of events that were replayed    */
bot.on("resume", function(replayed){
    logger.info(`whenever a WebSocket resumes, ${replayed} replays`);
});

// roleCreate
/* Emitted whenever a role is created.
PARAMETER    TYPE        DESCRIPTION
role         Role        The role that was created    */
bot.on("roleCreate", function(role){
    console.error(`a role is created`);
});

// roleDelete
/* Emitted whenever a guild role is deleted.
PARAMETER    TYPE        DESCRIPTION
role         Role        The role that was deleted    */
bot.on("roleDelete", function(role){
    console.error(`a guild role is deleted`);
});

// roleUpdate
/* Emitted whenever a guild role is updated.
PARAMETER      TYPE        DESCRIPTION
oldRole        Role        The role before the update
newRole        Role        The role after the update    */
bot.on("roleUpdate", function(oldRole, newRole){
    console.error(`a guild role is updated`);
});

// typingStart
/* Emitted whenever a user starts typing in a channel.
PARAMETER      TYPE            DESCRIPTION
channel        Channel         The channel the user started typing in
user           User            The user that started typing    */
//bot.on("typingStart", function(channel, user){
//    logger.info(`${user.tag} has started typing`);
//});

// typingStop
/* Emitted whenever a user stops typing in a channel.
PARAMETER       TYPE           DESCRIPTION
channel         Channel        The channel the user stopped typing in
user            User           The user that stopped typing    */
//bot.on("typingStop", function(channel, user){
//    logger.info(`${user.tag} has stopped typing`);
//});

// userNoteUpdate
/* Emitted whenever a note is updated.
PARAMETER      TYPE          DESCRIPTION
user           User          The user the note belongs to
oldNote        String        The note content before the update
newNote        String        The note content after the update    */
bot.on("userNoteUpdate", function(user, oldNote, newNote){
    logger.info(`a member's note is updated`);
});

// userUpdate
/* Emitted whenever a user's details (e.g. username) are changed.
PARAMETER      TYPE        DESCRIPTION
oldUser        User        The user before the update
newUser        User        The user after the update    */
bot.on("userUpdate", function(oldUser, newUser){
    logger.info(`user's details (e.g. username) are changed`);
});

// voiceStateUpdate
/* Emitted whenever a user changes voice state - e.g. joins/leaves a channel, mutes/unmutes.
PARAMETER    TYPE             DESCRIPTION
oldMember    GuildMember      The member before the voice state update
newMember    GuildMember      The member after the voice state update    */
bot.on("voiceStateUpdate", function(oldMember, newMember){
    logger.info(`a user changes voice state`);
});

// warn
/* Emitted for general warnings. 
PARAMETER    TYPE       DESCRIPTION
info         string     The warning   */
bot.on("warn", function(info){
    logger.info(`warn: ${info}`);
});


