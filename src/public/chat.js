const messagesDiv = document.querySelector(".messages")
const inputField = document.querySelector("#message-field")
function chat(socket) {
     inputField.addEventListener('keydown', (event) => {
          if (event.key == 'Enter') {
               socket.emit("message", {
                    str: inputField.value,
                    color: "black"
               })
               inputField.value = ""
          }
     })
     socket.on('new message', (message) => {
          add_to_chat(message)
     })
}
function add_to_chat(message) {
     const messageDiv = document.createElement('div')
     const textnode = document.createTextNode(message.str);
     messageDiv.style.color = message.color;
     messageDiv.appendChild(textnode)
     messagesDiv.appendChild(messageDiv)
}

export {
     chat,add_to_chat
};