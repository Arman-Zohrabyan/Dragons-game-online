$(document).ready(function () {
  var yourDragonName = dragonName;

  var chatContent = 
  '<div id="menu">' +
    '<p class="welcome">Чат в стадии разработки)' +
  '</div>' +
  '<div id="chatbox"></div>' +
  '<form name="message" id="form" action="">' +
    '<input name="usermsg" type="text" id="usermsg" placeholder="Сообщение" />' +
    '<input name="submitmsg" type="submit"  id="submitmsg" value="Отправить" />' +
  '</form>';

  $("#chat").append(chatContent);
  $("#chat").width($("#canvas").width()*2/11 - 20);
  $("#chat").height($("#canvas").height()*3/7);
  $("#chatbox").height($("#chat").height() - $("#form").height() - $("#menu").height() - 45);


  socket.on('get message', function(dragonName, message) {
    $("#chatbox").prepend("<p><b>" + dragonName + ":</b> " + message + "</p>");
  });


  $("#submitmsg").on('click', function(e) {
    e.preventDefault();
    var msg = $("#usermsg").val();
    // 0 или пустое сообщение не отправляем
    if(msg) {
      socket.emit('send message', yourDragonName, msg);
      $("#usermsg").val("");
    }

  });

});