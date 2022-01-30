<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP - Hello, World!</title>
</head>
<body>
    <?php $request = json_decode(file_get_contents("php://input"), true); ?>
    <h1><?php echo $request[type].' '.$request[id]; ?></h1>
    <?php var_dump($request);?>
</body>
</html>