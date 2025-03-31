<!doctype html>
<html>
<head>
</head>
<body>
   <p> <h2>IES Tierno Galvan </h2></p>
   <p> <h3>Trabajo: Lenguajes de marcas - HTML </h3></p>
   <p> <hr>
   <p> <h3>Recibiendo datos en localhost</h3></p>
   <?php 
	
	echo "<p>"."Mensaje recibido desde la prueba de clase." . "</p>" . "<hr />";
	echo "<p>"."Variables GET"."</p>";
	// receptor.php
	$tiene = array();
	$no_tiene = array();
	// recorremos $_GET con foreach 
	foreach ($_GET as $nombre_var => $valor_var) {
	    if (empty($valor_var)) {
	        $no_tiene[$nombre_var] = $valor_var;
	    } else {
	        $tiene[$nombre_var] = $valor_var;
	    }
	}
	// var_dump() vuelca informacion estructurada sobre una variable
	echo "<pre>";
	$total = count($no_tiene) + count($tiene);
	echo "total variables: ".$total."<br />";
	echo "variables definidas: ".count($tiene)."<br />";
	var_dump($tiene);
	if (!empty($no_tiene)) {
	    echo "variables vacias: ".count($no_tiene)."<br />";
	    var_dump($no_tiene);
	}
	echo "</pre>";

	echo "<p> Variables POST </p>";
	// receptor.php
	$tiene = array();
	$no_tiene = array();
	// recorremos $_POST con foreach
	foreach ($_POST as $nombre_var => $valor_var) {
	    if (empty($valor_var)) {
	        $no_tiene[$nombre_var] = $valor_var;
	    } else {
	        $tiene[$nombre_var] = $valor_var;
	    }
	}
	// var_dump() vuelca informacion estructurada sobre una variable
	echo "<pre>";
	$total = count($no_tiene) + count($tiene);
	echo "total variables: ".$total."<br />";
	echo "variables definidas: ".count($tiene)."<br />";
	var_dump($tiene);
	if (!empty($no_tiene)) {
	    echo "variables vacias: ".count($no_tiene)."<br />";
	    var_dump($no_tiene);
	}
	echo "</pre>";


   ?>
</body>
</html>