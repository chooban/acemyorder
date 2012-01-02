<?php

    header("Content-type: text/csv");
    header("Content-Disposition: filename=export.csv");
    header("Pragma: no-cache");
    header("Expires: 0");

    print base64_decode( $_REQUEST['encodeddata'] );

?>