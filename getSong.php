 <?php
//RETURN LAST ADDED SONG, BY USER IF PROVIDED, OR BY ARTIST AND TITLE IF PROVIDED
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
	$array[$error_name] = $error_text;
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

if ($song_title === ""){
//ERROR NO SONG TITLE TO ADD SONG
	if ($debug == true) echo nl2br("Error: no song title parameter");
	$error_array = add_error($error_array,$error_count, "No song title parameter provided");
}
else if ($song_artist === ""){
	if ($debug === true) echo nl2br("Error: no song artist parameter");
	$error_array = add_error($error_array,$error_count, "No song artist parameter provided");
}

else if ($song_user === ""){
	if ($debug == true) echo nl2br("Error: no user parameter");
	$error_array = add_error($error_array,$error_count, "No user parameter provided");
}



$req_id = -1;
$song_number = 1;
$song_limit = -1;


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
} else {
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
	$song_number = 1;
    if ($debug == true) echo nl2br("0 songs in list, defaulting to 1.\n");	
}

//gotta check if limit of songs is exceeded
//if it is block and create new
if ($song_number >= $song_limit){
	//trow error cuz out of songs for list
	if ($debug == true) echo nl2br("ERROR: exceeded song limit\n");
	$error_array = add_error($error_array, $error_count,"Exceeded song limit for current request list, please contanct admin to create new one!"); 
}
else{
	$sql = "INSERT INTO songs (number, title, artist, user, request_id) VALUES ($song_number, '$song_title', '$song_artist', '$song_user', $req_id)";

	if ($conn->query($sql) === TRUE) {
		echo nl2br("New song record inserted successfully. \n");
	} 
	else {
		if ($debug == true) echo nl2br("Error with query:  $sql \n" . $conn->error);
		$error_array = add_error($error_array, $error_count,"Error with query:  $sql \n" . $conn->error); 
	}	
}


if (empty($error_array)){ 
	if ($debug == true) echo nl2br("NO ERRORS\n");
		$json_array["message"] = "NO ERROR"; 
	}
else {
	//$json_array["errors"] = array();
	$json_array["errors"] = $error_array;
}

$json_response = json_encode($json_array);
echo $json_response;

$conn->close();
?> 