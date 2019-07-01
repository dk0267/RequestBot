<?php
 //LOCALS
 $servername = "localhost";
 $username = "some_mysql_username";
 $password = "some_mysql_password";
 $dbname = "some_dbname";


$json_array = array();
$debug = true;


//ERROR FUNCTION TO BUILD JSON LIST
$error_array = array();
$error_count = 0;//global variable for erroc count
function add_error($array, $error_number, $error_text){
	//preset error name
	$error_name = "error";
	//echo nl2br("NEW ERROR NAME: ".$error_name.$error_number."\n");
	//$error_name = $error_name.$error_number;
	array_push($array , $error_text);
	//echo nl2br("NEW IN ARRAY ".$array[$error_name]."\n");
	global $error_count;
	$error_count = $error_number + 1;
	
	return $array;
}

//how to get raw json_decode
//header('Content-Type: application/json');
//echo $jsonData;
//https://stackoverflow.com/questions/15810257/create-nested-json-object-in-php
//https://stackoverflow.com/questions/383631/json-encode-mysql-results
//https://stackoverflow.com/questions/30155231/create-nested-json-object-using-php-mysql


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
$req_id = -1;
$req_id = $_GET["id"];

if ($req_id === "") {
	$sql = "SELECT id FROM requests ORDER BY id DESC";
	$result = $conn->query($sql);
	if ($result->num_rows > 0) {
    // output data of each row
		$row = $result->fetch_assoc();
		$req_id = $row["id"];
		if ($debug == true) echo nl2br("Request list id found: $req_id \r\n");
	}
	else {
		if ($debug == true) echo nl2br("ERROR NO LISTS IN DATABASE");
		$error_array = add_error($error_array,$error_count, "Error no request lists in database");
	}
}

if ($debug == true) echo nl2br("Request list id is: $req_id \n");

//ok got my request id time to build some JSON BOOOI

//TODO GET REQUEST + SONGS FOR REQUEST all into JSON
$json_array = array();
$sql_request = "SELECT * FROM requests WHERE id = $req_id";
$result_request = $conn->query($sql_request);
if ($result_request->num_rows > 0) {

	while($row_request = $result_request->fetch_assoc()) {
		//now loop
		if ($debug == true) echo nl2br("Request list name is: ". $row_request["name"] ."\n");
		$row_array = array();
		$row_array["id"] = $row_request["id"];
		$row_array["name"] = $row_request["name"];
		$row_array["date_start"] = $row_request["date_start"];
		$row_array["date_end"] = $row_request["date_end"];
		$row_array["song_limit"] = $row_request["song_limit"];	
		$row_array["song_list"] = array();
		//got all request list data, now for actual songlist
		//new sql for req_id
		$sql_songs = "SELECT * FROM songs WHERE request_id = $req_id";
		$result_songs = $conn->query($sql_songs);
		if ($result_songs->num_rows > 0) {
			while($row_song = $result_songs->fetch_assoc()) {
				if ($debug == true) echo nl2br("Song title: ". $row_song["title"]. "\n");
				$row_array["song_list"][] = array(
					//build song
					"number" => $row_song["number"],
					"artist" => $row_song["artist"],
					"title" => $row_song["title"],
					"user" => $row_song["user"],					
				);
			}
			//push the row with songs into json return array
			

		}
		else {
			if($debug  == true) echo nl2br("Error: Found no songs for list ID: $req_id with query: $sql_songs \nCould list be empty?\n");
			//$error_array = add_error($error_array,$error_count, "Error: Found no songs for list ID: $req_id with query: $sql_songs");
		}
		array_push($json_array, $row_array);

	}	
}	
else {
	if ($debug == true) echo nl2br("Found no request lists with query: $sql_request \n");
	$error_array = add_error($error_array,$error_count, "Found no request lists with query: $sql_request");
	$error_array = add_error($error_array,$error_count, "Found nho request lists with query: $sql_request");
}

if (empty($error_array)){ 
	if ($debug == true) echo nl2br("NO ERRORS\n");
		$json_array["message"] = array("NO ERROR","SUCCESSFULLY RETURNED LIST"); 
	}
else {
	//$json_array["errors"] = array();
	$json_array["message"] = array("YES ERROR");
	$json_array["errors"] = $error_array;
}

$json_response = json_encode($json_array);
echo $json_response;

$conn->close();
?> 