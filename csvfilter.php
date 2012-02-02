<?php
	$files = array();	
	$files['files'] = array();
	$filenames =  glob( 'csv/ecmail*.csv' ); 
	asort( $filenames );
	
	# Just the latest one, thanks
	$files['files'][] = basename( array_pop( $filenames ) );
	
	$jsonfiles = json_encode( $files );

	die( $jsonfiles );
?>
