<?php
	$files = array();	
	$files['files'] = array();
	#$files['files'][] = "ecmail440.csv";
	#$files['files'][] = "ecmail439.csv";
	#$files['files'][] = "ecmail438.csv";
	
	$filenames =  glob( 'csv/ecmail*.csv' ); 
	arsort( $filenames );
	
	foreach( $filenames as $filename ) {
		$files['files'][] = basename( $filename );
	}
	$jsonfiles = json_encode( $files );

	die( $jsonfiles );
?>
