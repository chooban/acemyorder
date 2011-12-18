<?php
	$files = array();
	$files['files'] = array();
	$files['files'][] = "ecmail440.csv";
	$files['files'][] = "ecmail439.csv";
	$files['files'][] = "ecmail438.csv";
	$jsonfiles = json_encode( $files );

	die( $jsonfiles );
?>
