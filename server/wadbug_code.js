alert('Working! This alert was loaded from the wadbug_code.js file.');
<<<< // Anything after the 4 arrows won't get returned...

// Click the toggle buttons
$("#wadbug-toggle > span:eq(0)").click();

// Enter a console cmd
$("#wadbug-console input:first").val(":wadbug");
$("#wadbug-console > span:eq(0)").click();
