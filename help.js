/* Function to retrieve help text/string
PARAMETER    TYPE        DESCRIPTION
args		 Array       Array of arguments recieved in message   
bot			 Client		 Discord.js client a.k.a my bot
commandChar  Horrible uneeded prefix, TODO settings.js
*/
module.exports = {
getHelp: function(args, bot, commandChar){
	//We will always return string
	var helpString = "";//define it first
	
	if (args.length == 0){
		//we just got help then
		helpString = 'Hello I`m Ollies '+ 
		bot.user.tag +
		' that listens to this prefix: '+commandChar+

		'\n iRobot listens to the following commands: for current list its: \n'+
		'"getRequests" "list" "requests" "l" \n for adding requests use: "addSong" or "r"'
		
		
	}

	else{
		//help with multiple parameters
		//now we just figure out what the parameter is 
//----------TODO------HELP---
		//if (args[0] == "settings")//print help for settings
		//second parameter is for instance specific setting parameter
		//	if ( args[1] == "prefix")//print help for prefix
		//	else if (args[1] == "debug")//print help for debugging in console
		//  else if EVEN MORE SETTINGS TO COME YAY
		//else if (args[0] == "commands for requestlist"...
		//else if (args[0] == "commands for songs and stuff"...
		//more commands...
		//eventually TODO commands.js
	}
	
	return helpString;	
}



}