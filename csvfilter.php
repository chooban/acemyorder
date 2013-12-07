<?php

# Look through the directory and get the latest file.
# Then slurp it in and return it alongwith the filename.
$filenames = glob( 'csv/ecmail*.csv' ); 
asort( $filenames );
$filename = array_pop( $filenames );

# The files always come in as ISO-8859-1 and I suppose I could 
# convert them before uploading but I can't be bothered.
$contents = utf8_encode( file_get_contents( $filename ) );

$pathinfo = pathinfo( $filename );
file_put_contents('php://stderr', print_r($pathinfo['filename'], TRUE));
$files = array();	
$files['file'] = $pathinfo['filename'];
$files['contents'] = $contents;

$jsonfiles = json_encode( $files );

header("Content-type: text/json");
header("Pragma: no-cache");
header("Expires: 0");

print $jsonfiles;
?>
