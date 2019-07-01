 <?php
 //LOCALS
 $servername = "localhost";
 $username = "some_mysql_username";
 $password = "some_mysql_password";
 $dbname = "some_dbname";


$json_array = array();
$debug = false;


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
$req_name = $_GET["name"];
$req_date = $_GET["date"];
$req_limit = $_GET["limit"];
$req_user= $_GET["user"];

if ($req_name === ""){
//ERROR NO SONG TITLE TO ADD SONG
	if ($debug == true) echo nl2br("Error: no list name parameter");
	$error_array = add_error($error_array,$error_count, "No list name parameter provided");
}
//proper formating
else{
	$req_name = str_replace("'", "´", $req_name);	
}

if ($req_date == ""){
	//if ($debug === true) echo nl2br("Error: no start date parameter");
	//$error_array = add_error($error_array,$error_count, "No song artist parameter provided");
	//if no date then use today
	$req_date = date("Y-m-d");
}
else{
	$req_date = str_replace("'", "´", $req_date);	
}

if ($req_limit == ""){
	if ($debug === true) echo nl2br("Error: no song limit parameter");
	$error_array = add_error($error_array,$error_count, "No song limit parameter provided");
}
else{
	$req_date = str_replace("'", "´", $req_date);	
}

if ($req_user == ""){
	if ($debug == true) echo nl2br("Error: no user parameter");
	$error_array = add_error($error_array,$error_count, "No user parameter provided");
}
else{
	$req_user = str_replace("'", "´", $req_user);
}

if (count($argv) > 0){
	//we do insert because it was executed by insertsong
	$last_id = intval($argv[count($argv)-1])+1;
	$sql = "INSERT INTO requests (name,date_start,song_limit) values ('tmpListName$last_id','".date("Y-m-d")."',60)";
	if (count($error_array) == 0 && $conn->query($sql) === TRUE ) {
		if($debug == true) echo nl2br("New request list inserted successfully. \n $sql \n");
	}
	
}

else if (count($error_array) == 0){
//if no errors we can add
	$sql = "INSERT INTO requests (name,date_start,song_limit) values ('$req_name','$req_date',$req_limit)";
	//echo nl2br("Inserting new list. \n $sql \n");	
	if (count($error_array) == 0 && $conn->query($sql) === TRUE ) {
		if($debug == true) echo nl2br("New request list inserted successfully. \n $sql \n");
	}
	
}





if (count($error_array) == 0){ 
	if ($debug == true) echo nl2br("NO ERRORS\n");
		$json_array["message"] = array("NO ERROR","Successfully added list and made it recent"); 
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