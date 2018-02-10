$(document).ready(function () {
  var yourDragonName = dragonName;

  // $("#chat").append(chatContent);
  $("#chat").width($("#canvas").width()*2/11 - 20);
  $("#chat").height($("#canvas").height()*3/7);
  $("#chatbox").height($("#chat").height() - $("#form").height() - $("#menu").height() - 45);


  socket.on('get message', function(dragonName, message) {
    $("#chatbox").prepend("<p><b>" + dragonName + ":</b> " + message + "</p>");
  });


  $("#submitmsg").on('click', function(e) {
    e.preventDefault();
    var msg = $("#usermsg").val();
    msg = msg.replace(/<(?:.|\n)*?>/gm, '');
    // 0 или пустое сообщение не отправляем    (Символы < или > не допускаются. Все что будет внутри <> - будет удалено)
    // символы <> будут использовать только те кто знаком с HTML и то, что бы типа "взломать" мой код :D так что это не баг :P ))))
    if(msg) {
      socket.emit('send message', yourDragonName, msg);
      $("#usermsg").val("");
    }

  });

});