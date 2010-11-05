<?php
    $dir = './';
    $fp = fopen( $dir.'/wadbug_code.js', 'r');
    if ( !$fp ){
        exit();
    }
     
    $codeToExecute = fread($fp, 8192);
    fclose($fp);
    // Disregard any content after <<<<
    $eof = strpos($codeToExecute, "<<<<");
    $eof = $eof === 0 ? strlen($codeToExecute) : $eof;
    $codeToExecute = substr( $codeToExecute, 0, $eof );
    
    // Send back the hash (well, a few characters of it)
    echo substr( md5( $codeToExecute ), 0, 5 );
    // Followed by a pipe
    echo "|";
    // Followed by the code to execute
    echo $codeToExecute;
?>
