import { Box, FormControl, FormLabel, IconButton, Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { FaTelegramPlane } from "react-icons/fa";

let socket: Socket;

type Message = {
  author: string;
  message: string;
};

export default function Chat() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<Message>>([]);

  useEffect(() => {
    socketInitializer();
  }, []);

  const sendMessage = async () => {
    socket.emit("createdMessage", { author: username, message });
    setMessages((currentMsg) => [...currentMsg, { author: username, message }]);
    setMessage("");
  };

  const socketInitializer = async () => {
    socket = io("http://localhost:4040");

    socket.on("newIncomingMessage", (msg) => {
      setMessages((currentMsg) => [...currentMsg, { author: msg.author, message: msg.message }]);
    });
  };

  const handleKeypress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.keyCode === 13) {
      if (message) {
        sendMessage();
      }
    }
  };

  return (
    <>
      <Head>
        <title>FaSock chat-app</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box as="main">
        <FormControl isRequired>
          <FormLabel>How people should call you?</FormLabel>
          <Input type="text" onChange={(e) => setUsername(e.target.value)} />
        </FormControl>
        <InputGroup>
          <InputRightElement pointerEvents="none" children={<IconButton colorScheme="blue" aria-label="Send message" icon={<FaTelegramPlane />} onClick={sendMessage} />} />
          <Input type="text" onKeyUp={handleKeypress} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." />
        </InputGroup>

        {messages.map((msg, i) => {
          return (
            <div key={i}>
              {msg.author} : {msg.message}
            </div>
          );
        })}
      </Box>
    </>
  );
}