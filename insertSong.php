<?php
$servername = "localhost";
$username = "some_mysql_username";
$password = "some_mysql_password";
$dbname = "some_dbname";



$json_array = array();
$debug = true;


//ERROR FUNCTION TO BUILD JSON LIST
$error_array = array();
$error_count = 1;//global variable for erroc count
function add_error($array, $error_number, $error_text){
	//preset error name
	$error_name = "error";
	//echo nl2br("NEW ERROR NAME: ".$error_name.$error_number."\n");
	$error_name = $error_name.$error_number;
	array_push($array,$error_text);
	//echo nl2br("NEW IN ARRAY ".$array[$error_name]."\n");
	global $error_count;
	$error_count = $error_number + 1;
	
	return $array;
}


if ($debug == true) {
	echo nl2br("-----------------DEBUG MODE ENABLED, PRINTING PROCESS--------------------\n");	
}
else{
	//whole document is now json
	header('Content-Type: application/json');
}

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
	if ($debug == true) echo nl2br("Connection failed: " . $conn->connect_error . "\n");
    $error_array = add_error($error_array,$error_count, "Connection failed: " . $conn->connect_error);
	
}


$song_title = $_GET["title"];
$song_artist = $_GET["artist"];
$song_user = $_GET["user"];//user that added song
$song_link = $_GET["link"];

$has_song_link = false;


if ($song_link == ""){

	if ($song_title == ""){
	//ERROR NO SONG TITLE TO ADD SONG
		if ($debug == true) echo nl2br("Error: no song title parameter");
		$error_array = add_error($error_array,$error_count, "No song title parameter provided");
	}
	
	//proper formating
	else{
		$song_title = str_replace("'", "´", $song_title);	
	}
	if ($song_artist == ""){
		if ($debug === true) echo nl2br("Error: no song artist parameter");
		$error_array = add_error($error_array,$error_count, "No song artist parameter provided");
	}
	
	else{
		$song_artist = str_replace("'", "´", $song_artist);	
	}

	if ($song_user == ""){
		if ($debug == true) echo nl2br("Error: no user parameter");
		$error_array = add_error($error_array,$error_count, "No user parameter provided");
	}
	
	else{
		$song_user = str_replace("'", "´", $song_user);
	}

}
else{
	$has_song_link = true;
	if ($song_user == ""){
		if ($debug == true) echo nl2br("Error: no user parameter");
		$error_array = add_error($error_array,$error_count, "No user parameter provided");
	}
	
	else{
		$song_user = str_replace("'", "´", $song_user);
	}
}




$req_id = -1;
$song_number = 1;
$song_limit = -1;

if ($error_array.length == 0)
{
//get latest request
$sql = "SELECT id, song_limit FROM requests ORDER BY id DESC";
$result = $conn->query($sql);
$read_one = 0;

	if ($result->num_rows > 0) {
		// output data of each row
		$row = $result->fetch_assoc();
		$req_id = $row["id"];
		$song_limit = $row["song_limit"];
		$read_one = 1;
		if ($debug == true) echo nl2br("Request list id found:". $req_id . "\r\n");
	}
	
	else {
		//no list yet created run script to create list
			if ($debug == true) echo nl2br("Request list NOT found with query:". $sql . "\r\n");
			$error_array = add_error($error_array, $error_count, "Request list NOT found with query:". $sql);
	}

	$sql = "SELECT id, number FROM songs WHERE request_id = $req_id ORDER BY number DESC";
	$result = $conn->query($sql);

	$read_one = 0;

	if ($result->num_rows > 0) {
		// output data of each row
		$row = $result->fetch_assoc();
		$song_number = $row["number"];
		$read_one = 1;
		if ($debug == true) echo nl2br("SONG NUMBER: $song_number \r\n");
	} 
	else {
		$song_number = 0;
		if ($debug == true) echo nl2br("0 songs in list, defaulting to 1.\n");	
	}

	//gotta check if limit of songs is exceeded
	//if it is block and create new
	if ($song_number >= $song_limit){
		//trow error cuz out of songs for list
		//dont do error create new tmplist named tmpList + $req +1
		if ($debug == true) echo nl2br("ERROR: exceeded song limit created new list\n");
		$error_array = add_error($error_array, $error_count,"Exceeded song limit for current request list, created new one so try again the song again!"); 
		$exec_command = "php insertList.php ".$req_id;
		exec ($exec_command);
	}



	else{
		
		//+1 to number
		$song_number = $song_number + 1;
		
		//check for song link
		if ($has_song_link == true){
			//gotta find if utube link
			//echo nl2br("HAS LINK YAY\n");
			if (strpos($song_link, 'youtube') !== false) {
				//its utube link motherfuckers
				//user smth else that gives only xml 
				$linkArr = explode("?",$song_link);
				$video_id =  substr($linkArr[1],2);
				//echo $video_id;
				$html = file_get_contents("http://youtube.com/get_video_info?video_id=".$video_id);
				parse_str($html, $ytarr);
				//echo $ytarr['title'];
				//got title now in $ytarr['title']
				$artist_title = explode("-",$ytarr['title']);
				$song_artist = preg_replace('/\s+/', ' ', $artist_title[0]);
				//title is everything on the left after first one
				//problems with songs from A-cray cuz he cray-cray
				$song_title = preg_replace('/\s+/', ' ', $artist_title[1]);				
				
				//replace ' with `
				$song_artist = str_replace("'", "´", $song_artist);
				$song_title = str_replace("'", "´", $song_title);	
				//ok check stuff now
				if (($song_artist === "") || ($song_title === ""))
					$error_array = add_error($error_array, $error_count,"The video title is incorrect cannot parse");
			}
			
			else if (strpos($song_link, 'youtu.be') !== false){
				//its utube link motherfuckers
				//user smth else that gives only xml 
				$linkArr = explode("?",$song_link);
				$linkArr = explode("/",$linkArr[0]);
				$video_id =  $linkArr[count($linkArr)-1];
				//echo "VIDEOID IS ".$video_id;
				$html = file_get_contents("http://youtube.com/get_video_info?video_id=".$video_id);
				parse_str($html, $ytarr);
				//echo $ytarr['title'];
				//got title now in $ytarr['title']
				$artist_title = explode("-",$ytarr['title']);
				$song_artist = preg_replace('/\s+/', ' ', $artist_title[0]);
				$song_title = preg_replace('/\s+/', ' ', $artist_title[1]);				
				
				$song_artist = str_replace("'", "´", $song_artist);
				$song_title = str_replace("'", "´", $song_title);	
				
				//ok check stuff now
				if (($song_artist === "") || ($song_title === ""))
					$error_array = add_error($error_array, $error_count,"The video title is incorrect cannot parse");				
				
				
			}
			//parse_str($content, $ytarr);
			//echo "CONTENT IS:".$ytarr;
			else{
				$error_array = add_error($error_array, $error_count,"The link you entered is not a youtube link, for now only youtube links work!");
			
			}
			
		}
		

		
		$sql = "INSERT INTO songs (number, title, artist, user, request_id) VALUES ($song_number, '$song_title', '$song_artist', '$song_user', $req_id)";

		if (count($error_array) == 0 && $conn->query($sql) === TRUE ) {
			if($debug == true) echo nl2br("New song record inserted successfully. \n $sql \n");
		} 
		else {
			if ($debug == true) echo nl2br("Error with query:  $sql \n" . $conn->error);
			$error_array = add_error($error_array, $error_count,"Error with query:  $sql \n" . $conn->error); 
		}	
	}


	if (empty($error_array)){ 
		if ($debug == true) echo nl2br("NO ERRORS\n");
			$json_array["message"] = array("NO ERROR",$song_artist,$song_title,$song_user); 
		}
	else {
		//$json_array["errors"] = array();
                $json_array["message"] = array("YES ERROR");
		$json_array["errors"] = $error_array;
	}

	$json_response = json_encode($json_array);
	echo $json_response;

	$conn->close();
}

?> 